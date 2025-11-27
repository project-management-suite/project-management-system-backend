// src/controllers/project.controller.js
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const { sendProjectNotification } = require('../utils/mailer');

exports.createProject = async (req, res) => {
  const data = req.body;
  data.owner = req.user._id;
  const project = await Project.create(data);
  res.status(201).json(project);
};

exports.getDashboard = async (req, res) => {
  // snapshot: all projects for user + tasks, milestones (simplified)
  const projects = await Project.find({ members: req.user._id }).populate('owner members');
  const tasks = await Task.find({ assignees: req.user._id }).limit(50);
  res.json({ projects, tasks });
};

exports.assignMembers = async (req, res) => {
  const { projectId } = req.params;
  const { memberIds } = req.body;
  const project = await Project.findByIdAndUpdate(projectId, { $addToSet: { members: { $each: memberIds } } }, { new: true });
  // notify members
  await sendProjectNotification(memberIds, `You were added to project: ${project.name}`);
  res.json(project);
};
