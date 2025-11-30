// src/controllers/team.controller.js
const Team = require('../models/team.model');
const { supabase } = require('../config/supabase');

/**
 * Get all teams (with role-based filtering)
 */
exports.getAllTeams = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;

        let teams;

        if (userRole === 'ADMIN') {
            // Admins see all teams
            teams = await Team.findAll();
        } else if (userRole === 'MANAGER') {
            // Managers see only their teams
            teams = await Team.findAll({ managerId: userId });
        } else {
            // Developers see teams they are part of
            teams = await Team.findByUserId(userId);
        }

        res.json({
            success: true,
            teams: teams || []
        });

    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to retrieve teams' });
    }
};

/**
 * Get specific team by ID
 */
exports.getTeamById = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({
            success: true,
            team
        });

    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to retrieve team' });
    }
};

/**
 * Create a new team (Manager/Admin only)
 */
exports.createTeam = async (req, res) => {
    try {
        const { team_name, description } = req.body;
        const managerId = req.user.user_id;

        if (!team_name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        // Check if user is manager or admin
        if (!['MANAGER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only managers and admins can create teams' });
        }

        const team = await Team.create({
            team_name,
            description,
            manager_id: managerId
        });

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team
        });

    } catch (error) {
        console.error('Create team error:', error);

        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Team name already exists' });
        }

        res.status(500).json({ error: 'Failed to create team' });
    }
};

/**
 * Update team (Manager/Admin only)
 */
exports.updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { team_name, description } = req.body;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        // Check if team exists and user has permission
        const existingTeam = await Team.findById(teamId);
        if (!existingTeam) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && existingTeam.manager_id !== userId) {
            return res.status(403).json({ error: 'Only the team manager or admin can update this team' });
        }

        const updateData = {};
        if (team_name !== undefined) updateData.team_name = team_name;
        if (description !== undefined) updateData.description = description;

        const updatedTeam = await Team.update(teamId, updateData);

        res.json({
            success: true,
            message: 'Team updated successfully',
            team: updatedTeam
        });

    } catch (error) {
        console.error('Update team error:', error);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'Team name already exists' });
        }

        res.status(500).json({ error: 'Failed to update team' });
    }
};

/**
 * Delete team (Manager/Admin only)
 */
exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        // Check if team exists and user has permission
        const existingTeam = await Team.findById(teamId);
        if (!existingTeam) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && existingTeam.manager_id !== userId) {
            return res.status(403).json({ error: 'Only the team manager or admin can delete this team' });
        }

        await Team.delete(teamId);

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });

    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
};

/**
 * Add member to team
 */
exports.addMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, roleInTeam = 'DEVELOPER' } = req.body;
        const currentUserId = req.user.user_id;
        const userRole = req.user.role;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if team exists and user has permission
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && team.manager_id !== currentUserId) {
            return res.status(403).json({ error: 'Only the team manager or admin can add members' });
        }

        // Check if user exists and has appropriate role
        const { data: targetUser, error: userError } = await supabase
            .from('profiles')
            .select('user_id, username, role')
            .eq('user_id', userId)
            .single();

        if (userError || !targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Allow developers and managers to be added to teams
        if (!['DEVELOPER', 'MANAGER'].includes(targetUser.role)) {
            return res.status(400).json({ error: 'Only developers and managers can be added to teams' });
        }

        // If adding a manager, set appropriate role in team
        let teamRole = roleInTeam;
        if (targetUser.role === 'MANAGER' && !roleInTeam) {
            teamRole = 'MANAGER';
        }

        const member = await Team.addMember(teamId, userId, teamRole);

        res.status(201).json({
            success: true,
            message: 'Member added to team successfully',
            member
        });

    } catch (error) {
        console.error('Add member error:', error);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'User is already a member of this team' });
        }

        res.status(500).json({ error: 'Failed to add member to team' });
    }
};

/**
 * Remove member from team
 */
exports.removeMember = async (req, res) => {
    try {
        const { teamId, userId } = req.params;
        const currentUserId = req.user.user_id;
        const userRole = req.user.role;

        // Check if team exists and user has permission
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && team.manager_id !== currentUserId) {
            return res.status(403).json({ error: 'Only the team manager or admin can remove members' });
        }

        await Team.removeMember(teamId, userId);

        res.json({
            success: true,
            message: 'Member removed from team successfully'
        });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member from team' });
    }
};

