-- Add 'file' to the allowed related_entity_type values in notifications table
-- This allows file sharing notifications to be created

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_entity_type_check;

-- Add the new constraint with 'file' included
ALTER TABLE notifications ADD CONSTRAINT notifications_related_entity_type_check 
    CHECK (related_entity_type IN ('task', 'project', 'milestone', 'file'));

-- Also update the type constraint to include file-related notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with file-related notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('task_assigned', 'deadline_reminder', 'status_update', 'milestone_complete', 'project_update', 'file_shared', 'PROJECT_UPDATED'));