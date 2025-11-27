// src/models/project.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  company: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['planning','in-progress','on-hold','done'], default: 'planning' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
