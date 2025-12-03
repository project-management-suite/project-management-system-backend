/*
  # Allow Standalone Files

  1. Changes
    - Make project_id nullable in files table to allow standalone files
    - Add policies for standalone file operations
    - Allow users to upload standalone files for sharing

  2. Security
    - Users can upload standalone files (project_id = NULL)
    - Users can read their own standalone files
    - Users can share standalone files with others
    - Users can delete their own standalone files
*/

-- Make project_id nullable to allow standalone files
ALTER TABLE files ALTER COLUMN project_id DROP NOT NULL;

-- Add policy for users to upload standalone files
CREATE POLICY "Users can upload standalone files"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IS NULL
    AND uploaded_by_user_id = auth.uid()
  );

-- Add policy for users to read their own standalone files
CREATE POLICY "Users can read own standalone files"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    AND uploaded_by_user_id = auth.uid()
  );

-- Add policy for users to read standalone files shared with them
CREATE POLICY "Users can read shared standalone files"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    AND EXISTS (
      SELECT 1 FROM file_shares
      WHERE file_shares.file_id = files.file_id
      AND file_shares.shared_with_user_id = auth.uid()
    )
  );

-- Add policy for users to delete their own standalone files
CREATE POLICY "Users can delete own standalone files"
  ON files
  FOR DELETE
  TO authenticated
  USING (
    project_id IS NULL
    AND uploaded_by_user_id = auth.uid()
  );