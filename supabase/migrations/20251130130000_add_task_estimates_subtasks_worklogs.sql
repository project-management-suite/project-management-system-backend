-- Add task estimates, subtasks, and work logging functionality
-- Migration: 20251130130000_add_task_estimates_subtasks_worklogs.sql

-- 1. Add estimate columns to existing tasks table
ALTER TABLE tasks 
ADD COLUMN estimated_hours DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN actual_hours DECIMAL(8,2) DEFAULT 0,
ADD COLUMN estimated_by uuid REFERENCES profiles(user_id),
ADD COLUMN estimated_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    subtask_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id uuid NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    estimated_hours DECIMAL(8,2) DEFAULT NULL,
    actual_hours DECIMAL(8,2) DEFAULT 0,
    estimated_by uuid REFERENCES profiles(user_id),
    estimated_at TIMESTAMPTZ DEFAULT NULL,
    start_date DATE,
    end_date DATE,
    created_by uuid NOT NULL REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create subtask assignments table
CREATE TABLE IF NOT EXISTS subtask_assignments (
    assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subtask_id uuid NOT NULL REFERENCES subtasks(subtask_id) ON DELETE CASCADE,
    assignee_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL REFERENCES profiles(user_id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(subtask_id, assignee_id)
);

-- 4. Create work logs table for both tasks and subtasks
CREATE TABLE IF NOT EXISTS work_logs (
    log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid REFERENCES tasks(task_id) ON DELETE CASCADE,
    subtask_id uuid REFERENCES subtasks(subtask_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    hours_logged DECIMAL(8,2) NOT NULL CHECK (hours_logged > 0),
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    log_type VARCHAR(20) DEFAULT 'DEVELOPMENT' CHECK (log_type IN ('DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: either task_id or subtask_id must be provided, but not both
    CHECK ((task_id IS NOT NULL AND subtask_id IS NULL) OR (task_id IS NULL AND subtask_id IS NOT NULL))
);

-- 5. Create task estimates table for tracking estimate history
CREATE TABLE IF NOT EXISTS task_estimates (
    estimate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid REFERENCES tasks(task_id) ON DELETE CASCADE,
    subtask_id uuid REFERENCES subtasks(subtask_id) ON DELETE CASCADE,
    estimated_hours DECIMAL(8,2) NOT NULL CHECK (estimated_hours > 0),
    estimator_id uuid NOT NULL REFERENCES profiles(user_id),
    estimate_type VARCHAR(20) DEFAULT 'INITIAL' CHECK (estimate_type IN ('INITIAL', 'REVISED', 'FINAL')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: either task_id or subtask_id must be provided, but not both
    CHECK ((task_id IS NOT NULL AND subtask_id IS NULL) OR (task_id IS NULL AND subtask_id IS NOT NULL))
);

-- 6. Add indexes for better performance
CREATE INDEX idx_subtasks_parent_task ON subtasks(parent_task_id);
CREATE INDEX idx_subtasks_status ON subtasks(status);
CREATE INDEX idx_subtasks_assignee ON subtask_assignments(assignee_id);
CREATE INDEX idx_work_logs_task ON work_logs(task_id);
CREATE INDEX idx_work_logs_subtask ON work_logs(subtask_id);
CREATE INDEX idx_work_logs_user ON work_logs(user_id);
CREATE INDEX idx_work_logs_date ON work_logs(work_date);
CREATE INDEX idx_task_estimates_task ON task_estimates(task_id);
CREATE INDEX idx_task_estimates_subtask ON task_estimates(subtask_id);

-- 7. Enable RLS on all new tables
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtask_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_estimates ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for subtasks
-- Subtasks can be read by project members, managers, and admins
CREATE POLICY "Project members can read subtasks"
    ON subtasks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
            WHERE t.task_id = subtasks.parent_task_id
            AND (
                p.owner_manager_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.task_id AND ta.developer_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
                )
                OR EXISTS (
                    SELECT 1 FROM team_projects tp
                    JOIN team_members tm ON tp.team_id = tm.team_id
                    WHERE tp.project_id = p.project_id
                    AND tm.user_id = auth.uid()
                    AND tm.is_active = true
                    AND tp.is_active = true
                )
            )
        )
    );

-- Subtasks can be created by managers and admins
CREATE POLICY "Managers and admins can create subtasks"
    ON subtasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Subtasks can be updated by managers, admins, and assigned developers
CREATE POLICY "Authorized users can update subtasks"
    ON subtasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
        OR EXISTS (
            SELECT 1 FROM subtask_assignments sa
            WHERE sa.subtask_id = subtasks.subtask_id AND sa.assignee_id = auth.uid()
        )
    );

-- Subtasks can be deleted by managers and admins
CREATE POLICY "Managers and admins can delete subtasks"
    ON subtasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- 9. Create RLS policies for subtask assignments
CREATE POLICY "Project members can read subtask assignments"
    ON subtask_assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM subtasks s
            JOIN tasks t ON s.parent_task_id = t.task_id
            JOIN projects p ON t.project_id = p.project_id
            WHERE s.subtask_id = subtask_assignments.subtask_id
            AND (
                p.owner_manager_id = auth.uid()
                OR assignee_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
                )
            )
        )
    );

