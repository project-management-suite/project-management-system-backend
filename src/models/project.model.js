// src/models/project.model.js
const { supabase } = require('../config/supabase');

class Project {
  constructor(data) {
    this.project_id = data.project_id;
    this.project_name = data.project_name;
    this.description = data.description;
    this.owner_manager_id = data.owner_manager_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create({ project_name, description, owner_manager_id }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        project_name,
        description,
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
}

module.exports = Project;
