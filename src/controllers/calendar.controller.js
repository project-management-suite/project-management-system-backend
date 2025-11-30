// src/controllers/calendar.controller.js
const { supabase } = require('../config/supabase');

/**
 * Get all company holidays
 */
exports.getHolidays = async (req, res) => {
    try {
        const { year } = req.query;

        let query = supabase
            .from('holidays')
            .select('holiday_id, holiday_name, holiday_date, description, is_recurring')
            .order('holiday_date', { ascending: true });

        if (year) {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            query = query.gte('holiday_date', startDate).lte('holiday_date', endDate);
        }

        const { data: holidays, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            holidays: holidays || []
        });

    } catch (error) {
        console.error('Get holidays error:', error);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

/**
 * Add a new holiday (Admin only)
 */
exports.addHoliday = async (req, res) => {
    try {
        const { holiday_name, holiday_date, description, is_recurring = false } = req.body;

        // Validate input
        if (!holiday_name || !holiday_date) {
            return res.status(400).json({ error: 'Holiday name and date are required' });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(holiday_date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const { data: holiday, error } = await supabase
            .from('holidays')
            .insert({
                holiday_name,
                holiday_date,
                description,
                is_recurring,
                created_by: req.user.user_id
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'A holiday already exists on this date' });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Holiday added successfully',
            holiday
        });

    } catch (error) {
        console.error('Add holiday error:', error);
        res.status(500).json({ error: 'Failed to add holiday' });
    }
};

/**
 * Update a holiday (Admin only)
 */
exports.updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { holiday_name, holiday_date, description, is_recurring } = req.body;

        // Build update object with only provided fields
        const updates = {};
        if (holiday_name !== undefined) updates.holiday_name = holiday_name;
        if (holiday_date !== undefined) {
            // Validate date format if provided
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(holiday_date)) {
                return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
            }
            updates.holiday_date = holiday_date;
        }
        if (description !== undefined) updates.description = description;
        if (is_recurring !== undefined) updates.is_recurring = is_recurring;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data: holiday, error } = await supabase
            .from('holidays')
            .update(updates)
            .eq('holiday_id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Holiday not found' });
            }
            if (error.code === '23505') {
                return res.status(409).json({ error: 'A holiday already exists on this date' });
            }
            throw error;
        }

        res.json({
            success: true,
            message: 'Holiday updated successfully',
            holiday
        });

    } catch (error) {
        console.error('Update holiday error:', error);
        res.status(500).json({ error: 'Failed to update holiday' });
    }
};

/**
 * Delete a holiday (Admin only)
 */
exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('holiday_id', id);

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Holiday not found' });
            }
            throw error;
        }

        res.json({
            success: true,
            message: 'Holiday deleted successfully'
        });

    } catch (error) {
        console.error('Delete holiday error:', error);
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
};

/**
 * Get calendar view of tasks for a project or user
 */
