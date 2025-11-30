// src/models/team.model.js
const { supabase } = require('../config/supabase');

class Team {
    /**
     * Create a new team
     */
    static async create(teamData) {
        const { data, error } = await supabase
            .from('teams')
            .insert(teamData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find team by ID with members and projects
     */
    static async findById(teamId) {
        const { data, error } = await supabase
            .from('teams')
            .select(`
        *,
        manager:profiles!teams_manager_id_fkey(user_id, username, email),
        team_members(
          team_member_id,
          role_in_team,
          joined_at,
          is_active,
          user:profiles(user_id, username, email, role)
        ),
        team_projects(
          team_project_id,
          assigned_at,
          is_active,
          project:projects(project_id, project_name, description)
        )
      `)
            .eq('team_id', teamId)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all teams (with filters)
     */
    static async findAll(filters = {}) {
        let query = supabase
            .from('teams')
            .select(`
        *,
        manager:profiles!teams_manager_id_fkey(user_id, username, email),
        team_members(
          team_member_id,
          role_in_team,
          user:profiles(user_id, username, email)
        )
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.managerId) {
            query = query.eq('manager_id', filters.managerId);
        }

        if (filters.search) {
            query = query.or(
                `team_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
            );
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get teams for a specific user (as manager or member)
     */
    static async findByUserId(userId) {
        const { data, error } = await supabase
            .from('teams')
            .select(`
        *,
        manager:profiles!teams_manager_id_fkey(user_id, username, email),
        team_members!inner(
          team_member_id,
          role_in_team,
          is_active
        )
      `)
            .or(
                `manager_id.eq.${userId},team_members.user_id.eq.${userId}`
            )
            .eq('is_active', true)
            .eq('team_members.is_active', true);

        if (error) throw error;
        return data;
    }

    /**
     * Update team
     */
    static async update(teamId, updateData) {
        const { data, error } = await supabase
            .from('teams')
            .update(updateData)
            .eq('team_id', teamId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete team (soft delete)
     */
    static async delete(teamId) {
        const { data, error } = await supabase
            .from('teams')
            .update({ is_active: false })
            .eq('team_id', teamId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Add member to team
     */
    static async addMember(teamId, userId, roleInTeam = 'DEVELOPER') {
        const { data, error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userId,
                role_in_team: roleInTeam
            })
            .select(`
        *,
        user:profiles(user_id, username, email, role),
        team:teams(team_id, team_name)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove member from team (soft delete)
     */
    static async removeMember(teamId, userId) {
        const { data, error } = await supabase
            .from('team_members')
            .update({ is_active: false })
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update member role in team
     */
    static async updateMemberRole(teamId, userId, newRole) {
        const { data, error } = await supabase
            .from('team_members')
            .update({ role_in_team: newRole })
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .eq('is_active', true)
            .select(`
        *,
        user:profiles(user_id, username, email),
        team:teams(team_id, team_name)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Assign team to project
     */
    static async assignToProject(teamId, projectId) {
        const { data, error } = await supabase
            .from('team_projects')
            .insert({
                team_id: teamId,
                project_id: projectId
            })
            .select(`
        *,
        team:teams(team_id, team_name),
        project:projects(project_id, project_name)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove team from project
     */
    static async removeFromProject(teamId, projectId) {
        const { data, error } = await supabase
            .from('team_projects')
            .update({ is_active: false })
            .eq('team_id', teamId)
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get team statistics
     */
    static async getStats(teamId) {
        // Get team projects
        const { data: teamProjects, error: projectsError } = await supabase
            .from('team_projects')
            .select(`
        project:projects(
          project_id,
          project_name
        )
      `)
            .eq('team_id', teamId)
            .eq('is_active', true);

        if (projectsError) throw projectsError;

        // Get all tasks for team projects
        const projectIds = teamProjects.map(tp => tp.project.project_id).filter(id => id);
        let allTasks = [];

        if (projectIds.length > 0) {
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('task_id, status, created_at, project_id')
                .in('project_id', projectIds);

            if (tasksError) throw tasksError;
            allTasks = tasks || [];
        }

        // Get team members
        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
        user:profiles(user_id, username)
      `)
            .eq('team_id', teamId)
            .eq('is_active', true);

        if (membersError) throw membersError;

        // Get task assignments for team members
        const memberIds = members.map(member => member.user.user_id);
        let taskAssignments = [];

        if (memberIds.length > 0) {
            const { data: assignments, error: assignmentsError } = await supabase
                .from('task_assignments')
                .select(`
            assignment_id,
            developer_id,
            task:tasks(task_id, status, project_id)
          `)
                .in('developer_id', memberIds);

            if (assignmentsError) throw assignmentsError;
            taskAssignments = assignments || [];
        }

        // Calculate statistics
        const stats = {
            totalProjects: teamProjects.length,
            totalMembers: members.length,
            totalTasks: allTasks.length,
            completedTasks: 0,
            inProgressTasks: 0,
            pendingTasks: 0,
            memberStats: []
        };

        // Calculate project/task stats from allTasks
        allTasks.forEach(task => {
            if (task.status === 'COMPLETED') stats.completedTasks++;
            else if (task.status === 'IN_PROGRESS') stats.inProgressTasks++;
            else stats.pendingTasks++;
        });

        // Calculate member stats
        stats.memberStats = members.map(member => {
            const memberTasks = taskAssignments
                .filter(assignment => assignment.developer_id === member.user.user_id)
                .map(assignment => assignment.task)
                .filter(task => task); // Remove null tasks

            return {
                userId: member.user.user_id,
                username: member.user.username,
                totalTasks: memberTasks.length,
                completedTasks: memberTasks.filter(t => t.status === 'COMPLETED').length,
                productivity: memberTasks.length > 0 ?
                    Math.round((memberTasks.filter(t => t.status === 'COMPLETED').length / memberTasks.length) * 100) : 0
            };
        });

        return stats;
    }

    /**
     * Get available users (developers and managers) for team assignment
     */
    static async getAvailableUsers(excludeTeamId = null) {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, username, email, role')
            .in('role', ['DEVELOPER', 'MANAGER'])
            .order('username');

        if (error) throw error;
        return data;
    }

    /**
     * Get available developers (backward compatibility)
     */
    static async getAvailableDevelopers(excludeTeamId = null) {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, username, email')
            .eq('role', 'DEVELOPER')
            .order('username');

        if (error) throw error;
        return data;
    }
}

module.exports = Team;