/**
 * Update member role in team
 */
exports.updateMemberRole = async (req, res) => {
    try {
        const { teamId, userId } = req.params;
        const { roleInTeam } = req.body;
        const currentUserId = req.user.user_id;
        const userRole = req.user.role;

        if (!roleInTeam || !['DEVELOPER', 'LEAD_DEVELOPER', 'MANAGER'].includes(roleInTeam)) {
            return res.status(400).json({ error: 'Valid role is required (DEVELOPER, LEAD_DEVELOPER, or MANAGER)' });
        }

        // Check if team exists and user has permission
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && team.manager_id !== currentUserId) {
            return res.status(403).json({ error: 'Only the team manager or admin can update member roles' });
        }

        const updatedMember = await Team.updateMemberRole(teamId, userId, roleInTeam);

        res.json({
            success: true,
            message: 'Member role updated successfully',
            member: updatedMember
        });

    } catch (error) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};

/**
 * Assign team to project
 */
exports.assignToProject = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { projectId } = req.body;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Check if team exists and user has permission
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && team.manager_id !== userId) {
            return res.status(403).json({ error: 'Only the team manager or admin can assign team to projects' });
        }

        // Check if project exists
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('project_id, project_name')
            .eq('project_id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const assignment = await Team.assignToProject(teamId, projectId);

        res.status(201).json({
            success: true,
            message: 'Team assigned to project successfully',
            assignment
        });

    } catch (error) {
        console.error('Assign team to project error:', error);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'Team is already assigned to this project' });
        }

        res.status(500).json({ error: 'Failed to assign team to project' });
    }
};

/**
 * Remove team from project
 */
exports.removeFromProject = async (req, res) => {
    try {
        const { teamId, projectId } = req.params;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        // Check if team exists and user has permission
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check permissions
        if (userRole !== 'ADMIN' && team.manager_id !== userId) {
            return res.status(403).json({ error: 'Only the team manager or admin can remove team from projects' });
        }

        await Team.removeFromProject(teamId, projectId);

        res.json({
            success: true,
            message: 'Team removed from project successfully'
        });

    } catch (error) {
        console.error('Remove team from project error:', error);
        res.status(500).json({ error: 'Failed to remove team from project' });
    }
};

/**
 * Get team statistics
 */
exports.getTeamStats = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const stats = await Team.getStats(teamId);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get team stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve team statistics' });
    }
};

/**
 * Get available users (developers and managers) for team assignment
 */
exports.getAvailableUsers = async (req, res) => {
    try {
        const users = await Team.getAvailableUsers();

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Get available users error:', error);
        res.status(500).json({ error: 'Failed to retrieve available users' });
    }
};

/**
 * Get available developers for team assignment (backward compatibility)
 */
exports.getAvailableDevelopers = async (req, res) => {
    try {
        const developers = await Team.getAvailableDevelopers();

        res.json({
            success: true,
            developers
        });

    } catch (error) {
        console.error('Get available developers error:', error);
        res.status(500).json({ error: 'Failed to retrieve available developers' });
    }
};

/**
 * Get dashboard stats for teams (manager/admin view)
 */
exports.getTeamDashboard = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;

        let teams;
        if (userRole === 'ADMIN') {
            teams = await Team.findAll();
        } else if (userRole === 'MANAGER') {
            teams = await Team.findAll({ managerId: userId });
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Calculate dashboard metrics
        const dashboard = {
            totalTeams: teams.length,
            totalMembers: 0,
            teamsOverview: []
        };

        for (const team of teams) {
            const stats = await Team.getStats(team.team_id);
            dashboard.totalMembers += stats.totalMembers;

            dashboard.teamsOverview.push({
                teamId: team.team_id,
                teamName: team.team_name,
                manager: team.manager.username,
                memberCount: stats.totalMembers,
                projectCount: stats.totalProjects,
                totalTasks: stats.totalTasks,
                completedTasks: stats.completedTasks,
                productivity: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
            });
        }

        res.json({
            success: true,
            dashboard
        });

    } catch (error) {
        console.error('Get team dashboard error:', error);
        res.status(500).json({ error: 'Failed to retrieve team dashboard' });
    }
};