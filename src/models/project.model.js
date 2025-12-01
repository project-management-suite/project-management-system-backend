// src/models/project.model.js
const { supabase } = require('../config/supabase');

class Project {
  constructor(data) {
    this.project_id = data.project_id;
    this.project_name = data.project_name;
    this.description = data.description;
    this.status = data.status || 'PLANNING';
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.progress_percentage = data.progress_percentage || 0;
    this.owner_manager_id = data.owner_manager_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create({ project_name, description, owner_manager_id, status = 'PLANNING', start_date, end_date }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        project_name,
        description,
        status,
        start_date,
        end_date,
        owner_manager_id
      })
      .select()
      .single();

    if (error) throw error;
    return new Project(data);
  }

  static async findById(project_id) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_manager_id_fkey(user_id, username, email, role)
      `)
      .eq('project_id', project_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return new Project(data);
  }

  static async findByOwner(owner_manager_id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_manager_id', owner_manager_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(project => new Project(project));
  }

  static async findAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(project => new Project(project));
  }

  static async findByMember(user_id) {
    // For developers, find projects they're assigned to via tasks
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks!inner(
          task_id,
          task_assignments!inner(
            developer_id
          )
        )
      `)
      .eq('tasks.task_assignments.developer_id', user_id);

    if (error) throw error;

    // Remove duplicates and clean up the data
    const uniqueProjects = {};
    data.forEach(project => {
      if (!uniqueProjects[project.project_id]) {
        uniqueProjects[project.project_id] = {
          project_id: project.project_id,
          project_name: project.project_name,
          description: project.description,
          owner_manager_id: project.owner_manager_id,
          created_at: project.created_at,
          updated_at: project.updated_at
        };
      }
    });

    return Object.values(uniqueProjects).map(project => new Project(project));
  }

  static async update(project_id, updateData) {
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;
    return new Project(data);
  }

  static async delete(project_id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', project_id);

    if (error) throw error;
    return true;
  }

  // New status management methods
  static async updateStatus(project_id, status) {
    const validStatuses = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;
    return new Project(data);
  }

  static async updateProgress(project_id, progress_percentage) {
    if (progress_percentage < 0 || progress_percentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ progress_percentage })
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) throw error;
    return new Project(data);
  }

  static async getStatusAnalytics(owner_manager_id = null) {
    let query = supabase
      .from('projects')
      .select('status, progress_percentage, created_at, start_date, end_date');

    if (owner_manager_id) {
      query = query.eq('owner_manager_id', owner_manager_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate analytics
    const statusCount = {};
    let totalProgress = 0;
    let overdue = 0;
    const today = new Date();

    data.forEach(project => {
      // Count by status
      statusCount[project.status] = (statusCount[project.status] || 0) + 1;

      // Calculate average progress
      totalProgress += project.progress_percentage || 0;

      // Check for overdue projects
      if (project.end_date && new Date(project.end_date) < today && project.status !== 'COMPLETED') {
        overdue++;
      }
    });

    return {
      total_projects: data.length,
      status_breakdown: statusCount,
      average_progress: data.length > 0 ? Math.round(totalProgress / data.length) : 0,
      overdue_projects: overdue,
      on_time_percentage: data.length > 0 ? Math.round(((data.length - overdue) / data.length) * 100) : 100
    };
  }

  static async findByStatus(status, owner_manager_id = null) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (owner_manager_id) {
      query = query.eq('owner_manager_id', owner_manager_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(project => new Project(project));
  }
}

module.exports = Project;
