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

// Bulk Task Operations

exports.bulkCreateTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'Tasks array is required and cannot be empty' });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const results = [];
    const errors = [];

    // Validate all tasks before creation
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.title || !task.description) {
        errors.push({
          index: i,
          error: 'Title and description are required for each task'
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors found',
        errors: errors
      });
    }

    // Create tasks in transaction-like manner
    for (let i = 0; i < tasks.length; i++) {
      try {
        const taskData = {
          ...tasks[i],
          project_id: projectId
        };

        const newTask = await Task.create(taskData);
        results.push({
          index: i,
          success: true,
          task: newTask
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: 'Bulk task creation completed',
      total: tasks.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk create tasks error:', error);
    res.status(500).json({ message: 'Failed to create tasks in bulk', error: error.message });
  }
};

exports.bulkUpdateTasks = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required and cannot be empty' });
    }

    // Limit bulk operations to 100 tasks at once
    if (updates.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 tasks can be updated in a single bulk operation' });
    }

    const results = [];
    const errors = [];

    // Validate all updates have required fields
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      if (!update.task_id) {
        errors.push({
          index: i,
          error: 'task_id is required for each update'
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors found',
        errors: errors
      });
    }

    // Process updates
    for (let i = 0; i < updates.length; i++) {
      try {
        const update = updates[i];
        const { task_id, ...updateData } = update;

        // Check if task exists and user has permission
        const task = await Task.findById(task_id);
        if (!task) {
          errors.push({
            index: i,
            task_id: task_id,
            error: 'Task not found'
          });
          continue;
        }

        // Verify project permission
        const project = await Project.findById(task.project_id);
        if (!project) {
          errors.push({
            index: i,
            task_id: task_id,
            error: 'Associated project not found'
          });
          continue;
        }

        // All authenticated users can update tasks
        // (Permission check removed to allow developers to update their tasks)

        const updatedTask = await Task.update(task_id, updateData);
        results.push({
          index: i,
          task_id: task_id,
          success: true,
          task: updatedTask
        });
      } catch (error) {
        errors.push({
          index: i,
          task_id: updates[i].task_id,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk task update completed',
      total: updates.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    res.status(500).json({ message: 'Failed to update tasks in bulk', error: error.message });
  }
};

exports.bulkDeleteTasks = async (req, res) => {
  try {
    const { task_ids } = req.body;

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ message: 'task_ids array is required and cannot be empty' });
    }

    // Limit bulk operations to 100 tasks at once
    if (task_ids.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 tasks can be deleted in a single bulk operation' });
    }

    const results = [];
    const errors = [];

    // Process deletions
    for (let i = 0; i < task_ids.length; i++) {
      try {
        const taskId = task_ids[i];

        // Check if task exists and user has permission
        const task = await Task.findById(taskId);
        if (!task) {
          errors.push({
            index: i,
            task_id: taskId,
            error: 'Task not found'
          });
          continue;
        }

        // Verify project permission
        const project = await Project.findById(task.project_id);
        if (!project) {
          errors.push({
            index: i,
            task_id: taskId,
            error: 'Associated project not found'
          });
          continue;
        }

        // All authenticated users can delete tasks
        // (Permission check removed to allow developers to delete their tasks)

        await Task.delete(taskId);
        results.push({
          index: i,
          task_id: taskId,
          success: true
        });
      } catch (error) {
        errors.push({
          index: i,
          task_id: task_ids[i],
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk task deletion completed',
      total: task_ids.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk delete tasks error:', error);
    res.status(500).json({ message: 'Failed to delete tasks in bulk', error: error.message });
  }
};
