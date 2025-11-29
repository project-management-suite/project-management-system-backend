// src/models/task.model.js
const { supabase } = require('../config/supabase');

class Task {
  constructor(data) {
    this.task_id = data.task_id;
    this.project_id = data.project_id;
    this.title = data.title;
    this.description = data.description;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.assignments = data.assignments || [];
  }

  static async create({ project_id, title, description, start_date, end_date, status = 'NEW' }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title,
        description,
        start_date,
        end_date,
        status
      })
      .select()
      .single();

    if (error) throw error;
    return new Task(data);
  }

  static async findById(task_id) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(project_name, description),
        assignments:task_assignments(
          assignment_id,
          developer:profiles!task_assignments_developer_id_fkey(user_id, username, email)
        )
      `)
      .eq('task_id', task_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return new Task(data);
  }

  static async findByProject(project_id) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(
          assignment_id,
          developer:profiles!task_assignments_developer_id_fkey(user_id, username, email)
        )
      `)
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(task => new Task(task));
  }

  static async findByDeveloper(developer_id) {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        task_id,
        task:tasks(
          task_id,
          title,
          description,
          start_date,
          end_date,
          status,
          project:projects(project_name, description)
        )
      `)
      .eq('developer_id', developer_id);

    if (error) throw error;
    return data.map(item => new Task(item.task));
  }

  static async update(task_id, updateData) {
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('task_id', task_id)
      .select()
      .single();

    if (error) throw error;
    return new Task(data);
  }

  static async delete(task_id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('task_id', task_id);

    if (error) throw error;
    return true;
  }

  static async assignDeveloper(task_id, developer_id) {
    // First check if assignment already exists
    const { data: existing } = await supabase
      .from('task_assignments')
      .select('assignment_id')
      .eq('task_id', task_id)
      .eq('developer_id', developer_id)
      .single();

    if (existing) {
      throw new Error('Developer is already assigned to this task');
    }

    const { data, error } = await supabase
      .from('task_assignments')
      .insert({
        task_id,
        developer_id
      })
      .select()
      .single();

    if (error) throw error;

    // Update task status to ASSIGNED if it was NEW
    await supabase
      .from('tasks')
      .update({ status: 'ASSIGNED' })
      .eq('task_id', task_id)
      .eq('status', 'NEW');

    return data;
  }

  static async unassignDeveloper(task_id, developer_id) {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', task_id)
      .eq('developer_id', developer_id);

    if (error) throw error;

    // Check if there are any remaining assignments
    const { data: remainingAssignments } = await supabase
      .from('task_assignments')
      .select('assignment_id')
      .eq('task_id', task_id);

    // If no assignments left, set status back to NEW
    if (!remainingAssignments || remainingAssignments.length === 0) {
      await supabase
        .from('tasks')
        .update({ status: 'NEW' })
        .eq('task_id', task_id);
    }

    return true;
  }
}

module.exports = Task;
