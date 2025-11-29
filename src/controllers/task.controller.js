// src/controllers/task.controller.js
const Task = require('../models/task.model');
const Project = require('../models/project.model');
const { sendProjectNotification } = require('../utils/mailer');

exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, start_date, end_date } = req.body;

    // Verify project exists and user has permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner (manager) or admin
    if (req.user.role !== 'ADMIN' && project.owner_manager_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only project managers can create tasks' });
    }

    const task = await Task.create({
      project_id: projectId,
      title,
      description,
      start_date,
      end_date
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get the task to check permissions
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await Task.update(taskId, req.body);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (projectId) {
      const tasks = await Task.findByProject(projectId);
      res.json({ tasks });
    } else {
      // Get tasks for current user based on role
      let tasks;
      if (req.user.role === 'DEVELOPER') {
        tasks = await Task.findByDeveloper(req.user.user_id);
      } else if (req.user.role === 'MANAGER') {
        // Get tasks from all projects owned by this manager
        const projects = await Project.findByOwner(req.user.user_id);
        const allTasks = [];
        for (const project of projects) {
          const projectTasks = await Task.findByProject(project.project_id);
          allTasks.push(...projectTasks);
        }
        tasks = allTasks;
      }
      res.json({ tasks: tasks || [] });
    }
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    await Task.delete(taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

exports.assignDeveloper = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { developer_id } = req.body;

    const assignment = await Task.assignDeveloper(taskId, developer_id);

    // Send notification
    await sendProjectNotification([developer_id], `You have been assigned to a new task`);

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign developer error:', error);
    res.status(500).json({ message: 'Failed to assign developer', error: error.message });
  }
};

exports.unassignDeveloper = async (req, res) => {
  try {
    const { taskId, developerId } = req.params;

    await Task.unassignDeveloper(taskId, developerId);
    res.json({ message: 'Developer unassigned successfully' });
  } catch (error) {
    console.error('Unassign developer error:', error);
    res.status(500).json({ message: 'Failed to unassign developer', error: error.message });
  }
};
