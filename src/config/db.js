// src/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || undefined
      // Add other modern options here if needed (e.g. maxPoolSize)
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err);
    throw err;
  }
}

module.exports = { connectDB };
