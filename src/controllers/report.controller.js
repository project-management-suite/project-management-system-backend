// src/controllers/report.controller.js
const { supabase } = require('../config/supabase');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate weekly progress report for a project
 */
exports.getWeeklyReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate } = req.query;

    // Calculate week dates
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(start.getDate() - start.getDay()); // Start of current week
    }
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // End of week

    // Verify user has access to project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_name, owner_manager_id')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is manager/admin or assigned developer
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && project.owner_manager_id !== req.user.user_id) {
      // Check if user is assigned to any tasks in this project
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('assignment_id')
        .eq('developer_id', req.user.user_id)
        .in('task_id',
          supabase
            .from('tasks')
            .select('task_id')
            .eq('project_id', projectId)
        )
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    // Get tasks data for the week
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        task_id, title, status, start_date, end_date, created_at, updated_at,
        task_assignments(
          developer_id,
          profiles(username, email)
        )
      `)
      .eq('project_id', projectId)
      .or(
        `created_at.gte.${start.toISOString()},` +
        `updated_at.gte.${start.toISOString()},` +
        `end_date.gte.${start.toISOString().split('T')[0]}`
      );

    if (tasksError) throw tasksError;

    // Calculate metrics
    const metrics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
      overdueTasks: tasks.filter(t =>
        t.end_date && new Date(t.end_date) < new Date() && t.status !== 'COMPLETED'
      ).length,
      tasksCreatedThisWeek: tasks.filter(t =>
        new Date(t.created_at) >= start && new Date(t.created_at) <= end
      ).length,
      tasksCompletedThisWeek: tasks.filter(t =>
        new Date(t.updated_at) >= start && new Date(t.updated_at) <= end && t.status === 'COMPLETED'
      ).length
    };

    // Calculate team productivity
    const developerStats = {};
    tasks.forEach(task => {
      if (task.task_assignments && task.task_assignments.length > 0) {
        task.task_assignments.forEach(assignment => {
          const devId = assignment.developer_id;
          const devName = assignment.profiles.username;

          if (!developerStats[devId]) {
            developerStats[devId] = {
              name: devName,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0
            };
          }

          developerStats[devId].totalTasks++;
          if (task.status === 'COMPLETED') developerStats[devId].completedTasks++;
          if (task.status === 'IN_PROGRESS') developerStats[devId].inProgressTasks++;
        });
      }
    });

    const reportData = {
      project: {
        id: projectId,
        name: project.project_name
      },
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      metrics,
      developerStats: Object.values(developerStats),
      tasks: tasks.map(task => ({
        id: task.task_id,
        title: task.title,
        status: task.status,
        startDate: task.start_date,
        endDate: task.end_date,
        assignees: task.task_assignments?.map(a => a.profiles.username) || []
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    };

    res.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
};

/**
 * Generate monthly progress report
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { month, year } = req.query;

    // Calculate month dates
    const currentDate = new Date();
    const reportMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const reportYear = year ? parseInt(year) : currentDate.getFullYear();

    const start = new Date(reportYear, reportMonth, 1);
    const end = new Date(reportYear, reportMonth + 1, 0); // Last day of month

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_name, description, owner_manager_id, created_at')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Authorization check (same as weekly report)
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && project.owner_manager_id !== req.user.user_id) {
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('assignment_id')
        .eq('developer_id', req.user.user_id)
        .in('task_id',
          supabase
            .from('tasks')
            .select('task_id')
            .eq('project_id', projectId)
        )
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    // Get all project tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        task_id, title, description, status, start_date, end_date, created_at, updated_at,
        task_assignments(
          assignment_id, assigned_at,
          profiles(user_id, username, email)
        )
      `)
      .eq('project_id', projectId);

    if (tasksError) throw tasksError;

    // Get milestones
    const { data: milestones } = await supabase
      .from('milestones')
      .select('milestone_id, milestone_name, due_date, status, progress_percentage, completion_date')
      .eq('project_id', projectId);

    // Calculate comprehensive metrics
    const allTasks = tasks || [];
    const monthTasks = allTasks.filter(t => {
      const taskDate = new Date(t.created_at);
      return taskDate >= start && taskDate <= end;
    });

    const completedThisMonth = allTasks.filter(t => {
      const updateDate = new Date(t.updated_at);
      return t.status === 'COMPLETED' && updateDate >= start && updateDate <= end;
    });

    const metrics = {
      totalTasks: allTasks.length,
      tasksCreatedThisMonth: monthTasks.length,
      tasksCompletedThisMonth: completedThisMonth.length,
      completionRate: allTasks.length > 0 ?
        Math.round((allTasks.filter(t => t.status === 'COMPLETED').length / allTasks.length) * 100) : 0,
      overdueTasks: allTasks.filter(t =>
        t.end_date && new Date(t.end_date) < new Date() && t.status !== 'COMPLETED'
      ).length,
      statusDistribution: {
        pending: allTasks.filter(t => t.status === 'PENDING').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: allTasks.filter(t => t.status === 'COMPLETED').length
      },
      milestones: {
        total: milestones?.length || 0,
        completed: milestones?.filter(m => m.status === 'COMPLETED').length || 0,
        overdue: milestones?.filter(m =>
          m.due_date && new Date(m.due_date) < new Date() && m.status !== 'COMPLETED'
        ).length || 0
      }
    };

    // Team performance analysis
    const teamStats = {};
    allTasks.forEach(task => {
      if (task.task_assignments) {
        task.task_assignments.forEach(assignment => {
          const dev = assignment.profiles;
          if (!teamStats[dev.user_id]) {
            teamStats[dev.user_id] = {
              name: dev.username,
              email: dev.email,
              tasksAssigned: 0,
              tasksCompleted: 0,
              tasksInProgress: 0,
              tasksPending: 0,
              avgCompletionTime: 0
            };
          }

          teamStats[dev.user_id].tasksAssigned++;

          if (task.status === 'COMPLETED') {
            teamStats[dev.user_id].tasksCompleted++;
          } else if (task.status === 'IN_PROGRESS') {
            teamStats[dev.user_id].tasksInProgress++;
          } else {
            teamStats[dev.user_id].tasksPending++;
          }
        });
      }
    });

    const reportData = {
      project: {
        id: projectId,
        name: project.project_name,
        description: project.description,
        createdAt: project.created_at
      },
      period: {
        month: reportMonth + 1,
        year: reportYear,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      metrics,
      teamStats: Object.values(teamStats),
      milestones: milestones || [],
      recentActivity: {
        tasksCreated: monthTasks,
        tasksCompleted: completedThisMonth
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    };

    res.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
};

/**
 * Generate custom date range report
 */
exports.getCustomReport = async (req, res) => {
  try {
    const { startDate, endDate, projectId, includeTeamStats = true } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Build query based on scope
    let query = supabase.from('tasks').select(`
      task_id, title, status, start_date, end_date, created_at, updated_at, project_id,
      projects(project_name, owner_manager_id),
      task_assignments(
        profiles(user_id, username, email)
      )
    `);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      // For system-wide reports, check user permissions
      if (req.user.role === 'DEVELOPER') {
        // Developers can only see their assigned tasks
        query = query.in('task_id',
          supabase.from('task_assignments')
            .select('task_id')
            .eq('developer_id', req.user.user_id)
        );
      }
    }

    const { data: tasks, error: tasksError } = await query
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (tasksError) throw tasksError;

    // Calculate metrics
    const projects = {};
    const developers = {};

    tasks.forEach(task => {
      // Project metrics
      const projId = task.project_id;
      if (!projects[projId]) {
        projects[projId] = {
          id: projId,
          name: task.projects.project_name,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0
        };
      }

      projects[projId].totalTasks++;
      if (task.status === 'COMPLETED') projects[projId].completedTasks++;
      else if (task.status === 'IN_PROGRESS') projects[projId].inProgressTasks++;
      else projects[projId].pendingTasks++;

      // Developer metrics (if requested)
      if (includeTeamStats && task.task_assignments) {
        task.task_assignments.forEach(assignment => {
          const dev = assignment.profiles;
          if (!developers[dev.user_id]) {
            developers[dev.user_id] = {
              id: dev.user_id,
              name: dev.username,
              email: dev.email,
              totalTasks: 0,
              completedTasks: 0,
              productivity: 0
            };
          }

          developers[dev.user_id].totalTasks++;
          if (task.status === 'COMPLETED') {
            developers[dev.user_id].completedTasks++;
          }
        });
      }
    });

    // Calculate productivity scores
    Object.values(developers).forEach(dev => {
      dev.productivity = dev.totalTasks > 0 ?
        Math.round((dev.completedTasks / dev.totalTasks) * 100) : 0;
    });

    const reportData = {
      period: {
        start: startDate,
        end: endDate,
        totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalTasks: tasks.length,
        totalProjects: Object.keys(projects).length,
        totalDevelopers: Object.keys(developers).length,
        overallCompletionRate: tasks.length > 0 ?
          Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0
      },
      projects: Object.values(projects),
      teamStats: includeTeamStats ? Object.values(developers) : undefined,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username
    };

    res.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
};

/**
 * Get dashboard analytics overview
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;

    // Get user's projects based on role
    let projectQuery = supabase.from('projects').select('project_id, project_name, created_at');

    if (userRole === 'DEVELOPER') {
      // Developers see only projects they're assigned to
      projectQuery = projectQuery.in('project_id',
        supabase.from('task_assignments')
          .select('task_id')
          .eq('developer_id', userId)
          .then(({ data }) => {
            const taskIds = data?.map(a => a.task_id) || [];
            return supabase.from('tasks')
              .select('project_id')
              .in('task_id', taskIds)
              .then(({ data: tasks }) => tasks?.map(t => t.project_id) || []);
          })
      );
    } else if (userRole === 'MANAGER') {
      // Managers see their own projects
      projectQuery = projectQuery.eq('owner_manager_id', userId);
    }
    // ADMIN sees all projects (no filter)

    const { data: projects, error: projectsError } = await projectQuery;
    if (projectsError) throw projectsError;

    const projectIds = projects?.map(p => p.project_id) || [];

    // Get tasks for user's projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_id, status, created_at, end_date, project_id')
      .in('project_id', projectIds);

    if (tasksError) throw tasksError;

    // Get user's assigned tasks (for developers)
    let userTasks = [];
    if (userRole === 'DEVELOPER') {
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select(`
          task_id,
          tasks(task_id, status, created_at, end_date, title)
        `)
        .eq('developer_id', userId);

      userTasks = assignments?.map(a => a.tasks) || [];
    }

    // Calculate current month dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate metrics
    const analytics = {
      overview: {
        totalProjects: projects?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === 'COMPLETED').length || 0,
        overdueTasks: tasks?.filter(t =>
          t.end_date && new Date(t.end_date) < now && t.status !== 'COMPLETED'
        ).length || 0
      },
      thisMonth: {
        tasksCreated: tasks?.filter(t =>
          new Date(t.created_at) >= monthStart && new Date(t.created_at) <= monthEnd
        ).length || 0,
        tasksCompleted: tasks?.filter(t =>
          t.status === 'COMPLETED' && new Date(t.created_at) >= monthStart
        ).length || 0
      },
      statusDistribution: {
        pending: tasks?.filter(t => t.status === 'PENDING').length || 0,
        inProgress: tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0,
        completed: tasks?.filter(t => t.status === 'COMPLETED').length || 0
      },
      projectBreakdown: projects?.map(project => {
        const projectTasks = tasks?.filter(t => t.project_id === project.project_id) || [];
        return {
          id: project.project_id,
          name: project.project_name,
          totalTasks: projectTasks.length,
          completedTasks: projectTasks.filter(t => t.status === 'COMPLETED').length,
          progressPercentage: projectTasks.length > 0 ?
            Math.round((projectTasks.filter(t => t.status === 'COMPLETED').length / projectTasks.length) * 100) : 0
        };
      }) || []
    };

    // Add personal stats for developers
    if (userRole === 'DEVELOPER') {
      analytics.personal = {
        assignedTasks: userTasks.length,
        completedTasks: userTasks.filter(t => t.status === 'COMPLETED').length,
        pendingTasks: userTasks.filter(t => t.status === 'PENDING').length,
        inProgressTasks: userTasks.filter(t => t.status === 'IN_PROGRESS').length,
        productivity: userTasks.length > 0 ?
          Math.round((userTasks.filter(t => t.status === 'COMPLETED').length / userTasks.length) * 100) : 0
      };
    }

    res.json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard analytics' });
  }
};

/**
 * Export report to PDF
 */
exports.exportReportPDF = async (req, res) => {
  try {
    const { reportType, projectId, startDate, endDate } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    // Generate report data based on type
    let reportData;
    switch (reportType) {
      case 'weekly':
        if (!projectId) return res.status(400).json({ error: 'Project ID required for weekly reports' });
        reportData = await generateWeeklyReportData(projectId, startDate, req.user);
        break;
      case 'monthly':
        if (!projectId) return res.status(400).json({ error: 'Project ID required for monthly reports' });
        reportData = await generateMonthlyReportData(projectId, startDate, req.user);
        break;
      case 'custom':
        reportData = await generateCustomReportData(startDate, endDate, projectId, req.user);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `${reportType}_report_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../../uploads', filename);

    // Ensure uploads directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    doc.pipe(require('fs').createWriteStream(filepath));

    // Add content to PDF
    doc.fontSize(20).text('Project Management Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Generated by: ${req.user.username}`);
    doc.moveDown();

    if (reportData.project) {
      doc.fontSize(16).text('Project Information');
      doc.fontSize(12).text(`Project: ${reportData.project.name}`);
      if (reportData.project.description) {
        doc.text(`Description: ${reportData.project.description}`);
      }
      doc.moveDown();
    }

    doc.fontSize(16).text('Period');
    doc.fontSize(12).text(`From: ${reportData.period.start}`);
    doc.text(`To: ${reportData.period.end}`);
    doc.moveDown();

    if (reportData.metrics) {
      doc.fontSize(16).text('Metrics');
      doc.fontSize(12);
      Object.entries(reportData.metrics).forEach(([key, value]) => {
        if (typeof value === 'object') {
          doc.text(`${key}:`);
          Object.entries(value).forEach(([subKey, subValue]) => {
            doc.text(`  ${subKey}: ${subValue}`);
          });
        } else {
          doc.text(`${key}: ${value}`);
        }
      });
      doc.moveDown();
    }

    if (reportData.teamStats && reportData.teamStats.length > 0) {
      doc.fontSize(16).text('Team Performance');
      doc.fontSize(12);
      reportData.teamStats.forEach(member => {
        doc.text(`${member.name}:`);
        doc.text(`  Tasks: ${member.totalTasks || member.tasksAssigned || 0}`);
        doc.text(`  Completed: ${member.completedTasks || member.tasksCompleted || 0}`);
        if (member.productivity) {
          doc.text(`  Productivity: ${member.productivity}%`);
        }
        doc.moveDown(0.5);
      });
    }

    doc.end();

    // Save report metadata to database
    const { data: savedReport, error: saveError } = await supabase
      .from('reports')
      .insert({
        report_name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        report_type: reportType,
        project_id: projectId || null,
        generated_by: req.user.user_id,
        report_data: reportData,
        date_from: startDate || reportData.period.start,
        date_to: endDate || reportData.period.end,
        file_path: filepath
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
    }

    res.json({
      success: true,
      message: 'Report generated successfully',
      reportId: savedReport?.report_id,
      downloadUrl: `/api/reports/download/${savedReport?.report_id}`,
      filename
    });

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export report to PDF' });
  }
};

// Helper functions for PDF generation
async function generateWeeklyReportData(projectId, startDate, user) {
  // Implementation similar to getWeeklyReport but returns data instead of response
  // This would be extracted from the getWeeklyReport logic
  return { project: {}, period: {}, metrics: {}, teamStats: [] };
}

async function generateMonthlyReportData(projectId, startDate, user) {
  // Implementation similar to getMonthlyReport but returns data instead of response
  return { project: {}, period: {}, metrics: {}, teamStats: [] };
}

async function generateCustomReportData(startDate, endDate, projectId, user) {
  // Implementation similar to getCustomReport but returns data instead of response
  return { period: {}, summary: {}, projects: [], teamStats: [] };
}