exports.getTasksCalendar = async (req, res) => {
    try {
        const { projectId } = req.query;
        const { month, year } = req.query;

        // Calculate date range
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Build tasks query
        let query = supabase
            .from('tasks')
            .select(`
        task_id, title, status, start_date, end_date,
        projects(project_id, project_name),
        task_assignments(
          profiles(user_id, username)
        )
      `);

        // Apply filters based on user role and permissions
        if (projectId) {
            query = query.eq('project_id', projectId);

            // Check if user has access to this project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('owner_manager_id')
                .eq('project_id', projectId)
                .single();

            if (projectError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Check permissions
            if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' &&
                project.owner_manager_id !== req.user.user_id) {
                // Check if developer is assigned to project
                const { data: assignment } = await supabase
                    .from('task_assignments')
                    .select('assignment_id')
                    .eq('developer_id', req.user.user_id)
                    .in('task_id',
                        supabase.from('tasks').select('task_id').eq('project_id', projectId)
                    )
                    .limit(1);

                if (!assignment || assignment.length === 0) {
                    return res.status(403).json({ error: 'Access denied to this project' });
                }
            }
        } else if (req.user.role === 'DEVELOPER') {
            // Developers see only their assigned tasks
            query = query.in('task_id',
                supabase.from('task_assignments')
                    .select('task_id')
                    .eq('developer_id', req.user.user_id)
            );
        } else if (req.user.role === 'MANAGER') {
            // Managers see tasks from their projects
            query = query.in('project_id',
                supabase.from('projects')
                    .select('project_id')
                    .eq('owner_manager_id', req.user.user_id)
            );
        }

        // Filter by date range (tasks that overlap with the month)
        query = query.or(
            `start_date.lte.${endDate.toISOString().split('T')[0]},` +
            `end_date.gte.${startDate.toISOString().split('T')[0]},` +
            `start_date.is.null`
        );

        const { data: tasks, error } = await query;

        if (error) throw error;

        // Get holidays for the same period
        const { data: holidays } = await supabase
            .from('holidays')
            .select('holiday_name, holiday_date, description')
            .gte('holiday_date', startDate.toISOString().split('T')[0])
            .lte('holiday_date', endDate.toISOString().split('T')[0])
            .order('holiday_date');

        // Format tasks for calendar display
        const calendarTasks = (tasks || []).map(task => ({
            id: task.task_id,
            title: task.title,
            status: task.status,
            startDate: task.start_date,
            endDate: task.end_date,
            project: {
                id: task.projects.project_id,
                name: task.projects.project_name
            },
            assignees: task.task_assignments?.map(a => a.profiles.username) || [],
            isOverdue: task.end_date && new Date(task.end_date) < new Date() && task.status !== 'COMPLETED'
        }));

        res.json({
            success: true,
            calendar: {
                month: targetMonth + 1,
                year: targetYear,
                tasks: calendarTasks,
                holidays: holidays || []
            }
        });

    } catch (error) {
        console.error('Get tasks calendar error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks calendar' });
    }
};

/**
 * Get upcoming deadlines
 */
exports.getUpcomingDeadlines = async (req, res) => {
    try {
        const { days = 7 } = req.query; // Default to next 7 days
        const maxDays = Math.min(parseInt(days), 30); // Limit to 30 days

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + maxDays);

        // Build query based on user role
        let query = supabase
            .from('tasks')
            .select(`
        task_id, title, end_date, status,
        projects(project_id, project_name, owner_manager_id),
        task_assignments(
          profiles(user_id, username)
        )
      `)
            .not('end_date', 'is', null)
            .gte('end_date', today.toISOString().split('T')[0])
            .lte('end_date', futureDate.toISOString().split('T')[0])
            .neq('status', 'COMPLETED')
            .order('end_date', { ascending: true });

        // Apply role-based filtering
        if (req.user.role === 'DEVELOPER') {
            query = query.in('task_id',
                supabase.from('task_assignments')
                    .select('task_id')
                    .eq('developer_id', req.user.user_id)
            );
        } else if (req.user.role === 'MANAGER') {
            query = query.eq('projects.owner_manager_id', req.user.user_id);
        }

        const { data: tasks, error } = await query;

        if (error) throw error;

        // Group deadlines by urgency
        const now = new Date();
        const deadlines = {
            overdue: [],
            today: [],
            thisWeek: [],
            nextWeek: [],
            later: []
        };

        (tasks || []).forEach(task => {
            const deadline = new Date(task.end_date);
            const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

            const taskInfo = {
                id: task.task_id,
                title: task.title,
                endDate: task.end_date,
                status: task.status,
                daysUntilDeadline: daysDiff,
                project: {
                    id: task.projects.project_id,
                    name: task.projects.project_name
                },
                assignees: task.task_assignments?.map(a => a.profiles.username) || []
            };

            if (daysDiff < 0) {
                deadlines.overdue.push(taskInfo);
            } else if (daysDiff === 0) {
                deadlines.today.push(taskInfo);
            } else if (daysDiff <= 7) {
                deadlines.thisWeek.push(taskInfo);
            } else if (daysDiff <= 14) {
                deadlines.nextWeek.push(taskInfo);
            } else {
                deadlines.later.push(taskInfo);
            }
        });

        res.json({
            success: true,
            deadlines
        });

    } catch (error) {
        console.error('Get upcoming deadlines error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
    }
};

