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
    this.email_verified = data.email_verified || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create({ username, email, password, role = 'DEVELOPER', email_verified = false }) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: email_verified,
      user_metadata: {
        username,
        role,
        email_verified
      }
    });

    if (authError) throw authError;

    // Update profile with email verification status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ email_verified })
      .eq('user_id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      // If profile doesn't exist yet, try to fetch it
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update with email_verified
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ email_verified })
        .eq('user_id', authData.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new User(updatedProfile);
    }

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