CREATE POLICY "Managers and admins can manage subtask assignments"
    ON subtask_assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- 10. Create RLS policies for work logs
CREATE POLICY "Users can read own work logs and managers can read project work logs"
    ON work_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
        OR (
            task_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM tasks t
                JOIN projects p ON t.project_id = p.project_id
                WHERE t.task_id = work_logs.task_id
                AND p.owner_manager_id = auth.uid()
            )
        )
        OR (
            subtask_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM subtasks s
                JOIN tasks t ON s.parent_task_id = t.task_id
                JOIN projects p ON t.project_id = p.project_id
                WHERE s.subtask_id = work_logs.subtask_id
                AND p.owner_manager_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create work logs for assigned tasks"
    ON work_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND (
            (task_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM task_assignments ta
                WHERE ta.task_id = work_logs.task_id AND ta.developer_id = auth.uid()
            ))
            OR (subtask_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM subtask_assignments sa
                WHERE sa.subtask_id = work_logs.subtask_id AND sa.assignee_id = auth.uid()
            ))
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
            )
        )
    );

CREATE POLICY "Users can update own work logs"
    ON work_logs
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "Users can delete own work logs"
    ON work_logs
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- 11. Create RLS policies for task estimates
CREATE POLICY "Project members can read task estimates"
    ON task_estimates
    FOR SELECT
    TO authenticated
    USING (
        (task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
            WHERE t.task_id = task_estimates.task_id
            AND (
                p.owner_manager_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = t.task_id AND ta.developer_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
                )
            )
        ))
        OR (subtask_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM subtasks s
            JOIN tasks t ON s.parent_task_id = t.task_id
            JOIN projects p ON t.project_id = p.project_id
            WHERE s.subtask_id = task_estimates.subtask_id
            AND (
                p.owner_manager_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM subtask_assignments sa
                    WHERE sa.subtask_id = s.subtask_id AND sa.assignee_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
                )
            )
        ))
    );

CREATE POLICY "Authorized users can create task estimates"
    ON task_estimates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        estimator_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'DEVELOPER')
            )
        )
    );

-- 12. Create functions to update actual hours automatically
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- Update task actual hours from work logs
    IF NEW.task_id IS NOT NULL THEN
        UPDATE tasks 
        SET actual_hours = (
            SELECT COALESCE(SUM(hours_logged), 0)
            FROM work_logs 
            WHERE task_id = NEW.task_id
        )
        WHERE task_id = NEW.task_id;
    END IF;
    
    -- Update subtask actual hours from work logs
    IF NEW.subtask_id IS NOT NULL THEN
        UPDATE subtasks 
        SET actual_hours = (
            SELECT COALESCE(SUM(hours_logged), 0)
            FROM work_logs 
            WHERE subtask_id = NEW.subtask_id
        )
        WHERE subtask_id = NEW.subtask_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers to update actual hours
CREATE TRIGGER update_task_hours_trigger
    AFTER INSERT OR UPDATE OR DELETE ON work_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_task_actual_hours();

-- 14. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create triggers for updated_at
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON work_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Insert some sample data for testing
-- Sample subtasks (only if parent tasks exist)
DO $$
DECLARE
    sample_user_id uuid;
    sample_task_id uuid;
BEGIN
    -- Get a sample user ID (preferably a manager)
    SELECT user_id INTO sample_user_id 
    FROM profiles 
    WHERE role IN ('MANAGER', 'ADMIN') 
    LIMIT 1;
    
    -- Get a sample task ID
    SELECT task_id INTO sample_task_id 
    FROM tasks 
    LIMIT 1;
    
    -- Check if we have both user and task, then create sample subtasks
    IF sample_user_id IS NOT NULL AND sample_task_id IS NOT NULL THEN
        INSERT INTO subtasks (parent_task_id, title, description, status, priority, estimated_hours, created_by)
        VALUES 
            (sample_task_id, 'Setup Database Schema', 'Create database tables and relationships', 'COMPLETED', 'HIGH', 8.0, sample_user_id),
            (sample_task_id, 'Implement Authentication', 'Add user authentication and authorization', 'IN_PROGRESS', 'HIGH', 12.0, sample_user_id),
            (sample_task_id, 'Write Unit Tests', 'Create comprehensive test coverage', 'PENDING', 'MEDIUM', 6.0, sample_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 17. Add comments for documentation
COMMENT ON TABLE subtasks IS 'Subtasks that belong to parent tasks';
COMMENT ON TABLE subtask_assignments IS 'Assignment of users to subtasks';
COMMENT ON TABLE work_logs IS 'Time tracking for tasks and subtasks';
COMMENT ON TABLE task_estimates IS 'Estimation history for tasks and subtasks';

COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated hours to complete the task';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual hours logged for the task (calculated)';
COMMENT ON COLUMN tasks.estimated_by IS 'User who provided the estimate';
COMMENT ON COLUMN tasks.estimated_at IS 'When the estimate was provided';

COMMENT ON COLUMN work_logs.log_type IS 'Type of work performed (DEVELOPMENT, TESTING, etc.)';
COMMENT ON COLUMN work_logs.work_date IS 'Date when the work was performed';
COMMENT ON COLUMN work_logs.hours_logged IS 'Number of hours logged for this work session';