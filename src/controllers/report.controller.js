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
 * Get comprehensive manager analytics with KPIs
 */
exports.getManagerAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const { projectId, timeRange = '30' } = req.query; // timeRange in days

    // Only managers and admins can access
    if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Manager or Admin role required.' });
    }

    // Calculate date ranges
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get manager's projects
    let projectQuery = supabase.from('projects').select('project_id, project_name, created_at, start_date, end_date');

    if (userRole === 'MANAGER') {
      projectQuery = projectQuery.eq('owner_manager_id', userId);
    }

    if (projectId) {
      projectQuery = projectQuery.eq('project_id', projectId);
    }

    const { data: projects, error: projectsError } = await projectQuery;
    if (projectsError) throw projectsError;

    const projectIds = projects?.map(p => p.project_id) || [];

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        analytics: {
          overview: {},
          velocity: {},
          teamPerformance: {},
          projectHealth: {},
          trends: {}
        }
      });
    }

    // Get all tasks for these projects
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectIds);

    // Get subtasks
    const taskIds = tasks?.map(t => t.task_id) || [];
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('*')
      .in('parent_task_id', taskIds);

    const subtaskIds = subtasks?.map(s => s.subtask_id) || [];

    // Get work logs with aggregation (both task-level and subtask-level)
    let workLogsQuery = supabase
      .from('work_logs')
      .select('*,  profiles!work_logs_user_id_fkey(user_id, username)')
      .gte('work_date', startDate.toISOString().split('T')[0]);

    // Build OR condition for task_id and subtask_id
    if (taskIds.length > 0 && subtaskIds.length > 0) {
      workLogsQuery = workLogsQuery.or(`task_id.in.(${taskIds.join(',')}),subtask_id.in.(${subtaskIds.join(',')})`);
    } else if (taskIds.length > 0) {
      workLogsQuery = workLogsQuery.in('task_id', taskIds);
    } else if (subtaskIds.length > 0) {
      workLogsQuery = workLogsQuery.in('subtask_id', subtaskIds);
    }

    const { data: workLogs } = await workLogsQuery;

    // Get task estimates
    const { data: estimates } = await supabase
      .from('task_estimates')
      .select('*')
      .in('task_id', taskIds);

    // Get team members
    const { data: taskAssignments } = await supabase
      .from('task_assignments')
      .select('*, profiles!task_assignments_developer_id_fkey(user_id, username, email)')
      .in('task_id', taskIds);

    // Calculate KPIs
    const kpis = calculateManagerKPIs(tasks, subtasks, workLogs, estimates, taskAssignments, projects, startDate, now);

    res.json({
      success: true,
      analytics: kpis,
      generatedAt: new Date().toISOString(),
      timeRange: `${daysAgo} days`
    });

  } catch (error) {
    console.error('Manager analytics error:', error);
    res.status(500).json({ error: 'Failed to generate manager analytics' });
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
    const filename = `reports/${reportType}_report_${Date.now()}.pdf`;

    // Add content to PDF first
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

    // End the document to trigger the buffer collection
    doc.end();

    // Create a buffer to store PDF data
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Wait for PDF generation to complete and upload to Supabase
    const pdfResult = await new Promise((resolve, reject) => {
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);

          // Upload PDF to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filename, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError) {
            return reject(new Error(`PDF upload failed: ${uploadError.message}`));
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filename);

          resolve({ filename: path.basename(filename), filePath: publicUrl, storagePath: filename });
        } catch (error) {
          reject(error);
        }
      });

      doc.on('error', reject);
    });

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
        file_path: pdfResult.filePath
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
      downloadUrl: pdfResult.filePath,  // Direct Supabase URL
      filename: pdfResult.filename
    });

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export report to PDF' });
  }
};

/**
 * Download PDF report
 */
exports.downloadReportPDF = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Get report metadata from database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user has access to this report
    if (req.user.role !== 'ADMIN' && report.generated_by !== req.user.user_id) {
      // For managers, check if they have access to the project
      if (req.user.role === 'MANAGER' && report.project_id) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('manager_id')
          .eq('project_id', report.project_id)
          .single();

        if (projectError || !project || project.manager_id !== req.user.user_id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (req.user.role === 'DEVELOPER') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check if file exists
    if (!report.file_path || !require('fs').existsSync(report.file_path)) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    // Set headers for PDF download
    const filename = path.basename(report.file_path);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(report.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
};

// Helper functions for PDF generation
async function generateWeeklyReportData(projectId, startDate, user) {
  // Calculate week dates
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    start.setDate(start.getDate() - start.getDay()); // Start of current week
  }
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End of week

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('project_name, description, owner_manager_id')
    .eq('project_id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
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

  return {
    project: {
      id: projectId,
      name: project.project_name,
      description: project.description
    },
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    },
    metrics,
    teamStats: Object.values(developerStats)
  };
}

async function generateMonthlyReportData(projectId, startDate, user) {
  // Calculate month dates
  const start = startDate ? new Date(startDate) : new Date();
  start.setDate(1); // First day of month
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('project_name, description, owner_manager_id')
    .eq('project_id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  // Get tasks data for the month
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

  // Calculate metrics (similar to weekly but for month)
  const metrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
    overdueTasks: tasks.filter(t =>
      t.end_date && new Date(t.end_date) < new Date() && t.status !== 'COMPLETED'
    ).length,
    tasksCreatedThisMonth: tasks.filter(t =>
      new Date(t.created_at) >= start && new Date(t.created_at) <= end
    ).length,
    tasksCompletedThisMonth: tasks.filter(t =>
      new Date(t.updated_at) >= start && new Date(t.updated_at) <= end && t.status === 'COMPLETED'
    ).length
  };

  // Team productivity
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
            productivity: 0
          };
        }

        developerStats[devId].totalTasks++;
        if (task.status === 'COMPLETED') developerStats[devId].completedTasks++;
      });
    }
  });

  // Calculate productivity percentages
  Object.values(developerStats).forEach(dev => {
    dev.productivity = dev.totalTasks > 0 ? Math.round((dev.completedTasks / dev.totalTasks) * 100) : 0;
  });

  return {
    project: {
      id: projectId,
      name: project.project_name,
      description: project.description
    },
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    },
    metrics,
    teamStats: Object.values(developerStats)
  };
}

