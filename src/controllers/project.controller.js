// src/controllers/project.controller.js
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const { sendProjectNotification } = require('../utils/mailer');

exports.createProject = async (req, res) => {
  try {
    const { project_name, description } = req.body;

    const project = await Project.create({
      project_name,
      description,
      owner_manager_id: req.user.user_id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      // Admins can see all projects - would need a Project.findAll() method
      projects = await Project.findByOwner(''); // Placeholder - need to implement findAll
    } else if (req.user.role === 'MANAGER') {
      projects = await Project.findByOwner(req.user.user_id);
    } else if (req.user.role === 'DEVELOPER') {
      projects = await Project.findByMember(req.user.user_id);
    }

    res.json({ projects: projects || [] });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to fetch project', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const project = await Project.update(projectId, updateData);
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    await Project.delete(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    let projects, tasks;

    if (req.user.role === 'MANAGER') {
      projects = await Project.findByOwner(req.user.user_id);
    } else if (req.user.role === 'DEVELOPER') {
      projects = await Project.findByMember(req.user.user_id);
      tasks = await Task.findByDeveloper(req.user.user_id);
    }

    res.json({ projects: projects || [], tasks: tasks || [] });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
};

// Legacy method - keeping for compatibility but will need implementation
exports.assignMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { memberIds } = req.body;

    // This would need to be implemented if we want project-level member assignments
    // For now, members are assigned via tasks

    res.json({ message: 'Members are assigned via task assignments' });
  } catch (error) {
    console.error('Assign members error:', error);
    res.status(500).json({ message: 'Failed to assign members', error: error.message });
  }
};
