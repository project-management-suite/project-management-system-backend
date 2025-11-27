// src/models/task.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date,
  dueDate: Date,
  status: { type: String, enum: ['todo','in-progress','review','done'], default: 'todo' },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
