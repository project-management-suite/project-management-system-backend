/*
  # Add Developer Project Access Policy

  1. Security Changes
    - Add policy for developers to read projects they are assigned to via tasks
    
  2. Important Notes
    - This policy was deferred from initial projects table creation
    - Now that tasks and task_assignments tables exist, we can reference them
*/

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
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE t.project_id = projects.project_id
      AND ta.developer_id = auth.uid()
    )
  );