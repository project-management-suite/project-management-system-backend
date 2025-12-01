| object_type                     | definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table: analytics_snapshots      | CREATE TABLE analytics_snapshots (
  snapshot_id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_type CHARACTER VARYING NOT NULL,
  entity_id UUID,
  metrics JSONB NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                              |
| Table: deadline_reminders       | CREATE TABLE deadline_reminders (
  reminder_id UUID NOT NULL DEFAULT gen_random_uuid(),
  task_id UUID,
  user_id UUID,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type CHARACTER VARYING DEFAULT 'email'::character varying,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                         |
| Table: email_otps               | CREATE TABLE email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  type CHARACTER VARYING NOT NULL DEFAULT 'REGISTRATION'::character varying
);                                                                                                                                                                                                                                                                                                          |
| Table: file_shares              | CREATE TABLE file_shares (
  share_id UUID NOT NULL DEFAULT gen_random_uuid(),
  file_id UUID,
  shared_with_user_id UUID,
  shared_by_user_id UUID,
  permission_level CHARACTER VARYING DEFAULT 'read'::character varying,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                             |
| Table: files                    | CREATE TABLE files (
  file_id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  task_id UUID,
  uploaded_by_user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path_in_storage TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                        |
| Table: holidays                 | CREATE TABLE holidays (
  holiday_id UUID NOT NULL DEFAULT gen_random_uuid(),
  holiday_name CHARACTER VARYING NOT NULL,
  holiday_date DATE NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                     |
| Table: milestone_tasks          | CREATE TABLE milestone_tasks (
  milestone_id UUID NOT NULL,
  task_id UUID NOT NULL
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Table: milestones               | CREATE TABLE milestones (
  milestone_id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID,
  milestone_name CHARACTER VARYING NOT NULL,
  description TEXT,
  due_date DATE,
  status CHARACTER VARYING DEFAULT 'PENDING'::character varying,
  completion_date TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                    |
| Table: notification_preferences | CREATE TABLE notification_preferences (
  user_id UUID NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  task_assignments BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  status_updates BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  milestone_updates BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                 |
| Table: notifications            | CREATE TABLE notifications (
  notification_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  title CHARACTER VARYING NOT NULL,
  message TEXT NOT NULL,
  type CHARACTER VARYING NOT NULL,
  related_entity_type CHARACTER VARYING,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                         |
| Table: pending_registrations    | CREATE TABLE pending_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Table: profile_photos           | CREATE TABLE profile_photos (
  photo_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  file_name CHARACTER VARYING NOT NULL,
  file_path CHARACTER VARYING NOT NULL,
  file_url CHARACTER VARYING NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type CHARACTER VARYING NOT NULL,
  is_current BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                      |
| Table: profiles                 | CREATE TABLE profiles (
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_verified BOOLEAN DEFAULT false,
  profile_photo_url CHARACTER VARYING,
  profile_photo_path CHARACTER VARYING,
  profile_photo_uploaded_at TIMESTAMP WITH TIME ZONE
);                                                                                                                                                                                                                               |
| Table: projects                 | CREATE TABLE projects (
  project_id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  description TEXT,
  owner_manager_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                  |
| Table: reports                  | CREATE TABLE reports (
  report_id UUID NOT NULL DEFAULT gen_random_uuid(),
  report_name CHARACTER VARYING NOT NULL,
  report_type CHARACTER VARYING NOT NULL,
  project_id UUID,
  generated_by UUID,
  report_data JSONB NOT NULL,
  date_from DATE,
  date_to DATE,
  file_path CHARACTER VARYING,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                |
| Table: subtask_assignments      | CREATE TABLE subtask_assignments (
  assignment_id UUID NOT NULL DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL,
  assignee_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                                                      |
| Table: subtasks                 | CREATE TABLE subtasks (
  subtask_id UUID NOT NULL DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL,
  title CHARACTER VARYING NOT NULL,
  description TEXT,
  status CHARACTER VARYING NOT NULL DEFAULT 'PENDING'::character varying,
  priority CHARACTER VARYING DEFAULT 'MEDIUM'::character varying,
  estimated_hours NUMERIC DEFAULT NULL::numeric,
  actual_hours NUMERIC DEFAULT 0,
  estimated_by UUID,
  estimated_at TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
); |
| Table: task_assignments         | CREATE TABLE task_assignments (
  assignment_id UUID NOT NULL DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  developer_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Table: task_estimates           | CREATE TABLE task_estimates (
  estimate_id UUID NOT NULL DEFAULT gen_random_uuid(),
  task_id UUID,
  subtask_id UUID,
  estimated_hours NUMERIC NOT NULL,
  estimator_id UUID NOT NULL,
  estimate_type CHARACTER VARYING DEFAULT 'INITIAL'::character varying,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  complexity CHARACTER VARYING DEFAULT 'MEDIUM'::character varying,
  confidence_level INTEGER DEFAULT 3,
  actual_hours NUMERIC DEFAULT NULL::numeric
);                                                                                                                                                 |
| Table: tasks                    | CREATE TABLE tasks (
  task_id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'NEW'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estimated_hours NUMERIC DEFAULT NULL::numeric,
  actual_hours NUMERIC DEFAULT 0,
  estimated_by UUID,
  estimated_at TIMESTAMP WITH TIME ZONE
);                                                                                                                                                    |
| Table: team_members             | CREATE TABLE team_members (
  team_member_id UUID NOT NULL DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role_in_team CHARACTER VARYING DEFAULT 'DEVELOPER'::character varying,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  is_active BOOLEAN DEFAULT true
);                                                                                                                                                                                                                                                                                                       |
| Table: team_projects            | CREATE TABLE team_projects (
  team_project_id UUID NOT NULL DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  project_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  is_active BOOLEAN DEFAULT true
);                                                                                                                                                                                                                                                                                                                                                                         |
| Table: teams                    | CREATE TABLE teams (
  team_id UUID NOT NULL DEFAULT gen_random_uuid(),
  team_name CHARACTER VARYING NOT NULL,
  description TEXT,
  manager_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);                                                                                                                                                                                                                                                                  |
| Table: work_logs                | CREATE TABLE work_logs (
  log_id UUID NOT NULL DEFAULT gen_random_uuid(),
  task_id UUID,
  subtask_id UUID,
  user_id UUID NOT NULL,
  hours_logged NUMERIC NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  log_type CHARACTER VARYING DEFAULT 'DEVELOPMENT'::character varying,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);                                                                                                                                                                                                                 |