async function generateCustomReportData(startDate, endDate, projectId, user) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let projectFilter = '';
  let projectInfo = null;

  if (projectId) {
    // Get specific project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_name, description')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    projectInfo = {
      id: projectId,
      name: project.project_name,
      description: project.description
    };
  }

  // Build task query
  let taskQuery = supabase
    .from('tasks')
    .select(`
      task_id, title, status, start_date, end_date, created_at, updated_at, project_id,
      projects(project_name),
      task_assignments(
        developer_id,
        profiles(username, email)
      )
    `)
    .or(
      `created_at.gte.${start.toISOString()},` +
      `updated_at.gte.${start.toISOString()},` +
      `end_date.gte.${start.toISOString().split('T')[0]}`
    );

  if (projectId) {
    taskQuery = taskQuery.eq('project_id', projectId);
  }

  const { data: tasks, error: tasksError } = await taskQuery;
  if (tasksError) throw tasksError;

  // Calculate metrics
  const metrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
    overdueTasks: tasks.filter(t =>
      t.end_date && new Date(t.end_date) < new Date() && t.status !== 'COMPLETED'
    ).length
  };

  // Team productivity
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
            productivity: 0
          };
        }

        developerStats[devId].totalTasks++;
        if (task.status === 'COMPLETED') developerStats[devId].completedTasks++;
      });
    }
  });

  // Calculate productivity percentages
  Object.values(developerStats).forEach(dev => {
    dev.productivity = dev.totalTasks > 0 ? Math.round((dev.completedTasks / dev.totalTasks) * 100) : 0;
  });

  return {
    project: projectInfo,
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    },
    metrics,
    teamStats: Object.values(developerStats)
  };
}

/**
 * Calculate comprehensive manager KPIs
 */
