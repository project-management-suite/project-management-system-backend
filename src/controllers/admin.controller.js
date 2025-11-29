// src/controllers/admin.controller.js
const { supabase } = require('../config/supabase');

exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users: data });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'DEVELOPER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'User role updated successfully', user: data });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete from Supabase Auth (this will cascade to profiles table)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get user counts by role
    const { data: userStats, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .then(result => {
        if (result.error) throw result.error;
        const stats = result.data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        return { data: stats, error: null };
      });

    if (userError) throw userError;

    // Get project count
    const { count: projectCount, error: projectError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectError) throw projectError;

    // Get task counts by status
    const { data: taskStats, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .then(result => {
        if (result.error) throw result.error;
        const stats = result.data.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});
        return { data: stats, error: null };
      });

    if (taskError) throw taskError;

    res.json({
      users: {
        total: Object.values(userStats).reduce((sum, count) => sum + count, 0),
        byRole: userStats
      },
      projects: {
        total: projectCount || 0
      },
      tasks: {
        total: Object.values(taskStats).reduce((sum, count) => sum + count, 0),
        byStatus: taskStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
