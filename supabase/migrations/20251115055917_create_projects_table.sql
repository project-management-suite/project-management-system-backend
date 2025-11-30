/*
  # Create Projects Table

  1. New Tables
    - `projects`
      - `project_id` (uuid, primary key)
      - `project_name` (text, not null)
      - `description` (text)
      - `owner_manager_id` (uuid, foreign key to profiles.user_id)
      - `created_at` (timestamptz, defaults to now())
      - `updated_at` (timestamptz, defaults to now())

  2. Security
    - Enable RLS on `projects` table
    - Policy for managers to read their own projects
    - Policy for admins to read all projects
    - Policy for managers to create their own projects
    - Policy for managers to update/delete their own projects
    - Policy for admins to update/delete any project

  3. Important Notes
    - Only managers can own projects
    - Developers policy will be added after tasks table is created
    - Admins have full visibility and control
*/

CREATE TABLE IF NOT EXISTS projects (
  project_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  description text,
  owner_manager_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    owner_manager_id = auth.uid()
  );

CREATE POLICY "Admins can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Managers can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'MANAGER'
    )
    AND owner_manager_id = auth.uid()
  );

CREATE POLICY "Managers can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (owner_manager_id = auth.uid())
  WITH CHECK (owner_manager_id = auth.uid());

CREATE POLICY "Managers can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (owner_manager_id = auth.uid());

CREATE POLICY "Admins can update any project"
  ON projects
  FOR UPDATE
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

CREATE POLICY "Admins can delete any project"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );