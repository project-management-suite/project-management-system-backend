// src/controllers/project.controller.js
const Project = require('../models/project.model');
const ProjectMember = require('../models/project-member.model');
const Task = require('../models/task.model');
const { sendProjectNotification } = require('../utils/mailer');

exports.createProject = async (req, res) => {
  try {
    const { project_name, description, status, start_date, end_date } = req.body;

    if (!project_name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      project_name,
      description,
      status,
      start_date,
      end_date,
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
      // Admins can see all projects
      projects = await Project.findAll();
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

exports.assignMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { memberIds, role = 'MEMBER' } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'memberIds array is required' });
    }

    // Check if project exists and user has permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is the project manager or admin
    if (req.user.role !== 'ADMIN' && project.owner_manager_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only project managers and admins can assign members' });
    }

    // Add members to project
    const results = await ProjectMember.bulkAddMembers(projectId, memberIds, role);

    res.status(201).json({
      message: 'Members assigned successfully',
      members: results,
      project_id: projectId
    });
  } catch (error) {
    console.error('Assign members error:', error);
    if (error.message === 'Developer is already a member of this project') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to assign members', error: error.message });
  }
};

// New status management endpoints
exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
        validStatuses: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
      });
    }

    const project = await Project.updateStatus(projectId, status);

    res.json({
      success: true,
      message: 'Project status updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ message: 'Failed to update project status', error: error.message });
  }
};

exports.updateProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { progress_percentage } = req.body;

    if (progress_percentage === undefined || progress_percentage === null) {
      return res.status(400).json({ message: 'Progress percentage is required' });
    }

    const project = await Project.updateProgress(projectId, progress_percentage);

    res.json({
      success: true,
      message: 'Project progress updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project progress error:', error);
    res.status(500).json({ message: 'Failed to update project progress', error: error.message });
  }
};

exports.getProjectStatusAnalytics = async (req, res) => {
  try {
    let ownerId = null;

    // Managers only see their own projects, admins see all
    if (req.user.role === 'MANAGER') {
      ownerId = req.user.user_id;
    }

    const analytics = await Project.getStatusAnalytics(ownerId);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get project status analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch project analytics', error: error.message });
  }
};

exports.getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    let ownerId = null;

    // Managers only see their own projects, admins see all
    if (req.user.role === 'MANAGER') {
      ownerId = req.user.user_id;
    }

    const projects = await Project.findByStatus(status, ownerId);

    res.json({
      success: true,
      projects,
      total: projects.length
    });
  } catch (error) {
    console.error('Get projects by status error:', error);
    res.status(500).json({ message: 'Failed to fetch projects by status', error: error.message });
  }
};

exports.getProjectStatusHistory = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has permission to view this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // For now, return a simple status history based on project data
    // In a real implementation, this would come from a status_history table
    const history = [
      {
        status: 'PENDING',
        changed_at: project.created_at,
        changed_by: project.owner_manager_id,
        notes: 'Project created'
      },
      {
        status: project.status || 'PENDING',
        changed_at: project.updated_at,
        changed_by: project.owner_manager_id,
        notes: 'Current status'
      }
    ];

    res.json({
      success: true,
      project_id: projectId,
      history
    });
  } catch (error) {
    console.error('Get project status history error:', error);
    res.status(500).json({ message: 'Failed to fetch project status history', error: error.message });
  }
};

// Project member management endpoints
exports.getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const members = await ProjectMember.getProjectMembers(projectId);

    res.json({
      project_id: projectId,
      members: members
    });
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ message: 'Failed to fetch project members', error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // Check if project exists and user has permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is the project manager or admin
    if (req.user.role !== 'ADMIN' && project.owner_manager_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only project managers and admins can remove members' });
    }

    await ProjectMember.removeMember(projectId, memberId);

    res.json({
      message: 'Member removed successfully',
      project_id: projectId,
      member_id: memberId
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Failed to remove member', error: error.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['MEMBER', 'LEAD'].includes(role)) {
      return res.status(400).json({
        message: 'Valid role is required',
        validRoles: ['MEMBER', 'LEAD']
      });
    }

    // Check if project exists and user has permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is the project manager or admin
    if (req.user.role !== 'ADMIN' && project.owner_manager_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only project managers and admins can update member roles' });
    }

    const updatedMember = await ProjectMember.updateMemberRole(projectId, memberId, role);

    res.json({
      message: 'Member role updated successfully',
      member: updatedMember
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Failed to update member role', error: error.message });
  }
};
