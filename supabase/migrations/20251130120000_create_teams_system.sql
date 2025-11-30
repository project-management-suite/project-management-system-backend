-- Migration: Create Teams System
-- Description: Adds teams functionality where developers can be in multiple teams and managers can manage multiple teams

-- Create teams table
CREATE TABLE teams (
    team_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT teams_name_unique UNIQUE(team_name),
    CONSTRAINT teams_name_not_empty CHECK (length(trim(team_name)) > 0)
);

-- Create team_members table (many-to-many relationship between users and teams)
CREATE TABLE team_members (
    team_member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    role_in_team VARCHAR(50) DEFAULT 'DEVELOPER' CHECK (role_in_team IN ('DEVELOPER', 'LEAD_DEVELOPER', 'MANAGER')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT team_members_unique UNIQUE(team_id, user_id)
);

-- Create team_projects table (many-to-many relationship between teams and projects)
CREATE TABLE team_projects (
    team_project_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT team_projects_unique UNIQUE(team_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX idx_teams_manager_id ON teams(manager_id);
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_active ON team_members(is_active);
CREATE INDEX idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX idx_team_projects_project_id ON team_projects(project_id);
CREATE INDEX idx_team_projects_active ON team_projects(is_active);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for teams table
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add sample teams data (only if managers exist)
INSERT INTO teams (team_name, description, manager_id) 
SELECT 'Frontend Team', 'Responsible for user interface and user experience development', user_id
FROM profiles WHERE role = 'MANAGER' LIMIT 1;

INSERT INTO teams (team_name, description, manager_id) 
SELECT 'Backend Team', 'Handles server-side development and API creation', user_id
FROM profiles WHERE role = 'MANAGER' LIMIT 1;

INSERT INTO teams (team_name, description, manager_id) 
SELECT 'Mobile Team', 'Develops mobile applications for iOS and Android', user_id
FROM profiles WHERE role = 'MANAGER' LIMIT 1;

INSERT INTO teams (team_name, description, manager_id) 
SELECT 'DevOps Team', 'Manages infrastructure, deployment, and system operations', user_id
FROM profiles WHERE role = 'MANAGER' LIMIT 1;

-- Add team members (developers and managers to teams) - only if users exist
-- Add some developers to Frontend Team
INSERT INTO team_members (team_id, user_id, role_in_team)
SELECT t.team_id, p.user_id, 'LEAD_DEVELOPER'
FROM teams t
CROSS JOIN profiles p
WHERE t.team_name = 'Frontend Team' 
  AND p.role = 'DEVELOPER'
  AND p.user_id IN (SELECT user_id FROM profiles WHERE role = 'DEVELOPER' ORDER BY user_id LIMIT 1);

-- Add some developers to Backend Team
INSERT INTO team_members (team_id, user_id, role_in_team)
SELECT t.team_id, p.user_id, 'DEVELOPER'
FROM teams t
CROSS JOIN profiles p
WHERE t.team_name = 'Backend Team' 
  AND p.role = 'DEVELOPER'
  AND p.user_id IN (SELECT user_id FROM profiles WHERE role = 'DEVELOPER' ORDER BY user_id LIMIT 1 OFFSET 1);

-- Add managers to teams (managers can be in teams too)
INSERT INTO team_members (team_id, user_id, role_in_team)
SELECT t.team_id, p.user_id, 'MANAGER'
FROM teams t
CROSS JOIN profiles p
WHERE t.team_name IN ('Frontend Team', 'Backend Team')
  AND p.role = 'MANAGER'
  AND p.user_id != t.manager_id -- Don't add the team manager as a member (they're already the manager)
  AND p.user_id IN (SELECT user_id FROM profiles WHERE role = 'MANAGER' ORDER BY user_id LIMIT 1);

-- Note: Simplified team member assignment - assigns available users to teams

-- Assign teams to projects (only if projects exist)
INSERT INTO team_projects (team_id, project_id)
SELECT t.team_id, p.project_id
FROM teams t, projects p
WHERE t.team_name = 'Frontend Team' 
  AND p.project_id IN (SELECT project_id FROM projects LIMIT 1);

INSERT INTO team_projects (team_id, project_id)
SELECT t.team_id, p.project_id
FROM teams t, projects p
WHERE t.team_name = 'Backend Team' 
  AND p.project_id IN (SELECT project_id FROM projects LIMIT 1);

INSERT INTO team_projects (team_id, project_id)
SELECT t.team_id, p.project_id
FROM teams t, projects p
WHERE t.team_name = 'Mobile Team' 
  AND p.project_id IN (SELECT project_id FROM projects LIMIT 1 OFFSET 1);

-- Note: Simplified project assignment - assigns teams to available projects

-- Create RLS policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they are part of or manage" ON teams
    FOR SELECT USING (
        auth.uid() = manager_id OR 
        auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = teams.team_id AND is_active = true)
    );

CREATE POLICY "Managers can create teams" ON teams
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('MANAGER', 'ADMIN'))
    );

CREATE POLICY "Managers can update their teams" ON teams
    FOR UPDATE USING (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their teams" ON teams
    FOR DELETE USING (auth.uid() = manager_id);

-- Team members policies  
CREATE POLICY "Users can view team members of their teams" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM teams WHERE manager_id = auth.uid()
            UNION
            SELECT team_id FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

CREATE POLICY "Managers and admins can manage team members" ON team_members
    FOR ALL USING (
        -- Team managers can manage their team members
        team_id IN (SELECT team_id FROM teams WHERE manager_id = auth.uid())
        OR
        -- Admins can manage all team members
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'ADMIN')
        OR
        -- Other managers can manage team members if they have MANAGER role
        (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'MANAGER'))
    ) WITH CHECK (
        -- Same conditions for insert/update
        team_id IN (SELECT team_id FROM teams WHERE manager_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'ADMIN')
        OR
        (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'MANAGER'))
    );

-- Team projects policies
CREATE POLICY "Users can view team projects of their teams" ON team_projects
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM teams WHERE manager_id = auth.uid()
            UNION
            SELECT team_id FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

CREATE POLICY "Managers can manage team projects" ON team_projects
    FOR ALL USING (
        team_id IN (SELECT team_id FROM teams WHERE manager_id = auth.uid())
    );

-- Comments
COMMENT ON TABLE teams IS 'Teams managed by managers with multiple developers';
COMMENT ON TABLE team_members IS 'Many-to-many relationship between users and teams';
COMMENT ON TABLE team_projects IS 'Many-to-many relationship between teams and projects';