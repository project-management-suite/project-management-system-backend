// src/config/db.js
const { supabase } = require('./supabase');

async function connectDB() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      throw error;
    }

    console.log('Supabase connected successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

module.exports = { connectDB };
