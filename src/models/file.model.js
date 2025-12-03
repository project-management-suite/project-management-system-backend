// src/models/file.model.js
const { supabase } = require('../config/supabase');

class File {
  constructor(data) {
    this.file_id = data.file_id;
    this.project_id = data.project_id;
    this.task_id = data.task_id;
    this.uploaded_by_user_id = data.uploaded_by_user_id;
    this.file_name = data.file_name;
    this.file_path_in_storage = data.file_path_in_storage;
    this.file_size = data.file_size;
    this.mime_type = data.mime_type;
    this.upload_date = data.upload_date;
  }

  static async create({ project_id, task_id, uploaded_by_user_id, file_name, file_path_in_storage, file_size, mime_type }) {
    const { data, error } = await supabase
      .from('files')
      .insert({
        project_id,
        task_id,
        uploaded_by_user_id,
        file_name,
        file_path_in_storage,
        file_size,
        mime_type
      })
      .select()
      .single();

    if (error) throw error;
    return new File(data);
  }

  static async findByProject(project_id) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploader:profiles!files_uploaded_by_user_id_fkey(username, email),
        task:tasks(title)
      `)
      .eq('project_id', project_id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }
    return data ? data.map(file => new File(file)) : [];
  }

  static async findByTask(task_id) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploader:profiles!files_uploaded_by_user_id_fkey(username, email)
      `)
      .eq('task_id', task_id)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data.map(file => new File(file));
  }

  static async findById(file_id) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploader:profiles!files_uploaded_by_user_id_fkey(username, email),
        project:projects(project_name),
        task:tasks(title)
      `)
      .eq('file_id', file_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return new File(data);
  }

  static async delete(file_id) {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('file_id', file_id);

    if (error) throw error;
    return true;
  }
}

module.exports = File;
