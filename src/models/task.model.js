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
    this.priority = data.priority;
    this.progress_percentage = data.progress_percentage;
    this.estimated_hours = data.estimated_hours;
    this.actual_hours = data.actual_hours;
    this.estimated_by = data.estimated_by;
    this.estimated_at = data.estimated_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.assignments = data.assignments || [];
    this.estimator = data.estimator;
    this.subtasks = data.subtasks || [];
    this.work_logs = data.work_logs || [];
  }

  static async create({ project_id, title, description, start_date, end_date, status = 'NEW', priority = 'MEDIUM' }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title,
        description,
        start_date,
        end_date,
        status,
        priority
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
        ),
        estimator:profiles!tasks_estimated_by_fkey(user_id, username, email),
        subtasks(
          subtask_id,
          title,
          status,
          estimated_hours,
          actual_hours,
          assignments:subtask_assignments(
            assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email)
          )
        ),
        work_logs(
          log_id,
          hours_logged,
          work_date,
          log_type,
          description,
          user:profiles!work_logs_user_id_fkey(user_id, username, email)
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
          priority,
          progress_percentage,
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

  /**
   * Add estimate to task
   */
  static async addEstimate(taskId, estimatedHours, estimatorId, notes = null, estimateType = 'INITIAL') {
    // Create estimate record
    const { data: estimate, error: estimateError } = await supabase
      .from('task_estimates')
      .insert({
        task_id: taskId,
        estimated_hours: estimatedHours,
        estimator_id: estimatorId,
        estimate_type: estimateType,
        notes: notes
      })
      .select()
      .single();

    if (estimateError) throw estimateError;

    // Update task with latest estimate
    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({
        estimated_hours: estimatedHours,
        estimated_by: estimatorId,
        estimated_at: new Date().toISOString()
      })
      .eq('task_id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { estimate, task };
  }

  /**
   * Get task estimates history
   */
  static async getEstimates(taskId) {
    const { data, error } = await supabase
      .from('task_estimates')
      .select(`
        *,
        estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get task statistics including subtasks and work logs
   */
  static async getTaskStats(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks(
          subtask_id,
          title,
          status,
          estimated_hours,
          actual_hours
        ),
        work_logs(
          hours_logged,
          log_type
        ),
        assignments:task_assignments(
          assignee:profiles!task_assignments_developer_id_fkey(user_id, username, email)
        )
      `)
      .eq('task_id', taskId)
      .single();

    if (error) throw error;

    const stats = {
      taskId,
      title: data.title,
      status: data.status,
      estimatedHours: data.estimated_hours || 0,
      actualHours: data.actual_hours || 0,
      subtasksCount: data.subtasks.length,
      subtasksCompleted: data.subtasks.filter(s => s.status === 'COMPLETED').length,
      assigneesCount: data.assignments.length,
      totalSubtaskEstimated: data.subtasks.reduce((sum, s) => sum + (s.estimated_hours || 0), 0),
      totalSubtaskActual: data.subtasks.reduce((sum, s) => sum + (s.actual_hours || 0), 0),
      workLogsByType: data.work_logs.reduce((acc, log) => {
        acc[log.log_type] = (acc[log.log_type] || 0) + parseFloat(log.hours_logged);
        return acc;
      }, {})
    };

    // Calculate progress
    if (stats.estimatedHours > 0) {
      stats.progressPercentage = Math.round((stats.actualHours / stats.estimatedHours) * 100);
    } else {
      stats.progressPercentage = 0;
    }

    // Calculate remaining hours
    stats.remainingHours = Math.max(stats.estimatedHours - stats.actualHours, 0);

    return stats;
  }

  // Update task priority (managers only)
  static async updatePriority(taskId, priority) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('task_id', taskId)
      .select()
      .single();

    if (error) throw error;
    return new Task(data);
  }

  // Update task status (managers and developers)
  static async updateStatus(taskId, status) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('task_id', taskId)
      .select()
      .single();

    if (error) throw error;
    return new Task(data);
  }

  // Subtask Management Methods

  static async getSubtasks(taskId) {
    const { data, error } = await supabase
      .from('subtasks')
      .select(`
        *,
        creator:profiles!subtasks_created_by_fkey(user_id, username, email),
        assignments:subtask_assignments(
          assignment_id,
          assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email)
        )
      `)
      .eq('parent_task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findSubtaskById(subtaskId) {
    const { data, error } = await supabase
      .from('subtasks')
      .select(`
        *,
        creator:profiles!subtasks_created_by_fkey(user_id, username, email),
        assignments:subtask_assignments(
          assignment_id,
          assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email)
        )
      `)
      .eq('subtask_id', subtaskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async createSubtask({ parent_task_id, title, description, estimated_hours, priority, start_date, end_date, created_by }) {
    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        parent_task_id,
        title,
        description,
        estimated_hours,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        start_date,
        end_date,
        created_by
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async assignSubtaskDevelopers(subtaskId, assigneeIds, assignedBy) {
    const assignments = assigneeIds.map(assigneeId => ({
      subtask_id: subtaskId,
      assignee_id: assigneeId,
      assigned_by: assignedBy
    }));

    const { data, error } = await supabase
      .from('subtask_assignments')
      .insert(assignments)
      .select();

    if (error) throw error;

    // Update subtask status to IN_PROGRESS when assigned
    await supabase
      .from('subtasks')
      .update({ status: 'IN_PROGRESS' })
      .eq('subtask_id', subtaskId);

    return data;
  }

  // Work Log Management Methods

  static async getWorkLogs(taskId) {
    const { data, error } = await supabase
      .from('work_logs')
      .select(`
        *,
        user:profiles!work_logs_user_id_fkey(user_id, username, email),
        subtask:subtasks(subtask_id, title)
      `)
      .eq('task_id', taskId)
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createWorkLog({ task_id, subtask_id, user_id, hours_logged, work_date, description, log_type }) {
    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        task_id,
        subtask_id,
        user_id,
        hours_logged,
        work_date,
        description,
        log_type: log_type || 'DEVELOPMENT'
      })
      .select(`
        *,
        user:profiles!work_logs_user_id_fkey(user_id, username, email),
        subtask:subtasks(subtask_id, title)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Estimate Management Methods (additional to existing getEstimates)

  static async createEstimate({ task_id, subtask_id, estimated_hours, estimator_id, estimate_type, notes }) {
    const { data, error } = await supabase
      .from('task_estimates')
      .insert({
        task_id,
        subtask_id,
        estimated_hours,
        estimator_id,
        estimate_type: estimate_type || 'INITIAL',
        notes
      })
      .select(`
        *,
        estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email)
      `)
      .single();

    if (error) throw error;

    // Update task or subtask with the new estimate
    if (task_id && !subtask_id) {
      await supabase
        .from('tasks')
        .update({
          estimated_hours,
          estimated_by: estimator_id,
          estimated_at: new Date().toISOString()
        })
        .eq('task_id', task_id);
    } else if (subtask_id) {
      await supabase
        .from('subtasks')
        .update({
          estimated_hours
        })
        .eq('subtask_id', subtask_id);
    }

    return data;
  }
}

module.exports = Task;