/**
 * Set deadline reminder for a task
 */
exports.setDeadlineReminder = async (req, res) => {
    try {
        const { taskId, reminderDate, reminderType = 'email' } = req.body;

        if (!taskId || !reminderDate) {
            return res.status(400).json({ error: 'Task ID and reminder date are required' });
        }

        // Validate reminder date
        const reminderDateTime = new Date(reminderDate);
        const now = new Date();

        if (reminderDateTime <= now) {
            return res.status(400).json({ error: 'Reminder date must be in the future' });
        }

        // Check if user has access to the task
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select(`
        task_id, title, end_date,
        projects(owner_manager_id),
        task_assignments(developer_id)
      `)
            .eq('task_id', taskId)
            .single();

        if (taskError || !task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check permissions
        const isAssigned = task.task_assignments?.some(a => a.developer_id === req.user.user_id);
        const isOwner = task.projects.owner_manager_id === req.user.user_id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isAssigned && !isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied to this task' });
        }

        // Check if reminder is before task deadline
        if (task.end_date && reminderDateTime > new Date(task.end_date)) {
            return res.status(400).json({ error: 'Reminder date cannot be after task deadline' });
        }

        const { data: reminder, error } = await supabase
            .from('deadline_reminders')
            .insert({
                task_id: taskId,
                user_id: req.user.user_id,
                reminder_date: reminderDateTime.toISOString(),
                reminder_type: reminderType
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Reminder already exists for this date' });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Deadline reminder set successfully',
            reminder
        });

    } catch (error) {
        console.error('Set deadline reminder error:', error);
        res.status(500).json({ error: 'Failed to set deadline reminder' });
    }
};

/**
 * Get project calendar view with milestones
 */
exports.getProjectCalendar = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { month, year } = req.query;

        // Check project access
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('project_name, owner_manager_id')
            .eq('project_id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check permissions
        if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' &&
            project.owner_manager_id !== req.user.user_id) {
            const { data: assignment } = await supabase
                .from('task_assignments')
                .select('assignment_id')
                .eq('developer_id', req.user.user_id)
                .in('task_id',
                    supabase.from('tasks').select('task_id').eq('project_id', projectId)
                )
                .limit(1);

            if (!assignment || assignment.length === 0) {
                return res.status(403).json({ error: 'Access denied to this project' });
            }
        }

        // Calculate date range
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Get tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
        task_id, title, status, start_date, end_date,
        task_assignments(
          profiles(username)
        )
      `)
            .eq('project_id', projectId)
            .or(
                `start_date.lte.${endDate.toISOString().split('T')[0]},` +
                `end_date.gte.${startDate.toISOString().split('T')[0]},` +
                `start_date.is.null`
            );

        // Get milestones
        const { data: milestones } = await supabase
            .from('milestones')
            .select('milestone_id, milestone_name, due_date, status, progress_percentage')
            .eq('project_id', projectId)
            .gte('due_date', startDate.toISOString().split('T')[0])
            .lte('due_date', endDate.toISOString().split('T')[0]);

        // Get holidays
        const { data: holidays } = await supabase
            .from('holidays')
            .select('holiday_name, holiday_date, description')
            .gte('holiday_date', startDate.toISOString().split('T')[0])
            .lte('holiday_date', endDate.toISOString().split('T')[0]);

        res.json({
            success: true,
            projectCalendar: {
                project: {
                    id: projectId,
                    name: project.project_name
                },
                month: targetMonth + 1,
                year: targetYear,
                tasks: tasks || [],
                milestones: milestones || [],
                holidays: holidays || []
            }
        });

    } catch (error) {
        console.error('Get project calendar error:', error);
        res.status(500).json({ error: 'Failed to fetch project calendar' });
    }
};

module.exports = exports;