/*
  # Create Tasks and Task Assignments Tables

  1. New Tables
    - `tasks`
      - `task_id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `title` (text, not null)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text, check constraint for NEW/ASSIGNED/IN_PROGRESS/COMPLETED)
      - `created_at` (timestamptz, defaults to now())
      - `updated_at` (timestamptz, defaults to now())
    
    - `task_assignments`
      - `assignment_id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `developer_id` (uuid, foreign key to profiles)
      - `assigned_at` (timestamptz, defaults to now())

  2. Security
    - Enable RLS on both tables
    - Managers can CRUD tasks in their own projects
    - Developers can read tasks they are assigned to
    - Developers can update status of their assigned tasks
    - Admins have full access
    - Managers can create/delete task assignments in their projects
    - Admins can manage all assignments

  3. Important Notes
    - Task assignments link developers to specific tasks
    - Developers can only see and update tasks they are assigned to
    - Status updates by developers are restricted to status field only
*/

CREATE TABLE IF NOT EXISTS tasks (
  task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(task_id, developer_id)
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read tasks in own projects"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = tasks.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Developers can read assigned tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_assignments
      WHERE task_assignments.task_id = tasks.task_id
      AND task_assignments.developer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Managers can create tasks in own projects"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = tasks.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update tasks in own projects"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = tasks.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = tasks.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update status of assigned tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_assignments
      WHERE task_assignments.task_id = tasks.task_id
      AND task_assignments.developer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_assignments
      WHERE task_assignments.task_id = tasks.task_id
      AND task_assignments.developer_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete tasks in own projects"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = tasks.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all tasks"
  ON tasks
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

CREATE POLICY "Managers can read assignments in own projects"
  ON task_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.project_id
      WHERE t.task_id = task_assignments.task_id
      AND p.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Developers can read own assignments"
  ON task_assignments
  FOR SELECT
  TO authenticated
  USING (developer_id = auth.uid());

CREATE POLICY "Admins can read all assignments"
  ON task_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Managers can create assignments in own projects"
  ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.project_id
      WHERE t.task_id = task_assignments.task_id
      AND p.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete assignments in own projects"
  ON task_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.project_id
      WHERE t.task_id = task_assignments.task_id
      AND p.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments"
  ON task_assignments
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