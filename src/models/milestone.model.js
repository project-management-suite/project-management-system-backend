// src/models/milestone.model.js
const { supabase } = require('../config/supabase');

class Milestone {
    constructor(data) {
        this.milestone_id = data.milestone_id;
        this.project_id = data.project_id;
        this.milestone_name = data.milestone_name;
        this.description = data.description;
        this.due_date = data.due_date;
        this.status = data.status || 'PENDING';
        this.completion_date = data.completion_date;
        this.progress_percentage = data.progress_percentage || 0;
        this.created_by = data.created_by;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async create({ project_id, milestone_name, description, due_date, created_by }) {
        const { data, error } = await supabase
            .from('milestones')
            .insert({
                project_id,
                milestone_name,
                description,
                due_date,
                created_by
            })
            .select()
            .single();

        if (error) throw error;
        return new Milestone(data);
    }

    static async findById(milestone_id) {
        const { data, error } = await supabase
            .from('milestones')
            .select(`
        *,
        project:projects(project_id, project_name),
        creator:profiles!milestones_created_by_fkey(user_id, username, email)
      `)
            .eq('milestone_id', milestone_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return new Milestone(data);
    }

    static async findByProject(project_id) {
        const { data, error } = await supabase
            .from('milestones')
            .select(`
        *,
        creator:profiles!milestones_created_by_fkey(user_id, username),
        milestone_tasks(
          task_id,
          task:tasks(task_id, title, status)
        )
      `)
            .eq('project_id', project_id)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data.map(milestone => new Milestone(milestone));
    }

    static async findAll() {
        const { data, error } = await supabase
            .from('milestones')
            .select(`
        *,
        project:projects(project_id, project_name),
        creator:profiles!milestones_created_by_fkey(user_id, username)
      `)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data.map(milestone => new Milestone(milestone));
    }

    static async update(milestone_id, updateData) {
        const { data, error } = await supabase
            .from('milestones')
            .update(updateData)
            .eq('milestone_id', milestone_id)
            .select()
            .single();

        if (error) throw error;
        return new Milestone(data);
    }

    static async delete(milestone_id) {
        // First remove all task associations
        await supabase
            .from('milestone_tasks')
            .delete()
            .eq('milestone_id', milestone_id);

        // Then delete the milestone
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('milestone_id', milestone_id);

        if (error) throw error;
        return true;
    }

    static async updateStatus(milestone_id, status, completion_date = null) {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const updateData = { status };
        if (status === 'COMPLETED' && !completion_date) {
            updateData.completion_date = new Date().toISOString();
            updateData.progress_percentage = 100;
        } else if (completion_date) {
            updateData.completion_date = completion_date;
        }

        const { data, error } = await supabase
            .from('milestones')
            .update(updateData)
            .eq('milestone_id', milestone_id)
            .select()
            .single();

        if (error) throw error;
        return new Milestone(data);
    }

    static async updateProgress(milestone_id, progress_percentage) {
        if (progress_percentage < 0 || progress_percentage > 100) {
            throw new Error('Progress percentage must be between 0 and 100');
        }

        const updateData = { progress_percentage };
        if (progress_percentage === 100) {
            updateData.status = 'COMPLETED';
            updateData.completion_date = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('milestones')
            .update(updateData)
            .eq('milestone_id', milestone_id)
            .select()
            .single();

        if (error) throw error;
        return new Milestone(data);
    }

    // Task association methods
    static async addTask(milestone_id, task_id) {
        const { error } = await supabase
            .from('milestone_tasks')
            .insert({
                milestone_id,
                task_id
            });

        if (error) throw error;
        return true;
    }

    static async removeTask(milestone_id, task_id) {
        const { error } = await supabase
            .from('milestone_tasks')
            .delete()
            .eq('milestone_id', milestone_id)
            .eq('task_id', task_id);

        if (error) throw error;
        return true;
    }

    static async getTasks(milestone_id) {
        const { data, error } = await supabase
            .from('milestone_tasks')
            .select(`
        task_id,
        task:tasks(
          task_id,
          title,
          description,
          status,
          start_date,
          end_date,
          assigned_user:task_assignments(
            developer:profiles!task_assignments_developer_id_fkey(user_id, username, email)
          )
        )
      `)
            .eq('milestone_id', milestone_id);

        if (error) throw error;
        return data.map(item => item.task);
    }

    static async calculateMilestoneProgress(milestone_id) {
        const tasks = await this.getTasks(milestone_id);

        if (tasks.length === 0) {
            return { progress_percentage: 0, completed_tasks: 0, total_tasks: 0 };
        }

        const completed_tasks = tasks.filter(task => task.status === 'DONE').length;
        const progress_percentage = Math.round((completed_tasks / tasks.length) * 100);

        // Auto-update milestone progress
        await this.updateProgress(milestone_id, progress_percentage);

        return {
            progress_percentage,
            completed_tasks,
            total_tasks: tasks.length,
            tasks
        };
    }

    static async getProjectMilestoneStats(project_id) {
        const milestones = await this.findByProject(project_id);

        const stats = {
            total_milestones: milestones.length,
            completed_milestones: 0,
            pending_milestones: 0,
            in_progress_milestones: 0,
            overdue_milestones: 0,
            upcoming_milestones: [],
            average_progress: 0
        };

        const today = new Date();
        let totalProgress = 0;

        for (const milestone of milestones) {
            totalProgress += milestone.progress_percentage;

            switch (milestone.status) {
                case 'COMPLETED':
                    stats.completed_milestones++;
                    break;
                case 'IN_PROGRESS':
                    stats.in_progress_milestones++;
                    break;
                case 'PENDING':
                    stats.pending_milestones++;
                    break;
            }

            // Check for overdue milestones
            if (milestone.due_date && new Date(milestone.due_date) < today && milestone.status !== 'COMPLETED') {
                stats.overdue_milestones++;
            }

            // Get upcoming milestones (next 30 days)
            if (milestone.due_date) {
                const dueDate = new Date(milestone.due_date);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);

                if (dueDate >= today && dueDate <= thirtyDaysFromNow && milestone.status !== 'COMPLETED') {
                    stats.upcoming_milestones.push({
                        milestone_id: milestone.milestone_id,
                        milestone_name: milestone.milestone_name,
                        due_date: milestone.due_date,
                        status: milestone.status,
                        progress_percentage: milestone.progress_percentage
                    });
                }
            }
        }

        stats.average_progress = milestones.length > 0 ? Math.round(totalProgress / milestones.length) : 0;

        return stats;
    }
}

module.exports = Milestone;