const calculateManagerKPIs = (tasks, subtasks, workLogs, estimates, taskAssignments, projects, startDate, endDate) => {
  // Overview metrics
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0;
  const todoTasks = tasks?.filter(t => t.status === 'TODO').length || 0;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

  // Calculate velocity (tasks completed per week)
  const dateRangeDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const weeks = Math.max(1, Math.ceil(dateRangeDays / 7));
  const velocity = (completedTasks / weeks).toFixed(2);

  // Calculate estimation accuracy
  const tasksWithEstimates = tasks?.filter(t => t.estimated_hours && t.actual_hours) || [];
  let totalEstimated = 0, totalActual = 0, accuracyCount = 0;

  tasksWithEstimates.forEach(task => {
    totalEstimated += parseFloat(task.estimated_hours) || 0;
    totalActual += parseFloat(task.actual_hours) || 0;
    accuracyCount++;
  });

  const estimationAccuracy = accuracyCount > 0
    ? (100 - Math.abs((totalEstimated - totalActual) / totalEstimated * 100)).toFixed(1)
    : 0;

  // Calculate burn rate (hours consumed vs estimated)
  const totalWorkHours = workLogs?.reduce((sum, log) => sum + (parseFloat(log.hours_logged) || 0), 0) || 0;
  const totalEstimatedHours = tasks?.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0) || 0;
  const burnRate = totalEstimatedHours > 0 ? ((totalWorkHours / totalEstimatedHours) * 100).toFixed(1) : 0;

  // Team performance by developer
  const teamStats = {};
  workLogs?.forEach(log => {
    const devId = log.user_id;
    const devName = log.profiles?.username || 'Unknown';

    if (!teamStats[devId]) {
      teamStats[devId] = {
        userId: devId,
        username: devName,
        tasksCompleted: 0,
        hoursLogged: 0,
        avgHoursPerTask: 0,
        workLogCount: 0,
        efficiency: 0
      };
    }

    teamStats[devId].hoursLogged += parseFloat(log.hours_logged) || 0;
    teamStats[devId].workLogCount++;
  });

  // Add completed tasks count per developer
  taskAssignments?.forEach(assignment => {
    const task = tasks?.find(t => t.task_id === assignment.task_id);
    const devId = assignment.developer_id;

    if (task && task.status === 'COMPLETED' && teamStats[devId]) {
      teamStats[devId].tasksCompleted++;
    }
  });

  // Calculate efficiency (tasks completed per 10 hours)
  Object.values(teamStats).forEach(stat => {
    if (stat.tasksCompleted > 0) {
      stat.avgHoursPerTask = (stat.hoursLogged / stat.tasksCompleted).toFixed(1);
      stat.efficiency = ((stat.tasksCompleted / stat.hoursLogged) * 10).toFixed(2); // Tasks per 10 hours
    }
  });

  const teamPerformance = Object.values(teamStats).sort((a, b) => b.efficiency - a.efficiency);

  // Task distribution by priority
  const priorityDistribution = {
    HIGH: tasks?.filter(t => t.priority === 'HIGH').length || 0,
    MEDIUM: tasks?.filter(t => t.priority === 'MEDIUM').length || 0,
    LOW: tasks?.filter(t => t.priority === 'LOW').length || 0
  };

  // Task distribution by status
  const statusDistribution = {
    TODO: todoTasks,
    IN_PROGRESS: inProgressTasks,
    COMPLETED: completedTasks,
    CANCELLED: tasks?.filter(t => t.status === 'CANCELLED').length || 0
  };

  // Project health scores
  const projectHealth = projects?.map(project => {
    const projectTasks = tasks?.filter(t => t.project_id === project.project_id) || [];
    const projectCompleted = projectTasks.filter(t => t.status === 'COMPLETED').length;
    const projectTotal = projectTasks.length;
    const projectCompletionRate = projectTotal > 0 ? ((projectCompleted / projectTotal) * 100).toFixed(1) : 0;

    const projectEstimated = projectTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);
    const projectActual = projectTasks.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0);
    const projectBurnRate = projectEstimated > 0 ? ((projectActual / projectEstimated) * 100).toFixed(1) : 0;

    // Health score (0-100) based on completion rate and burn rate
    let healthScore = 0;
    if (projectTotal > 0) {
      const completionScore = parseFloat(projectCompletionRate);
      const burnScore = projectBurnRate <= 100 ? (100 - Math.abs(100 - projectBurnRate)) : 50;
      healthScore = ((completionScore * 0.6) + (burnScore * 0.4)).toFixed(1);
    }

    return {
      projectId: project.project_id,
      projectName: project.project_name,
      totalTasks: projectTotal,
      completedTasks: projectCompleted,
      completionRate: projectCompletionRate,
      burnRate: projectBurnRate,
      healthScore: healthScore,
      status: healthScore >= 70 ? 'GOOD' : healthScore >= 40 ? 'WARNING' : 'CRITICAL'
    };
  }) || [];

  // Velocity trend (weekly breakdown)
  const velocityTrend = calculateVelocityTrend(tasks, startDate, endDate);

  // Work log trends by type
  const workLogTypes = {};
  workLogs?.forEach(log => {
    const type = log.work_type || 'DEVELOPMENT';
    workLogTypes[type] = (workLogTypes[type] || 0) + parseFloat(log.hours_logged);
  });

  return {
    overview: {
      totalProjects: projects?.length || 0,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: parseFloat(completionRate),
      totalTeamMembers: Object.keys(teamStats).length
    },
    velocity: {
      tasksPerWeek: parseFloat(velocity),
      totalWeeks: weeks,
      trend: velocityTrend
    },
    estimation: {
      accuracy: parseFloat(estimationAccuracy),
      totalEstimatedHours: totalEstimatedHours.toFixed(1),
      totalActualHours: totalActual.toFixed(1),
      variance: (totalActual - totalEstimated).toFixed(1),
      tasksWithEstimates: accuracyCount
    },
    burnRate: {
      percentage: parseFloat(burnRate),
      hoursConsumed: totalWorkHours.toFixed(1),
      hoursEstimated: totalEstimatedHours.toFixed(1),
      hoursRemaining: Math.max(0, totalEstimatedHours - totalWorkHours).toFixed(1)
    },
    teamPerformance,
    distribution: {
      byPriority: priorityDistribution,
      byStatus: statusDistribution,
      byWorkType: workLogTypes
    },
    projectHealth,
    timeRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: dateRangeDays
    }
  };
};

/**
 * Calculate velocity trend over time
 */
const calculateVelocityTrend = (tasks, startDate, endDate) => {
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED' && t.updated_at) || [];

  // Group by week
  const weeklyData = {};
  completedTasks.forEach(task => {
    const completionDate = new Date(task.updated_at);
    if (completionDate >= startDate && completionDate <= endDate) {
      const weekStart = new Date(completionDate);
      weekStart.setDate(completionDate.getDate() - completionDate.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
    }
  });

  // Convert to array and sort
  return Object.entries(weeklyData)
    .map(([week, count]) => ({ week, tasksCompleted: count }))
    .sort((a, b) => new Date(a.week) - new Date(b.week));
};
