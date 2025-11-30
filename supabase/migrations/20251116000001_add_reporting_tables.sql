-- Migration: Add Reporting and Analytics Tables
-- Created: 2024-11-16
-- Description: Add tables for reports, analytics, holidays, reminders, and milestones

-- Reports table for storing generated reports
CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom', 'project')),
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
    generated_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    report_data JSONB NOT NULL,
    date_from DATE,
    date_to DATE,
    file_path VARCHAR(500), -- Path to generated PDF/Excel
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (date_from IS NULL OR date_to IS NULL OR date_from <= date_to)
);

-- Analytics snapshots for tracking metrics over time
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'user', 'system')),
    entity_id UUID, -- project_id or user_id (nullable for system-wide)
    metrics JSONB NOT NULL,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique snapshots per entity per date
    UNIQUE(entity_type, entity_id, snapshot_date)
);

-- Company holidays table
CREATE TABLE IF NOT EXISTS holidays (
    holiday_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL UNIQUE,
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE, -- For annual holidays
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deadline reminders
CREATE TABLE IF NOT EXISTS deadline_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    reminder_date TIMESTAMPTZ NOT NULL,
    reminder_type VARCHAR(50) DEFAULT 'email' CHECK (reminder_type IN ('email', 'notification', 'both')),
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reminders
    UNIQUE(task_id, user_id, reminder_date)
);

-- Enhanced milestones table (extending existing if needed)
CREATE TABLE IF NOT EXISTS milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    completion_date TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone tasks mapping
CREATE TABLE IF NOT EXISTS milestone_tasks (
    milestone_id UUID REFERENCES milestones(milestone_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(task_id) ON DELETE CASCADE,
    PRIMARY KEY (milestone_id, task_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task_assigned', 'deadline_reminder', 'status_update', 'milestone_complete', 'project_update')),
    related_entity_type VARCHAR(50) CHECK (related_entity_type IN ('task', 'project', 'milestone')),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    task_assignments BOOLEAN DEFAULT TRUE,
    deadline_reminders BOOLEAN DEFAULT TRUE,
    status_updates BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    milestone_updates BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File sharing (enhance existing file management)
CREATE TABLE IF NOT EXISTS file_shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(file_id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    permission_level VARCHAR(50) DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate shares
    UNIQUE(file_id, shared_with_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_type_date ON reports(report_type, generated_at);

CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_snapshots(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);

CREATE INDEX IF NOT EXISTS idx_reminders_task ON deadline_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON deadline_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON deadline_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON deadline_reminders(sent) WHERE sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_user ON file_shares(shared_with_user_id);

-- Functions for automatic milestone progress calculation
CREATE OR REPLACE FUNCTION calculate_milestone_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update milestone progress based on completed tasks
    UPDATE milestones SET 
        progress_percentage = (
            SELECT COALESCE(
                ROUND(
                    (COUNT(*) FILTER (WHERE t.status = 'COMPLETED') * 100.0) / 
                    NULLIF(COUNT(*), 0)
                ), 0
            )
            FROM milestone_tasks mt
            JOIN tasks t ON mt.task_id = t.task_id
            WHERE mt.milestone_id = milestones.milestone_id
        ),
        updated_at = NOW()
    WHERE milestone_id IN (
        SELECT mt.milestone_id 
        FROM milestone_tasks mt 
        WHERE mt.task_id = COALESCE(NEW.task_id, OLD.task_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate milestone progress when tasks change
DROP TRIGGER IF EXISTS trigger_milestone_progress ON tasks;
CREATE TRIGGER trigger_milestone_progress
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_milestone_progress();

-- Function to auto-mark overdue milestones
CREATE OR REPLACE FUNCTION mark_overdue_milestones()
RETURNS void AS $$
BEGIN
    UPDATE milestones 
    SET status = 'OVERDUE', updated_at = NOW()
    WHERE due_date < CURRENT_DATE 
    AND status IN ('PENDING', 'IN_PROGRESS');
END;
$$ LANGUAGE plpgsql;

-- Function to create system notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50),
    p_related_entity_type VARCHAR(50) DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_related_entity_type, p_related_entity_id)
    RETURNING notifications.notification_id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notifications when tasks are assigned
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for assigned developer
    PERFORM create_notification(
        NEW.developer_id,
        'New Task Assigned',
        'You have been assigned a new task: ' || (SELECT title FROM tasks WHERE task_id = NEW.task_id),
        'task_assigned',
        'task',
        NEW.task_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_assignment_notification ON task_assignments;
CREATE TRIGGER trigger_task_assignment_notification
    AFTER INSERT ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_assignment();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT user_id FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Insert some default holidays (can be customized per organization)
INSERT INTO holidays (holiday_name, holiday_date, description, is_recurring) VALUES
('New Year''s Day', '2024-01-01', 'New Year celebration', true),
('Independence Day', '2024-07-04', 'US Independence Day', true),
('Christmas Day', '2024-12-25', 'Christmas celebration', true)
ON CONFLICT (holiday_date) DO NOTHING;

COMMENT ON TABLE reports IS 'Stores generated reports with metadata and file paths';
COMMENT ON TABLE analytics_snapshots IS 'Historical analytics data for trending and insights';
COMMENT ON TABLE holidays IS 'Company holidays and important dates';
COMMENT ON TABLE deadline_reminders IS 'Scheduled reminders for task deadlines';
COMMENT ON TABLE milestones IS 'Project milestones with progress tracking';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User notification settings and preferences';