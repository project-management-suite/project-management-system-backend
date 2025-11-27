// src/controllers/task.controller.js
const Task = require('../models/task.model');
const { sendProjectNotification } = require('../utils/mailer');

exports.createTask = async (req, res) => {
  const payload = req.body;
  payload.project = req.params.projectId;
  const task = await Task.create(payload);
  // notify assignees
  if (task.assignees && task.assignees.length) {
    await sendProjectNotification(task.assignees, `New task assigned: ${task.title}`);
  }
  res.status(201).json(task);
};

exports.updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
  res.json(task);
};
