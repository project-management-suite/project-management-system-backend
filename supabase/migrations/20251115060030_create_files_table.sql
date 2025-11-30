/*
  # Create Files Table

  1. New Tables
    - `files`
      - `file_id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `task_id` (uuid, foreign key to tasks, nullable)
      - `uploaded_by_user_id` (uuid, foreign key to profiles)
      - `file_name` (text, not null)
      - `file_path_in_storage` (text, not null)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `upload_date` (timestamptz, defaults to now())

  2. Security
    - Enable RLS on `files` table
    - Managers can read/upload files in their own projects
    - Developers can read/upload files for tasks they are assigned to
    - Admins have full access to all files
    - Users can only delete their own uploaded files (unless admin)

  3. Important Notes
    - Files are stored in Supabase Storage
    - This table tracks metadata and references storage paths
    - Files can be associated with projects or specific tasks
*/

CREATE TABLE IF NOT EXISTS files (
  file_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(task_id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path_in_storage text NOT NULL,
  file_size bigint,
  mime_type text,
  upload_date timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read files in own projects"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = files.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Developers can read files in assigned projects"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.task_id
      WHERE t.project_id = files.project_id
      AND ta.developer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all files"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Managers can upload files to own projects"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = files.project_id
      AND projects.owner_manager_id = auth.uid()
    )
    AND uploaded_by_user_id = auth.uid()
  );

CREATE POLICY "Developers can upload files to assigned tasks"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.task_id
      WHERE t.project_id = files.project_id
      AND ta.developer_id = auth.uid()
    )
    AND uploaded_by_user_id = auth.uid()
  );

CREATE POLICY "Users can delete own files"
  ON files
  FOR DELETE
  TO authenticated
  USING (uploaded_by_user_id = auth.uid());

CREATE POLICY "Managers can delete files in own projects"
  ON files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.project_id = files.project_id
      AND projects.owner_manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all files"
  ON files
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