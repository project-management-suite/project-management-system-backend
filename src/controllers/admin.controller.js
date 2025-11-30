// src/controllers/admin.controller.js
const { supabase } = require('../config/supabase');

exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, email, role, email_verified, profile_photo_url, profile_photo_uploaded_at, created_at, updated_at')
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

exports.deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Only allow in development/test environments for safety
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        message: 'User deletion by email not allowed in production'
      });
    }

    console.log(`🗑️ Attempting to delete user with email: ${email}`);

    // First, get the user by email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.log(`ℹ️ User not found with email: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete from Supabase Auth (this will cascade to profiles table)
    const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);

    if (authError) {
      console.error('Supabase auth delete error:', authError);
      throw authError;
    }

    console.log(`✅ Successfully deleted user: ${email}`);
    res.json({ message: 'User deleted successfully', email: email });
  } catch (error) {
    console.error('Delete user by email error:', error);
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

exports.cleanupPendingData = async (req, res) => {
  try {
    // Only allow in development/test environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        message: 'Database cleanup not allowed in production'
      });
    }

    console.log('🧹 Starting database cleanup...');

    // Clean up ALL pending registrations (for testing cleanup)
    const { data: pendingRegs, error: pendingError } = await supabase
      .from('pending_registrations')
      .delete()
      .not('email', 'eq', '')  // Delete all records
      .select();

    if (pendingError) {
      console.warn('Error cleaning pending registrations:', pendingError);
    } else {
      console.log(`✅ Removed ${pendingRegs?.length || 0} pending registrations`);
    }

    // Clean up ALL OTPs (for testing cleanup)
    const { data: allOTPs, error: allOTPError } = await supabase
      .from('email_otps')
      .delete()
      .not('email', 'eq', '')  // Delete all records
      .select();

    if (allOTPError) {
      console.warn('Error cleaning all OTPs:', allOTPError);
    } else {
      console.log(`✅ Removed ${allOTPs?.length || 0} OTPs`);
    }

    res.json({
      message: 'Database cleanup completed',
      pending_registrations: pendingRegs?.length || 0,
      all_otps: allOTPs?.length || 0
    });
  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup database', error: error.message });
  }
};
