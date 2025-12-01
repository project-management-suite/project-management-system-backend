// src/controllers/milestone.controller.js
const Milestone = require('../models/milestone.model');
const { supabase } = require('../config/supabase');

exports.createMilestone = async (req, res) => {
    try {
        const { project_id, milestone_name, description, due_date } = req.body;

        if (!project_id || !milestone_name) {
            return res.status(400).json({
                message: 'Project ID and milestone name are required'
            });
        }

        const milestone = await Milestone.create({
            project_id,
            milestone_name,
            description,
            due_date,
            created_by: req.user.user_id
        });

        res.status(201).json({
            success: true,
            message: 'Milestone created successfully',
            milestone
        });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({
            message: 'Failed to create milestone',
            error: error.message
        });
    }
};

exports.getMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.findAll();

        res.json({
            success: true,
            milestones,
            total: milestones.length
        });
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({
            message: 'Failed to fetch milestones',
            error: error.message
        });
    }
};

exports.getProjectMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;
        const milestones = await Milestone.findByProject(projectId);

        res.json({
            success: true,
            milestones,
            total: milestones.length
        });
    } catch (error) {
        console.error('Get project milestones error:', error);
        res.status(500).json({
            message: 'Failed to fetch project milestones',
            error: error.message
        });
    }
};

exports.getMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const milestone = await Milestone.findById(milestoneId);

        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        // Calculate progress based on associated tasks
        const progress = await Milestone.calculateMilestoneProgress(milestoneId);
        milestone.task_progress = progress;

        res.json({
            success: true,
            milestone
        });
    } catch (error) {
        console.error('Get milestone error:', error);
        res.status(500).json({
            message: 'Failed to fetch milestone',
            error: error.message
        });
    }
};

exports.updateMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const updateData = req.body;

        const milestone = await Milestone.update(milestoneId, updateData);

        res.json({
            success: true,
            message: 'Milestone updated successfully',
            milestone
        });
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({
            message: 'Failed to update milestone',
            error: error.message
        });
    }
};

exports.deleteMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;

        await Milestone.delete(milestoneId);

        res.json({
            success: true,
            message: 'Milestone and all associations deleted successfully'
        });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({
            message: 'Failed to delete milestone',
            error: error.message
        });
    }
};

exports.updateMilestoneStatus = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { status, completion_date } = req.body;

        if (!status) {
            return res.status(400).json({
                message: 'Status is required',
                validStatuses: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            });
        }

        const milestone = await Milestone.updateStatus(milestoneId, status, completion_date);

        res.json({
            success: true,
            message: 'Milestone status updated successfully',
            milestone
        });
    } catch (error) {
        console.error('Update milestone status error:', error);
        res.status(500).json({
            message: 'Failed to update milestone status',
            error: error.message
        });
    }
};

exports.updateMilestoneProgress = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { progress_percentage } = req.body;

        if (progress_percentage === undefined || progress_percentage === null) {
            return res.status(400).json({
                message: 'Progress percentage is required'
            });
        }

        const milestone = await Milestone.updateProgress(milestoneId, progress_percentage);

        res.json({
            success: true,
            message: 'Milestone progress updated successfully',
            milestone
        });
    } catch (error) {
        console.error('Update milestone progress error:', error);
        res.status(500).json({
            message: 'Failed to update milestone progress',
            error: error.message
        });
    }
};

exports.addTaskToMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { task_id } = req.body;

        if (!task_id) {
            return res.status(400).json({ message: 'Task ID is required' });
        }

        await Milestone.addTask(milestoneId, task_id);

        // Recalculate milestone progress
        const progress = await Milestone.calculateMilestoneProgress(milestoneId);

        res.json({
            success: true,
            message: 'Task added to milestone successfully',
            progress
        });
    } catch (error) {
        console.error('Add task to milestone error:', error);
        res.status(500).json({
            message: 'Failed to add task to milestone',
            error: error.message
        });
    }
};

exports.removeTaskFromMilestone = async (req, res) => {
    try {
        const { milestoneId, taskId } = req.params;

        await Milestone.removeTask(milestoneId, taskId);

        // Recalculate milestone progress
        const progress = await Milestone.calculateMilestoneProgress(milestoneId);

        res.json({
            success: true,
            message: 'Task removed from milestone successfully',
            progress
        });
    } catch (error) {
        console.error('Remove task from milestone error:', error);
        res.status(500).json({
            message: 'Failed to remove task from milestone',
            error: error.message
        });
    }
};

exports.getMilestoneTasks = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const tasks = await Milestone.getTasks(milestoneId);

        res.json({
            success: true,
            tasks,
            total: tasks.length
        });
    } catch (error) {
        console.error('Get milestone tasks error:', error);
        res.status(500).json({
            message: 'Failed to fetch milestone tasks',
            error: error.message
        });
    }
};

exports.getMilestoneProgress = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const progress = await Milestone.calculateMilestoneProgress(milestoneId);

        res.json({
            success: true,
            progress
        });
    } catch (error) {
        console.error('Get milestone progress error:', error);
        res.status(500).json({
            message: 'Failed to calculate milestone progress',
            error: error.message
        });
    }
};

exports.getProjectMilestoneStats = async (req, res) => {
    try {
        const { projectId } = req.params;
        const stats = await Milestone.getProjectMilestoneStats(projectId);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get project milestone stats error:', error);
        res.status(500).json({
            message: 'Failed to get project milestone stats',
            error: error.message
        });
    }
};

exports.getUpcomingMilestones = async (req, res) => {
    try {
        // Get milestones due in the next 30 days
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const { data, error } = await supabase
            .from('milestones')
            .select(`
                *,
                project:projects(project_id, project_name),
                creator:profiles!milestones_created_by_fkey(user_id, username)
            `)
            .gte('due_date', today.toISOString().split('T')[0])
            .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
            .neq('status', 'COMPLETED')
            .order('due_date', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            milestones: data || []
        });
    } catch (error) {
        console.error('Get upcoming milestones error:', error);
        res.status(500).json({
            message: 'Failed to get upcoming milestones',
            error: error.message
        });
    }
};