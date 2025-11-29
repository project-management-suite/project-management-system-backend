// src/models/user.model.js
const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

const roles = ['DEVELOPER', 'MANAGER', 'ADMIN'];

class User {
  constructor(data) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.email = data.email;
    this.role = data.role;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create({ username, email, password, role = 'DEVELOPER' }) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        role
      }
    });

    if (authError) throw authError;

    // Profile should be created automatically via trigger
    // But let's fetch it to return
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    return new User(profile);
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return new User(data);
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return new User(data);
  }

  async comparePassword(candidatePassword) {
    // For Supabase auth, we'll verify through the auth API
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: candidatePassword
    });

    if (error) return false;

    // Sign out immediately as this is just for verification
    await supabase.auth.signOut();

    return true;
  }
}

module.exports = User;
