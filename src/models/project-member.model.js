// src/models/project-member.model.js
const { supabase } = require('../config/supabase');

class ProjectMember {
    constructor(data) {
        this.membership_id = data.membership_id;
        this.project_id = data.project_id;
        this.member_id = data.member_id;
        this.role = data.role || 'MEMBER';
        this.joined_at = data.joined_at;
        // Preserve joined data
        if (data.member) {
            this.member = data.member;
        }
        if (data.project) {
            this.project = data.project;
        }
    }

    static async addMember(project_id, member_id, role = 'MEMBER') {
        const { data, error } = await supabase
            .from('project_members')
            .insert({
                project_id,
                member_id,
                role
            })
            .select(`
        *,
        member:profiles!project_members_member_id_fkey(user_id, username, email, role, profile_photo_url)
      `)
            .single();

        if (error) {
            // Check if it's a duplicate error
            if (error.code === '23505') {
                throw new Error('Developer is already a member of this project');
            }
            throw error;
        }

        return new ProjectMember(data);
    }

    static async removeMember(project_id, member_id) {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', project_id)
            .eq('member_id', member_id);

        if (error) throw error;
        return true;
    }

    static async getProjectMembers(project_id) {
        const { data, error } = await supabase
            .from('project_members')
            .select(`
        *,
        member:profiles!project_members_member_id_fkey(user_id, username, email, role, profile_photo_url)
      `)
            .eq('project_id', project_id)
            .order('joined_at', { ascending: true });

        if (error) throw error;
        return data.map(member => new ProjectMember(member));
    }

    static async getUserProjects(member_id) {
        const { data, error } = await supabase
            .from('project_members')
            .select(`
        *,
        project:projects!project_members_project_id_fkey(*)
      `)
            .eq('member_id', member_id)
            .order('joined_at', { ascending: false });

        if (error) throw error;
        return data.map(membership => membership.project);
    }

    static async updateMemberRole(project_id, member_id, role) {
        const { data, error } = await supabase
            .from('project_members')
            .update({ role })
            .eq('project_id', project_id)
            .eq('member_id', member_id)
            .select(`
        *,
        member:profiles!project_members_member_id_fkey(user_id, username, email, role, profile_photo_url)
      `)
            .single();

        if (error) throw error;
        return new ProjectMember(data);
    }

    static async isMember(project_id, member_id) {
        const { data, error } = await supabase
            .from('project_members')
            .select('membership_id')
            .eq('project_id', project_id)
            .eq('member_id', member_id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }

    static async bulkAddMembers(project_id, member_ids, role = 'MEMBER') {
        const members = member_ids.map(member_id => ({
            project_id,
            member_id,
            role
        }));

        const { data, error } = await supabase
            .from('project_members')
            .upsert(members, {
                onConflict: 'project_id,member_id',
                ignoreDuplicates: false
            })
            .select(`
        *,
        member:profiles!project_members_member_id_fkey(user_id, username, email, role, profile_photo_url)
      `);

        if (error) throw error;
        return data.map(member => new ProjectMember(member));
    }
}

module.exports = ProjectMember;