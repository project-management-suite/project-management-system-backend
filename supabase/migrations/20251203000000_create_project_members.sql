/*
  # Create Project Members Table

  1. New Table
    - `project_members`
      - `membership_id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `member_id` (uuid, foreign key to profiles)
      - `role` (text, default 'MEMBER' - for future expansion)
      - `joined_at` (timestamptz, defaults to now())
      - Unique constraint on (project_id, member_id)

  2. Security
    - Enable RLS
    - Managers can manage members in their own projects
    - Developers can read their own project memberships
    - Admins have full access

  3. Important Notes
    - This creates direct project membership separate from task assignments
    - Members can be assigned to projects without specific tasks
    - Task assignments and project membership are now independent
    - A developer can be a project member but not have any tasks assigned yet
*/

CREATE TABLE IF NOT EXISTS project_members (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'LEAD')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, member_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Managers can read members in their own projects
CREATE POLICY "Managers can read project members in own projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

-- Developers can read their own project memberships
CREATE POLICY "Developers can read own project memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

-- Admins can read all project memberships
CREATE POLICY "Admins can read all project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Managers can add members to their own projects
CREATE POLICY "Managers can add members to own projects"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

-- Managers can remove members from their own projects
CREATE POLICY "Managers can remove members from own projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

-- Managers can update member roles in their own projects
CREATE POLICY "Managers can update member roles in own projects"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = project_members.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

-- Admins can manage all project memberships
CREATE POLICY "Admins can manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Update the existing developer project access policy to include project membership
DROP POLICY IF EXISTS "Developers can read assigned projects" ON projects;

CREATE POLICY "Developers can read assigned projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'DEVELOPER'
    )
    AND (
      -- Through task assignments (existing)
      EXISTS (
        SELECT 1 FROM tasks t
        JOIN task_assignments ta ON t.task_id = ta.task_id
        WHERE t.project_id = projects.project_id
        AND ta.developer_id = auth.uid()
      )
      OR
      -- Through project membership (new)
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.project_id
        AND pm.member_id = auth.uid()
      )
    )
  );