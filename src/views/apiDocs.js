// Simple API Documentation HTML template
const apiDocsHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Management API Documentation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: #2d3748;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .endpoint {
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .method {
      padding: 10px 15px;
      font-weight: bold;
      color: white;
    }
    .get { background: #38a169; }
    .post { background: #3182ce; }
    .put { background: #d69e2e; }
    .delete { background: #e53e3e; }
    .endpoint-info {
      padding: 15px;
      background: #f7fafc;
    }
    .description {
      margin: 10px 0;
      color: #4a5568;
    }
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .back-btn {
      display: inline-block;
      margin: 20px;
      padding: 10px 20px;
      background: #3182ce;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background 0.3s;
    }
    .back-btn:hover {
      background: #2c5282;
    }
  </style>
</head>
<body>
  <a href="/" class="back-btn">← Back to Home</a>
  
  <div class="container">
    <div class="header">
      <h1>🚀 Project Management System API</h1>
      <p>Complete API Documentation - 118 Endpoints</p>
      <p style="margin: 10px 0; opacity: 0.9;">Authentication • Projects • Tasks • Subtasks • Work Logs • Estimates • Teams • Reports • Files • Calendar • Profiles • Admin</p>
      <div style="margin: 15px 0;">
        <a href="/api/swagger" style="color: #90cdf4; text-decoration: none; margin: 0 10px;">📚 Interactive Swagger UI</a>
        <a href="/api/docs/swagger.json" style="color: #90cdf4; text-decoration: none; margin: 0 10px;">📄 OpenAPI JSON</a>
      </div>
    </div>
    
    <div class="content">
      <h2>🔐 Authentication Endpoints (8)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/register</div>
        <div class="endpoint-info">
          <div class="description">Register a new user (sends OTP to email)</div>
          <pre>{
  "username": "test_developer",
  "email": "testdeveloper@testapp.com",
  "password": "testpass123",
  "role": "DEVELOPER"
}</pre>
          <div class="description"><strong>Response:</strong> OTP sent to email for verification</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "testdeveloper@testapp.com",
  "tempUserId": "temp-uuid-123"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/verify-otp</div>
        <div class="endpoint-info">
          <div class="description">Verify OTP and complete registration</div>
          <pre>{
  "email": "testdeveloper@testapp.com",
  "otp": "123456"
}</pre>
          <div class="description"><strong>Response:</strong> JWT token and user data</div>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Email verified and account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-456",
    "username": "test_developer",
    "email": "testdeveloper@testapp.com",
    "role": "DEVELOPER",
    "email_verified": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/resend-otp</div>
        <div class="endpoint-info">
          <div class="description">Resend OTP to email</div>
          <pre>{
  "email": "testadmin@testapp.com"
}</pre>
          <div class="description"><strong>Response:</strong> New OTP sent to email</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "New OTP sent to your email",
  "email": "testadmin@testapp.com",
  "expires_in": "10 minutes"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/login</div>
        <div class="endpoint-info">
          <div class="description">Login user (requires verified email)</div>
          <pre>{
  "email": "testmanager@testapp.com",
  "password": "testpass123"
}</pre>
          <div class="description"><strong>Response:</strong> JWT token and user profile</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-456",
    "username": "test_manager",
    "email": "testmanager@testapp.com",
    "role": "MANAGER",
    "email_verified": true
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/auth/test/last-otp</div>
        <div class="endpoint-info">
          <div class="description">Get last generated OTP (Development/Test only)</div>
          <div class="description"><strong>Query:</strong> ?email=testdeveloper@testapp.com</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "email": "testdeveloper@testapp.com",
  "last_otp": "123456",
  "generated_at": "2025-12-01T14:25:00Z",
  "expires_at": "2025-12-01T14:35:00Z",
  "is_valid": true
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/forgot-password</div>
        <div class="endpoint-info">
          <div class="description">Request password reset (sends OTP to email)</div>
          <pre>{
  "email": "testmanager@testapp.com"
}</pre>
          <div class="description"><strong>Response:</strong> Password reset OTP sent to email</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Password reset OTP sent to your email",
  "email": "testmanager@testapp.com",
  "expires_in": "10 minutes"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/verify-reset-otp</div>
        <div class="endpoint-info">
          <div class="description">Verify password reset OTP (returns reset token)</div>
          <pre>{
  "email": "testmanager@testapp.com",
  "otp": "654321"
}</pre>
          <div class="description"><strong>Response:</strong> Temporary reset token for password change</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Reset OTP verified successfully",
  "resetToken": "reset-jwt-token-here...",
  "expires_in": "15 minutes"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/reset-password</div>
        <div class="endpoint-info">
          <div class="description">Reset password using reset token</div>
          <pre>{
  "resetToken": "reset-jwt-token-here...",
  "newPassword": "newSecurePassword123"
}</pre>
          <div class="description"><strong>Response:</strong> Password successfully reset with new login token</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Password reset successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-456",
    "username": "test_manager", 
    "email": "testmanager@testapp.com",
    "role": "MANAGER"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/change-password</div>
        <div class="endpoint-info">
          <div class="description">Change password (authenticated users only)</div>
          <div class="description"><strong>Auth Required:</strong> Bearer token</div>
          <pre>{
  "currentPassword": "testpass123",
  "newPassword": "newSecurePassword456"
}</pre>
          <div class="description"><strong>Response:</strong> Password changed successfully</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Password changed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-456", 
    "username": "test_manager",
    "email": "testmanager@testapp.com",
    "role": "MANAGER"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/logout</div>
        <div class="endpoint-info">
          <div class="description">Logout current user (invalidates session)</div>
          <div class="description"><strong>Auth Required:</strong> Bearer token</div>
          <div class="description"><strong>Response:</strong> Session terminated</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Logout successful"
}</pre>
        </div>
      </div>
      
      <h2>📊 Project Endpoints (8)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects</div>
        <div class="endpoint-info">
          <div class="description">Get all projects for the current user</div>
          <div class="description"><strong>Response:</strong> List of projects with basic info</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "projects": [
    {
      "id": "proj-uuid-123",
      "project_name": "Test Project API",
      "description": "A test project created by automated API testing script",
      "status": "IN_PROGRESS",
      "start_date": "2025-12-01",
      "end_date": "2025-12-31",
      "created_by": "manager-uuid-789",
      "task_count": 1,
      "completed_tasks": 0,
      "team_members": 3
    }
  ]
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects/dashboard</div>
        <div class="endpoint-info">
          <div class="description">Get dashboard metrics for projects</div>
          <div class="description"><strong>Response:</strong> Statistics and overview data</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "dashboard": {
    "total_projects": 12,
    "active_projects": 8,
    "completed_projects": 4,
    "total_tasks": 156,
    "completed_tasks": 89,
    "overdue_tasks": 7,
    "team_productivity": {
      "this_week": 85.2,
      "this_month": 78.5
    }
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects/developers</div>
        <div class="endpoint-info">
          <div class="description">Get all developers (for managers to assign tasks)</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "developers": [
    {
      "id": "dev-uuid-123",
      "username": "test_developer",
      "email": "testdeveloper@testapp.com",
      "role": "DEVELOPER",
      "active_tasks": 3,
      "total_hours_logged": 45.5,
      "availability": "AVAILABLE",
      "skills": ["JavaScript", "React", "Node.js"]
    }
  ],
  "total_count": 1
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/projects</div>
        <div class="endpoint-info">
          <div class="description">Create a new project</div>
          <pre>{
  "project_name": "Test Project API",
  "description": "A test project created by automated API testing script",
  "start_date": "2025-12-01",
  "end_date": "2025-12-31"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "project_id": "proj-uuid-123",
    "project_name": "Test Project API",
    "description": "A test project created by automated API testing script",
    "status": "IN_PROGRESS",
    "start_date": "2025-12-01",
    "end_date": "2025-12-31",
    "created_by": "manager-uuid-456",
    "created_at": "2025-12-01T09:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get project details by ID</div>
          <div class="description"><strong>Response:</strong> Full project information with tasks</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "project": {
    "id": "proj-uuid-123",
    "project_name": "E-commerce Platform",
    "description": "Complete online shopping platform",
    "status": "IN_PROGRESS",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "created_by": "manager-uuid-789",
    "tasks": [
      {
        "id": "task-uuid-456",
        "title": "User Authentication",
        "status": "DONE",
        "assigned_to": "dev-uuid-123",
        "priority": "HIGH"
      }
    ],
    "team_members": ["dev-1", "dev-2", "dev-3"]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Update project information</div>
          <pre>{
  "project_name": "Updated Test Project API",
  "description": "Updated description for test project",
  "status": "COMPLETED",
  "end_date": "2025-12-15"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Project updated successfully",
  "project": {
    "project_id": "proj-uuid-123",
    "project_name": "Updated Test Project API",
    "description": "Updated description for test project",
    "status": "COMPLETED",
    "end_date": "2025-12-15",
    "updated_at": "2025-12-01T15:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Delete project and all associated data</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Project and all associated data deleted successfully",
  "deleted": {
    "project_id": "proj-uuid-123",
    "tasks_deleted": 5,
    "subtasks_deleted": 12,
    "files_deleted": 3,
    "work_logs_deleted": 28
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/projects/{projectId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign team members to project</div>
          <pre>{
  "userIds": ["dev-uuid-123", "dev-uuid-456"]
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Team members assigned to project successfully",
  "assigned": [
    {
      "user_id": "dev-uuid-123",
      "username": "test_developer",
      "role": "DEVELOPER"
    },
    {
      "user_id": "dev-uuid-456",
      "username": "john_dev",
      "role": "DEVELOPER"
    }
  ],
  "project_id": "proj-uuid-123",
  "total_members": 3
}</pre>
        </div>
      </div>
      
      <h2>📋 Task Endpoints (11)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks</div>
        <div class="endpoint-info">
          <div class="description">Get tasks for the current user</div>
          <div class="description"><strong>Response:</strong> List of assigned tasks</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid-456",
      "title": "Test Task API",
      "description": "A test task created by automated API testing script",
      "project_id": "proj-uuid-123",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "due_date": "2025-12-15T23:59:59Z",
      "estimated_hours": 8,
      "actual_hours": 2.5,
      "assigned_to": "dev-uuid-123",
      "subtask_count": 1,
      "completion_percentage": 30
    }
  ]
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get all tasks for a specific project</div>
          <div class="description"><strong>Response:</strong> List of project tasks with details</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid-789",
      "title": "Database Design",
      "status": "DONE",
      "priority": "HIGH",
      "estimated_hours": 12,
      "actual_hours": 10.5,
      "assigned_to": {
        "id": "dev-uuid-456",
        "username": "jane_doe",
        "email": "jane@example.com"
      },
      "progress": 100
    }
  ],
  "total_count": 25,
  "completed_count": 15
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Create a new task in a project</div>
          <pre>{
  "title": "Test Task API",
  "description": "A test task created by automated API testing script",
  "priority": "HIGH",
  "start_date": "2025-12-01",
  "end_date": "2025-12-15",
  "status": "TODO"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "task_id": "task-uuid-123",
    "title": "Test Task API",
    "description": "A test task created by automated API testing script",
    "project_id": "proj-uuid-456",
    "status": "TODO",
    "priority": "HIGH",
    "start_date": "2025-12-01",
    "end_date": "2025-12-15",
    "created_by": "manager-uuid-789",
    "created_at": "2025-12-01T10:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get task details by ID</div>
          <div class="description"><strong>Response:</strong> Full task information with subtasks</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "task": {
    "id": "task-uuid-123",
    "title": "User Authentication System",
    "description": "Implement complete user auth with JWT",
    "project_id": "proj-uuid-456",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "start_date": "2025-12-01",
    "end_date": "2025-12-15",
    "estimated_hours": 16,
    "actual_hours": 8.5,
    "assigned_to": {
      "id": "dev-uuid-123",
      "username": "test_developer",
      "email": "testdeveloper@testapp.com"
    },
    "subtasks": [
      {
        "id": "subtask-uuid-789",
        "title": "Login API",
        "status": "DONE"
      }
    ],
    "completion_percentage": 65
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method patch">PATCH /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Update task information</div>
          <pre>{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "actual_hours": 12.5,
  "completion_percentage": 75
}</pre>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Task updated successfully",
  "task": {
    "id": "task-uuid-123",
    "title": "Updated Test Task API",
    "status": "IN_PROGRESS",
    "priority": "URGENT",
    "actual_hours": 12.5,
    "completion_percentage": 75,
    "updated_at": "2025-12-01T16:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Delete task and all related data</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Task and all related data deleted successfully",
  "deleted": {
    "task_id": "task-uuid-123",
    "subtasks_deleted": 3,
    "work_logs_deleted": 12,
    "estimates_deleted": 2,
    "files_deleted": 1
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/{taskId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign developer to task</div>
          <pre>{
  "developer_id": "dev-uuid-123"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Developer assigned to task successfully",
  "assignment": {
    "task_id": "task-uuid-123",
    "developer_id": "dev-uuid-123",
    "developer_name": "test_developer",
    "assigned_at": "2025-12-01T11:00:00Z",
    "assigned_by": "manager-uuid-456"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/{taskId}/unassign/{developerId}</div>
        <div class="endpoint-info">
          <div class="description">Unassign developer from task</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Developer unassigned from task successfully",
  "unassignment": {
    "task_id": "task-uuid-123",
    "developer_id": "dev-uuid-123",
    "unassigned_at": "2025-12-01T12:00:00Z",
    "unassigned_by": "manager-uuid-456"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/project/{projectId}/bulk/create</div>
        <div class="endpoint-info">
          <div class="description">Create multiple tasks in bulk for a project</div>
          <div class="description"><strong>Auth Required:</strong> Any authenticated user (no limits on quantity)</div>
          <pre>{
  "tasks": [
    {
      "title": "Setup Development Environment",
      "description": "Install all required dependencies and tools",
      "start_date": "2025-12-01",
      "end_date": "2025-12-03"
    },
    {
      "title": "Design Database Schema", 
      "description": "Create ERD and define all database tables",
      "start_date": "2025-12-02",
      "end_date": "2025-12-06"
    },
    {
      "title": "Implement Authentication Module",
      "description": "Build user login, registration, and JWT handling",
      "start_date": "2025-12-03",
      "end_date": "2025-12-10"
    }
  ]
}</pre>
          <div class="description"><strong>Response:</strong> Detailed results of bulk creation</div>
          <pre><strong>Sample Response (201):</strong>
{
  "message": "Bulk task creation completed",
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "task": {
        "task_id": "task-uuid-001",
        "title": "Setup Development Environment",
        "status": "TODO",
        "project_id": "proj-uuid-123",
        "created_at": "2025-12-01T10:00:00Z"
      }
    }
  ],
  "errors": []
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/tasks/bulk/update</div>
        <div class="endpoint-info">
          <div class="description">Update multiple tasks in bulk</div>
          <div class="description"><strong>Auth Required:</strong> Any authenticated user (no limits on quantity)</div>
          <pre>{
  "updates": [
    {
      "task_id": "task-uuid-001",
      "status": "IN_PROGRESS",
      "description": "Updated: Development environment setup in progress"
    },
    {
      "task_id": "task-uuid-002",
      "status": "IN_PROGRESS", 
      "description": "Updated: Database design started"
    }
  ]
}</pre>
          <div class="description"><strong>Response:</strong> Detailed results of bulk update</div>
          <pre><strong>Sample Response (200):</strong>
{
  "message": "Bulk task update completed",
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "task_id": "task-uuid-001",
      "success": true,
      "task": {
        "task_id": "task-uuid-001",
        "title": "Setup Development Environment",
        "status": "IN_PROGRESS",
        "updated_at": "2025-12-01T11:00:00Z"
      }
    }
  ],
  "errors": []
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/bulk/delete</div>
        <div class="endpoint-info">
          <div class="description">Delete multiple tasks in bulk</div>
          <div class="description"><strong>Auth Required:</strong> Any authenticated user (no limits on quantity)</div>
          <pre>{
  "task_ids": [
    "task-uuid-001",
    "task-uuid-002", 
    "task-uuid-003"
  ]
}</pre>
          <div class="description"><strong>Response:</strong> Detailed results of bulk deletion</div>
          <pre><strong>Sample Response (200):</strong>
{
  "message": "Bulk task deletion completed", 
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "task_id": "task-uuid-001",
      "success": true
    },
    {
      "index": 1, 
      "task_id": "task-uuid-002",
      "success": true
    },
    {
      "index": 2,
      "task_id": "task-uuid-003", 
      "success": true
    }
  ],
  "errors": []
}</pre>
        </div>
      </div>
      
      <h2>📝 Subtask Endpoints (11)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks</div>
        <div class="endpoint-info">
          <div class="description">Create a new subtask</div>
          <pre>{
  "title": "Test Subtask API",
  "description": "A test subtask created by automated API testing script",
  "task_id": "task-uuid-123",
  "priority": "MEDIUM",
  "estimated_hours": 4.5,
  "start_date": "2025-12-02",
  "end_date": "2025-12-05"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Subtask created successfully",
  "subtask": {
    "id": "subtask-uuid-789",
    "title": "Test Subtask API",
    "description": "A test subtask created by automated API testing script",
    "task_id": "task-uuid-123",
    "status": "TODO",
    "priority": "MEDIUM",
    "estimated_hours": 4.5,
    "created_by": "manager-uuid-456",
    "created_at": "2025-12-01T14:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/my</div>
        <div class="endpoint-info">
          <div class="description">Get current user's assigned subtasks</div>
          <div class="description"><strong>Query params:</strong> ?status=TODO&priority=HIGH</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "subtasks": [
    {
      "id": "subtask-uuid-789",
      "title": "Create login form",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "task": {
        "id": "task-uuid-123",
        "title": "User Authentication System"
      },
      "estimated_hours": 4,
      "actual_hours": 2.5,
      "due_date": "2024-01-20T23:59:59Z"
    }
  ],
  "total_count": 8
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get subtasks for a specific task</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "subtasks": [
    {
      "id": "subtask-uuid-789",
      "title": "Test Subtask API",
      "description": "A test subtask created by automated API testing script",
      "task_id": "task-uuid-123",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "estimated_hours": 4.5,
      "actual_hours": 2.0,
      "assigned_to": {
        "id": "dev-uuid-123",
        "username": "test_developer"
      },
      "completion_percentage": 40
    }
  ],
  "total_count": 1
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get subtasks for a project with filters</div>
          <div class="description"><strong>Query params:</strong> ?status=TODO&priority=HIGH&assigned_to=dev-uuid-123</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "subtasks": [
    {
      "id": "subtask-uuid-789",
      "title": "Database Schema Design",
      "task": {
        "id": "task-uuid-123",
        "title": "Backend API Development"
      },
      "status": "TODO",
      "priority": "HIGH",
      "estimated_hours": 6,
      "assigned_to": "dev-uuid-123"
    }
  ],
  "total_count": 15,
  "filtered_count": 1
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Get subtask details by ID</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "subtask": {
    "id": "subtask-uuid-789",
    "title": "Test Subtask API",
    "description": "A test subtask created by automated API testing script",
    "task_id": "task-uuid-123",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "estimated_hours": 4.5,
    "actual_hours": 2.0,
    "start_date": "2025-12-02",
    "end_date": "2025-12-05",
    "assigned_to": {
      "id": "dev-uuid-123",
      "username": "test_developer",
      "email": "testdeveloper@testapp.com"
    },
    "work_logs": [
      {
        "date": "2025-12-02",
        "hours": 2.0,
        "description": "Initial setup"
      }
    ],
    "completion_percentage": 40
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Update subtask information</div>
          <pre>{
  "title": "Updated Test Subtask API",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "estimated_hours": 6.0,
  "completion_percentage": 60
}</pre>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Subtask updated successfully",
  "subtask": {
    "id": "subtask-uuid-789",
    "title": "Updated Test Subtask API",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "estimated_hours": 6.0,
    "completion_percentage": 60,
    "updated_at": "2025-12-01T17:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Delete subtask</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Subtask deleted successfully",
  "deleted": {
    "subtask_id": "subtask-uuid-789",
    "work_logs_deleted": 5,
    "estimates_deleted": 1
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign user to subtask</div>
          <pre>{
  "user_id": "dev-uuid-123"
}</pre>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "User assigned to subtask successfully",
  "assignment": {
    "subtask_id": "subtask-uuid-789",
    "user_id": "dev-uuid-123",
    "username": "test_developer",
    "assigned_at": "2025-12-01T13:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/unassign/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Unassign user from subtask</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "User unassigned from subtask successfully",
  "unassignment": {
    "subtask_id": "subtask-uuid-789",
    "user_id": "dev-uuid-123",
    "unassigned_at": "2025-12-01T14:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/estimate</div>
        <div class="endpoint-info">
          <div class="description">Add estimate to subtask</div>
          <pre>{
  "estimatedHours": 8.5,
  "notes": "Initial estimate for subtask completion",
  "estimateType": "INITIAL",
  "complexity": "MEDIUM",
  "confidence_level": 4
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Estimate added successfully",
  "estimate": {
    "id": "estimate-uuid-456",
    "subtask_id": "subtask-uuid-789",
    "estimated_hours": 8.5,
    "estimate_type": "INITIAL",
    "complexity": "MEDIUM",
    "confidence_level": 4,
    "notes": "Initial estimate for subtask completion",
    "created_by": "dev-uuid-123",
    "created_at": "2025-12-01T15:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/{subtaskId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get subtask statistics</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "stats": {
    "subtask_id": "subtask-uuid-789",
    "title": "Test Subtask API",
    "status": "IN_PROGRESS",
    "time_tracking": {
      "estimated_hours": 8.5,
      "actual_hours": 4.0,
      "remaining_hours": 4.5,
      "completion_percentage": 47
    },
    "work_logs": {
      "total_entries": 3,
      "total_hours": 4.0,
      "last_logged": "2025-12-02T16:30:00Z"
    },
    "estimates": {
      "total_estimates": 2,
      "accuracy": 85.5,
      "latest_estimate": 8.5
    },
    "performance": {
      "days_worked": 2,
      "average_hours_per_day": 2.0,
      "velocity": "Good"
    }
  }
}</pre>
        </div>
      </div>
      
      <h2>⏱️ Work Log Endpoints (12)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/worklogs</div>
        <div class="endpoint-info">
          <div class="description">Create a new work log entry</div>
          <pre>{
  "hours_logged": 2.5,
  "work_date": "2025-12-02",
  "task_id": "task-uuid-123",
  "description": "Initial implementation and testing of task functionality",
  "log_type": "DEVELOPMENT"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Work log created successfully",
  "worklog": {
    "id": "log-uuid-456",
    "user_id": "dev-uuid-123",
    "hours_logged": 2.5,
    "work_date": "2025-12-02",
    "task_id": "task-uuid-123",
    "description": "Initial implementation and testing of task functionality",
    "log_type": "DEVELOPMENT",
    "created_at": "2025-12-02T18:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/worklogs/bulk</div>
        <div class="endpoint-info">
          <div class="description">Create multiple work log entries</div>
          <pre>{
  "workLogs": [
    {
      "task_id": "task-uuid-123",
      "hours_logged": 1.5,
      "work_date": "2025-12-03",
      "description": "Code review and testing",
      "log_type": "REVIEW"
    },
    {
      "task_id": "task-uuid-123",
      "hours_logged": 2.0,
      "work_date": "2025-12-04",
      "description": "Bug fixes and documentation",
      "log_type": "BUG_FIX"
    }
  ]
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Bulk work logs created successfully",
  "created": [
    {
      "id": "log-uuid-789",
      "hours_logged": 1.5,
      "work_date": "2025-12-03",
      "log_type": "REVIEW"
    },
    {
      "id": "log-uuid-012",
      "hours_logged": 2.0,
      "work_date": "2025-12-04",
      "log_type": "BUG_FIX"
    }
  ],
  "total_created": 2,
  "total_hours": 3.5
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/my</div>
        <div class="endpoint-info">
          <div class="description">Get current user's work logs with filters</div>
          <div class="description"><strong>Query params:</strong> ?startDate=2025-12-01&endDate=2025-12-31&taskId=task-uuid-123&logType=DEVELOPMENT</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "worklogs": [
    {
      "id": "log-uuid-456",
      "hours_logged": 2.5,
      "work_date": "2025-12-02",
      "description": "Initial implementation and testing of task functionality",
      "log_type": "DEVELOPMENT",
      "task": {
        "id": "task-uuid-123",
        "title": "Test Task API"
      },
      "created_at": "2025-12-02T18:30:00Z"
    }
  ],
  "total_hours": 45.5,
  "total_entries": 18,
  "date_range": {
    "start_date": "2025-12-01",
    "end_date": "2025-12-31"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/my/stats</div>
        <div class="endpoint-info">
          <div class="description">Get current user's work statistics</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "stats": {
    "total_hours_logged": 45.5,
    "hours_this_week": 12.5,
    "hours_this_month": 45.5,
    "total_work_days": 8,
    "average_hours_per_day": 5.7,
    "most_productive_day": "Tuesday",
    "breakdown_by_type": {
      "DEVELOPMENT": 32.5,
      "TESTING": 8.0,
      "REVIEW": 5.0
    },
    "recent_activity": [
      {
        "date": "2025-12-02",
        "hours": 2.5,
        "tasks_worked": 1
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/recent</div>
        <div class="endpoint-info">
          <div class="description">Get recent work logs</div>
          <div class="description"><strong>Query params:</strong> ?days=7&limit=10</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "worklogs": [
    {
      "id": "log-uuid-456",
      "user": {
        "id": "dev-uuid-123",
        "username": "test_developer"
      },
      "hours_logged": 2.5,
      "work_date": "2025-12-02",
      "task": {
        "id": "task-uuid-123",
        "title": "Test Task API"
      },
      "log_type": "DEVELOPMENT",
      "created_at": "2025-12-02T18:30:00Z"
    }
  ],
  "total_entries": 25,
  "days_requested": 7
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a specific task</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "task": {
    "id": "task-uuid-123",
    "title": "Test Task API"
  },
  "worklogs": [
    {
      "id": "log-uuid-456",
      "user": {
        "username": "test_developer",
        "email": "testdeveloper@testapp.com"
      },
      "hours_logged": 2.5,
      "work_date": "2025-12-02",
      "description": "Initial implementation and testing",
      "log_type": "DEVELOPMENT"
    }
  ],
  "total_hours": 12.5,
  "total_entries": 5,
  "contributors": 2
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/subtask/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a specific subtask</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "subtask": {
    "id": "subtask-uuid-789",
    "title": "Test Subtask API"
  },
  "worklogs": [
    {
      "id": "log-uuid-789",
      "hours_logged": 1.5,
      "work_date": "2025-12-02",
      "description": "Subtask development work",
      "log_type": "DEVELOPMENT",
      "user": {
        "username": "test_developer"
      }
    }
  ],
  "total_hours": 4.0,
  "total_entries": 3
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a project (Manager/Admin only)</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "project": {
    "id": "proj-uuid-123",
    "project_name": "Test Project API"
  },
  "worklogs": [
    {
      "id": "log-uuid-456",
      "user": {
        "username": "test_developer",
        "role": "DEVELOPER"
      },
      "task": {
        "title": "Test Task API"
      },
      "hours_logged": 2.5,
      "work_date": "2025-12-02",
      "log_type": "DEVELOPMENT"
    }
  ],
  "summary": {
    "total_hours": 125.5,
    "total_entries": 48,
    "team_members": 3,
    "this_week_hours": 28.5
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/project/{projectId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get project work statistics</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "project": {
    "id": "proj-uuid-123",
    "project_name": "Test Project API"
  },
  "statistics": {
    "total_hours_logged": 125.5,
    "hours_this_week": 28.5,
    "hours_this_month": 125.5,
    "average_daily_hours": 7.2,
    "team_productivity": {
      "most_productive_member": "test_developer",
      "least_productive_member": "john_dev",
      "team_average": 41.8
    },
    "breakdown_by_type": {
      "DEVELOPMENT": 85.5,
      "TESTING": 25.0,
      "REVIEW": 15.0
    },
    "weekly_trend": [
      { "week": "2025-11-25", "hours": 32.5 },
      { "week": "2025-12-02", "hours": 28.5 }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Get work log by ID</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "worklog": {
    "id": "log-uuid-456",
    "user": {
      "id": "dev-uuid-123",
      "username": "test_developer",
      "email": "testdeveloper@testapp.com"
    },
    "task": {
      "id": "task-uuid-123",
      "title": "Test Task API",
      "project": {
        "id": "proj-uuid-456",
        "project_name": "Test Project API"
      }
    },
    "hours_logged": 2.5,
    "work_date": "2025-12-02",
    "description": "Initial implementation and testing of task functionality",
    "log_type": "DEVELOPMENT",
    "created_at": "2025-12-02T18:30:00Z",
    "updated_at": "2025-12-02T18:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Update work log</div>
          <pre>{
  "hours_logged": 3.0,
  "description": "Updated: Initial implementation and testing with bug fixes",
  "log_type": "BUG_FIX"
}</pre>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Work log updated successfully",
  "worklog": {
    "id": "log-uuid-456",
    "hours_logged": 3.0,
    "description": "Updated: Initial implementation and testing with bug fixes",
    "log_type": "BUG_FIX",
    "updated_at": "2025-12-02T20:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Delete work log</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Work log deleted successfully",
  "deleted": {
    "log_id": "log-uuid-456",
    "hours_removed": 3.0,
    "task_id": "task-uuid-123"
  }
}</pre>
        </div>
      </div>

      <h2>👥 Admin Endpoints (6)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/admin/dashboard</div>
        <div class="endpoint-info">
          <div class="description">Get admin dashboard statistics</div>
          <div class="description"><strong>Auth Required:</strong> Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "dashboard": {
    "users": {
      "total": 3,
      "active": 3,
      "admins": 1,
      "managers": 1,
      "developers": 1,
      "new_this_month": 0
    },
    "projects": {
      "total": 3,
      "active": 2,
      "completed": 1,
      "overdue": 0
    },
    "tasks": {
      "total": 12,
      "completed": 8,
      "in_progress": 2,
      "todo": 2,
      "overdue": 1
    },
    "system_health": {
      "database_status": "healthy",
      "api_response_time": "45ms",
      "storage_used": "15.2MB"
    }
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/admin/users</div>
        <div class="endpoint-info">
          <div class="description">Get all users (admin only)</div>
          <div class="description"><strong>Auth Required:</strong> Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "users": [
    {
      "id": "admin-uuid-123",
      "username": "test_admin",
      "email": "testadmin@testapp.com",
      "role": "ADMIN",
      "email_verified": true,
      "created_at": "2025-11-15T10:00:00Z",
      "last_login": "2025-12-01T09:00:00Z"
    },
    {
      "id": "manager-uuid-456",
      "username": "test_manager",
      "email": "testmanager@testapp.com",
      "role": "MANAGER",
      "email_verified": true,
      "projects_managed": 2,
      "team_size": 3
    },
    {
      "id": "dev-uuid-789",
      "username": "test_developer",
      "email": "testdeveloper@testapp.com",
      "role": "DEVELOPER",
      "email_verified": true,
      "active_tasks": 3,
      "total_hours_logged": 45.5
    }
  ],
  "total_count": 3,
  "roles_breakdown": {
    "ADMIN": 1,
    "MANAGER": 1,
    "DEVELOPER": 1
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method patch">PATCH /api/admin/users/{userId}/role</div>
        <div class="endpoint-info">
          <div class="description">Update user role</div>
          <pre>{
  "role": "MANAGER"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": "dev-uuid-789",
    "username": "test_developer",
    "email": "testdeveloper@testapp.com",
    "previous_role": "DEVELOPER",
    "new_role": "MANAGER",
    "updated_at": "2025-12-01T16:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/admin/users/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Delete user account</div>
          <div class="description"><strong>Auth Required:</strong> Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "User account deleted successfully",
  "deleted": {
    "user_id": "dev-uuid-789",
    "username": "test_developer",
    "email": "testdeveloper@testapp.com",
    "tasks_reassigned": 3,
    "work_logs_preserved": true,
    "projects_affected": 2
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/admin/users/by-email/{email}</div>
        <div class="endpoint-info">
          <div class="description">Delete user by email (Test only)</div>
          <div class="description"><strong>Auth Required:</strong> Admin role (Development/Test environment)</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "User account deleted successfully by email",
  "deleted": {
    "email": "testuser@testapp.com",
    "user_id": "test-uuid-123",
    "username": "test_user",
    "deletion_method": "by_email"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/admin/cleanup-pending-data</div>
        <div class="endpoint-info">
          <div class="description">Cleanup pending registrations (Test only)</div>
          <div class="description"><strong>Auth Required:</strong> Admin role (Development/Test environment)</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Cleanup completed successfully",
  "cleaned": {
    "pending_registrations": 5,
    "expired_otps": 12,
    "unverified_accounts": 3,
    "cleanup_date": "2025-12-01T17:00:00Z"
  },
  "summary": {
    "total_items_removed": 20,
    "database_optimization": "completed"
  }
}</pre>
        </div>
      </div>
      
      <h2>📊 Estimation Endpoints (16)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/estimates</div>
        <div class="endpoint-info">
          <div class="description">Create a new task/subtask estimate</div>
          <pre>{
  "estimated_hours": 16.0,
  "task_id": "task-uuid-123",
  "complexity": "MEDIUM",
  "confidence_level": 4,
  "notes": "Initial estimate based on requirements analysis"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Estimate created successfully",
  "estimate": {
    "id": "estimate-uuid-789",
    "estimator_id": "dev-uuid-456",
    "task_id": "task-uuid-123",
    "estimated_hours": 8,
    "complexity": "MEDIUM",
    "confidence_level": 4,
    "notes": "Based on similar features",
    "created_at": "2024-01-15T10:15:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/my</div>
        <div class="endpoint-info">
          <div class="description">Get current user's estimates</div>
          <div class="description"><strong>Query params:</strong> ?taskId=task-uuid-123&estimateType=INITIAL&limit=10</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "estimates": [
    {
      "id": "estimate-uuid-789",
      "task_id": "task-uuid-123",
      "task_title": "Test Task API",
      "estimated_hours": 16.0,
      "actual_hours": 12.5,
      "complexity": "MEDIUM",
      "confidence_level": 4,
      "estimate_type": "INITIAL",
      "accuracy_percentage": 78.1,
      "notes": "Initial estimate based on requirements analysis",
      "created_at": "2025-12-01T10:15:00Z"
    }
  ],
  "total_estimates": 25,
  "average_accuracy": 85.5,
  "summary": {
    "under_estimates": 8,
    "over_estimates": 12,
    "perfect_estimates": 5
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/my/accuracy</div>
        <div class="endpoint-info">
          <div class="description">Get user's estimation accuracy metrics</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "accuracy": {
    "total_estimates": 25,
    "completed_estimates": 20,
    "average_accuracy_percentage": 85.5,
    "under_estimates": 8,
    "over_estimates": 12,
    "perfect_estimates": 0,
    "average_deviation_hours": 1.2,
    "improvement_trend": "IMPROVING",
    "recent_estimates": [
      {
        "task_title": "User Authentication",
        "estimated": 8,
        "actual": 6.5,
        "accuracy": 92.3
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/trends</div>
        <div class="endpoint-info">
          <div class="description">Get estimation trends and analytics</div>
          <div class="description"><strong>Query params:</strong> ?period=3months&userId=dev-uuid-123&projectId=proj-uuid-456</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "trends": {
    "overall_accuracy": {
      "current_period": 85.5,
      "previous_period": 78.2,
      "improvement": 7.3
    },
    "monthly_breakdown": [
      {
        "month": "2025-10",
        "estimates_count": 12,
        "average_accuracy": 78.2,
        "total_estimated_hours": 96,
        "total_actual_hours": 85.5
      },
      {
        "month": "2025-11",
        "estimates_count": 15,
        "average_accuracy": 82.1,
        "total_estimated_hours": 120,
        "total_actual_hours": 108.2
      }
    ],
    "complexity_patterns": {
      "LOW": { "accuracy": 92.5, "count": 8 },
      "MEDIUM": { "accuracy": 85.0, "count": 12 },
      "HIGH": { "accuracy": 75.2, "count": 7 }
    },
    "team_comparison": [
      {
        "user": "test_developer",
        "accuracy": 85.5,
        "estimates_count": 25
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <h3>📊 Additional Estimation Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get estimates for a specific task</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "task": {
    "id": "task-uuid-123",
    "title": "Test Task API"
  },
  "estimates": [
    {
      "id": "estimate-uuid-789",
      "estimator": {
        "username": "test_developer",
        "role": "DEVELOPER"
      },
      "estimated_hours": 16.0,
      "complexity": "MEDIUM",
      "confidence_level": 4,
      "notes": "Initial estimate based on requirements",
      "created_at": "2025-12-01T10:15:00Z"
    }
  ],
  "summary": {
    "total_estimates": 3,
    "average_estimate": 14.5,
    "min_estimate": 12.0,
    "max_estimate": 16.0
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/task/{taskId}/summary</div>
        <div class="endpoint-info">
          <div class="description">Get task estimation summary and consensus</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "task": {
    "id": "task-uuid-123",
    "title": "Test Task API"
  },
  "consensus": {
    "recommended_hours": 14.5,
    "confidence_score": 8.2,
    "estimator_agreement": 85.5,
    "complexity_consensus": "MEDIUM"
  },
  "breakdown": {
    "initial_estimates": 2,
    "revised_estimates": 1,
    "final_estimate": 14.5,
    "actual_hours": 12.5,
    "accuracy": 86.2
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/estimates/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Update task estimate (Manager/Admin only)</div>
          <pre>{
  "estimated_hours": 18.0,
  "complexity": "HIGH",
  "notes": "Updated based on requirements changes"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/subtask/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Get estimates for a specific subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/subtask/{subtaskId}/summary</div>
        <div class="endpoint-info">
          <div class="description">Get subtask estimation summary</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/estimates/subtask/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Update subtask estimate</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/project/{projectId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get project estimation statistics</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "project": {
    "id": "proj-uuid-123",
    "project_name": "Test Project API"
  },
  "statistics": {
    "total_estimates": 45,
    "average_accuracy": 82.5,
    "total_estimated_hours": 320,
    "total_actual_hours": 285.5,
    "overall_accuracy": 89.2,
    "complexity_breakdown": {
      "LOW": { "count": 15, "accuracy": 95.2 },
      "MEDIUM": { "count": 20, "accuracy": 82.1 },
      "HIGH": { "count": 10, "accuracy": 72.8 }
    },
    "estimator_performance": [
      {
        "estimator": "test_developer",
        "estimates_count": 25,
        "accuracy": 85.5
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/estimator/{estimatorId}</div>
        <div class="endpoint-info">
          <div class="description">Get estimates by specific estimator</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/estimates/{estimateId}</div>
        <div class="endpoint-info">
          <div class="description">Get specific estimate details</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/estimates/{estimateId}</div>
        <div class="endpoint-info">
          <div class="description">Update specific estimate</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/estimates/{estimateId}</div>
        <div class="endpoint-info">
          <div class="description">Delete estimate</div>
        </div>
      </div>
      
      <h2>👥 Team Management Endpoints (14)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams</div>
        <div class="endpoint-info">
          <div class="description">Get teams based on user role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/teams</div>
        <div class="endpoint-info">
          <div class="description">Create a new team</div>
          <pre>{
  "team_name": "Test Development Team",
  "description": "A test team created by automated API testing script"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "team_id": "team-uuid-123",
    "team_name": "Test Development Team",
    "description": "A test team created by automated API testing script",
    "manager_id": "manager-uuid-456",
    "member_count": 0,
    "created_at": "2025-12-01T09:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/dashboard</div>
        <div class="endpoint-info">
          <div class="description">Get team management dashboard</div>
        </div>
      </div>
      
      <h3>👥 Detailed Team Management Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/{teamId}</div>
        <div class="endpoint-info">
          <div class="description">Get team details by ID</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "team": {
    "team_id": "team-uuid-123",
    "team_name": "Test Development Team",
    "description": "A test team created by automated API testing script",
    "manager": {
      "id": "manager-uuid-456",
      "username": "test_manager",
      "email": "testmanager@testapp.com"
    },
    "members": [
      {
        "id": "dev-uuid-123",
        "username": "test_developer",
        "role": "DEVELOPER",
        "join_date": "2025-12-01T10:00:00Z",
        "active_tasks": 3
      }
    ],
    "statistics": {
      "total_members": 3,
      "active_projects": 2,
      "completed_projects": 5,
      "total_hours_logged": 245.5
    },
    "created_at": "2025-12-01T09:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/teams/{teamId}</div>
        <div class="endpoint-info">
          <div class="description">Update team information</div>
          <pre>{
  "team_name": "Updated Test Development Team",
  "description": "Updated description for test team"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/teams/{teamId}</div>
        <div class="endpoint-info">
          <div class="description">Delete team</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/{teamId}/members</div>
        <div class="endpoint-info">
          <div class="description">Get team members</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/teams/{teamId}/members</div>
        <div class="endpoint-info">
          <div class="description">Add member to team</div>
          <pre>{
  "user_id": "dev-uuid-789",
  "role_in_team": "DEVELOPER"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/teams/{teamId}/members/{memberId}</div>
        <div class="endpoint-info">
          <div class="description">Remove member from team</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/{teamId}/projects</div>
        <div class="endpoint-info">
          <div class="description">Get team's assigned projects</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/teams/{teamId}/projects</div>
        <div class="endpoint-info">
          <div class="description">Assign project to team</div>
          <pre>{
  "project_id": "proj-uuid-123"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/teams/{teamId}/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Unassign project from team</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/{teamId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get team performance statistics</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "team": {
    "team_id": "team-uuid-123",
    "team_name": "Test Development Team"
  },
  "performance": {
    "productivity_score": 87.5,
    "total_hours_logged": 245.5,
    "projects_completed": 5,
    "active_projects": 2,
    "tasks_completed": 48,
    "average_task_completion_time": 3.2,
    "member_performance": [
      {
        "member": "test_developer",
        "hours_logged": 85.5,
        "tasks_completed": 18,
        "productivity_score": 92.1
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/teams/{teamId}/workload</div>
        <div class="endpoint-info">
          <div class="description">Get team workload distribution</div>
        </div>
      </div>
      
      
      <h2>📈 Reports & Analytics Endpoints (6)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/reports/weekly/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Generate weekly project report</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/reports/monthly/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Generate monthly project report</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/reports/analytics</div>
        <div class="endpoint-info">
          <div class="description">Get dashboard analytics overview</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "analytics": {
    "overview": {
      "totalProjects": 3,
      "totalTasks": 12,
      "completedTasks": 8,
      "overdueTasks": 1,
      "activeUsers": 3
    },
    "thisMonth": {
      "tasksCompleted": 8,
      "hoursLogged": 45.5,
      "projectsDelivered": 1
    },
    "statusDistribution": {
      "TODO": 2,
      "IN_PROGRESS": 2,
      "IN_REVIEW": 0,
      "DONE": 8,
      "BLOCKED": 0
    },
    "productivity": {
      "estimationAccuracy": 78.5,
      "onTimeDelivery": 85.0,
      "teamVelocity": 90.2
    }
  }
}</pre>
        </div>
      </div>
      
      <h3>📈 Comprehensive Reports & Analytics Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/reports/custom</div>
        <div class="endpoint-info">
          <div class="description">Generate custom report with date range and filters</div>
          <div class="description"><strong>Query params:</strong> ?startDate=2025-11-01&endDate=2025-12-31&projectId=proj-uuid-123&userId=dev-uuid-456</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "report": {
    "period": {
      "start_date": "2025-11-01",
      "end_date": "2025-12-31"
    },
    "summary": {
      "total_projects": 3,
      "total_tasks": 15,
      "completed_tasks": 12,
      "total_hours_logged": 125.5,
      "team_members": 3
    },
    "productivity": {
      "tasks_per_day": 0.8,
      "hours_per_day": 6.3,
      "completion_rate": 80.0
    },
    "breakdown": {
      "by_project": [
        {
          "project": "Test Project API",
          "tasks": 5,
          "hours": 45.5
        }
      ],
      "by_member": [
        {
          "member": "test_developer",
          "tasks": 8,
          "hours": 65.5
        }
      ]
    }
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/reports/export/pdf</div>
        <div class="endpoint-info">
          <div class="description">Export report as PDF</div>
          <pre>{
  "reportType": "weekly",
  "projectId": "proj-uuid-123",
  "startDate": "2025-12-01",
  "includeCharts": true,
  "includeDetails": true
}</pre>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "PDF report generated successfully",
  "report": {
    "filename": "weekly-report-2025-12-01.pdf",
    "file_size": "245.6 KB",
    "pages": 8,
    "generated_at": "2025-12-01T18:30:00Z",
    "download_url": "/api/files/reports/weekly-report-2025-12-01.pdf",
    "expires_at": "2025-12-08T18:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/reports/download/{filename}</div>
        <div class="endpoint-info">
          <div class="description">Download generated report file</div>
          <div class="description"><strong>Response:</strong> Binary file download (PDF, Excel, etc.)</div>
        </div>
      </div>
      
      <h2>📎 File Management Endpoints (7)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/files/project/{projectId}/upload</div>
        <div class="endpoint-info">
          <div class="description">Upload files to a project</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/files/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get files for a project</div>
        </div>
      </div>
      
      <h3>📎 Complete File Management Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/files</div>
        <div class="endpoint-info">
          <div class="description">Get all files accessible to user</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "files": [
    {
      "id": "file-uuid-123",
      "filename": "test-document.txt",
      "original_filename": "test-document.txt",
      "file_size": 1024,
      "mime_type": "text/plain",
      "project": {
        "id": "proj-uuid-456",
        "project_name": "Test Project API"
      },
      "task": {
        "id": "task-uuid-789",
        "title": "Test Task API"
      },
      "uploaded_by": {
        "username": "test_manager",
        "email": "testmanager@testapp.com"
      },
      "uploaded_at": "2025-12-01T15:00:00Z"
    }
  ],
  "total_files": 15,
  "total_size": "2.5 MB"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/files/task/{taskId}/upload</div>
        <div class="endpoint-info">
          <div class="description">Upload files to a task</div>
          <div class="description"><strong>Content-Type:</strong> multipart/form-data</div>
          <div class="description"><strong>Form fields:</strong> files (multiple), description (optional)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/files/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get files for a task</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/files/{fileId}/download</div>
        <div class="endpoint-info">
          <div class="description">Download specific file</div>
          <div class="description"><strong>Response:</strong> Binary file download with proper headers</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/files/{fileId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get file statistics and metadata</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "file": {
    "id": "file-uuid-123",
    "filename": "technical-specification.md",
    "file_size": 15360,
    "mime_type": "text/markdown",
    "download_count": 8,
    "last_downloaded": "2025-12-01T16:45:00Z",
    "virus_scan_status": "clean",
    "checksum": "sha256:a1b2c3d4e5f6...",
    "metadata": {
      "width": null,
      "height": null,
      "duration": null,
      "pages": null
    }
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/files/{fileId}</div>
        <div class="endpoint-info">
          <div class="description">Delete file</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "File deleted successfully",
  "deleted": {
    "file_id": "file-uuid-123",
    "filename": "test-document.txt",
    "file_size": 1024,
    "freed_space": "1.0 KB"
  }
}</pre>
        </div>
      </div>
      
      <h2>🗓️ Calendar Endpoints (8)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/calendar/tasks</div>
        <div class="endpoint-info">
          <div class="description">Get tasks in calendar format</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/calendar/deadlines</div>
        <div class="endpoint-info">
          <div class="description">Get upcoming deadlines</div>
        </div>
      </div>
      
      <h3>🗓️ Complete Calendar Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/calendar/holidays</div>
        <div class="endpoint-info">
          <div class="description">Get holidays for current year</div>
          <div class="description"><strong>Query params:</strong> ?year=2025&country=US</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "holidays": [
    {
      "id": "holiday-uuid-123",
      "name": "New Year's Day",
      "date": "2025-01-01",
      "type": "NATIONAL",
      "description": "First day of the year",
      "is_working_day": false
    },
    {
      "id": "holiday-uuid-456",
      "name": "Test Holiday",
      "date": "2025-12-25",
      "type": "CUSTOM",
      "description": "A test holiday created by automated API testing script",
      "is_working_day": false
    }
  ],
  "total_holidays": 12,
  "year": 2025
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/calendar/holidays</div>
        <div class="endpoint-info">
          <div class="description">Add custom holiday (Admin only)</div>
          <pre>{
  "name": "Company Anniversary",
  "date": "2025-12-15",
  "description": "Company founding anniversary celebration",
  "type": "COMPANY",
  "is_working_day": false
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/calendar/holidays/{holidayId}</div>
        <div class="endpoint-info">
          <div class="description">Delete custom holiday (Admin only)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/calendar/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get project calendar with tasks and deadlines</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "project": {
    "id": "proj-uuid-123",
    "project_name": "Test Project API"
  },
  "calendar": {
    "tasks": [
      {
        "id": "task-uuid-123",
        "title": "Test Task API",
        "start_date": "2025-12-01",
        "end_date": "2025-12-15",
        "status": "IN_PROGRESS"
      }
    ],
    "milestones": [
      {
        "date": "2025-12-15",
        "title": "Phase 1 Complete",
        "type": "DEADLINE"
      }
    ],
    "holidays": [
      {
        "date": "2025-12-25",
        "name": "Christmas Day"
      }
    ]
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/calendar/reminders</div>
        <div class="endpoint-info">
          <div class="description">Set deadline reminder</div>
          <pre>{
  "task_id": "task-uuid-123",
  "reminder_date": "2025-12-14T09:00:00Z",
  "reminder_type": "EMAIL",
  "message": "Task deadline reminder"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/calendar/reminders</div>
        <div class="endpoint-info">
          <div class="description">Get user's upcoming reminders</div>
        </div>
      </div>
      
      <h2>👤 Profile Management Endpoints (8)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/profile</div>
        <div class="endpoint-info">
          <div class="description">Get current user's profile</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/profile/photo/upload</div>
        <div class="endpoint-info">
          <div class="description">Upload profile photo</div>
        </div>
      </div>
      
      <h3>👤 Complete Profile Management Endpoints</h3>
      
      <div class="endpoint">
        <div class="method get">GET /api/profile/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Get profile by user ID (Admin/Manager only)</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "profile": {
    "id": "dev-uuid-123",
    "username": "test_developer",
    "email": "testdeveloper@testapp.com",
    "role": "DEVELOPER",
    "profile_photo_url": "https://storage.supabase.co/...",
    "created_at": "2025-11-15T10:00:00Z",
    "last_active": "2025-12-01T18:00:00Z",
    "statistics": {
      "total_tasks_assigned": 25,
      "completed_tasks": 18,
      "total_hours_logged": 125.5,
      "average_hours_per_day": 6.3,
      "projects_involved": 3
    }
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/profile</div>
        <div class="endpoint-info">
          <div class="description">Update own profile</div>
          <pre>{
  "username": "updated_developer",
  "email": "updated.developer@testapp.com",
  "bio": "Experienced full-stack developer",
  "skills": ["JavaScript", "Python", "React", "Node.js"],
  "timezone": "America/New_York"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/profile/photo/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Get user's profile photo</div>
          <div class="description"><strong>Response:</strong> Binary image data or redirect to photo URL</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/profile/photo</div>
        <div class="endpoint-info">
          <div class="description">Delete own profile photo</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/profile/admin/cleanup-photos</div>
        <div class="endpoint-info">
          <div class="description">Cleanup orphaned profile photos (Admin only)</div>
          <div class="description"><strong>Auth Required:</strong> Admin role</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Photo cleanup completed",
  "cleanup_summary": {
    "orphaned_photos_found": 5,
    "photos_deleted": 5,
    "storage_freed": "2.3 MB",
    "cleanup_date": "2025-12-01T19:00:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/profile/admin/cleanup-sample-photos</div>
        <div class="endpoint-info">
          <div class="description">Cleanup sample profile photos (Admin only - Dev/Test)</div>
          <div class="description"><strong>Auth Required:</strong> Admin role (Development/Test environment)</div>
        </div>
      </div>

      <h2>🔧 Utility Endpoints</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/health</div>
        <div class="endpoint-info">
          <div class="description">API health check</div>
          <pre>{ "status": "ok" }</pre>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding: 20px; background: #edf2f7; border-radius: 8px;">
        <h3>🔑 Authentication</h3>
        <p>All endpoints except <code>/auth/*</code> and <code>/health</code> require a Bearer token:</p>
        <pre>Authorization: Bearer {your-jwt-token}</pre>
        <p><strong>User Roles:</strong></p>
        <ul>
          <li><strong>ADMIN</strong> - Full system access, user management</li>
          <li><strong>MANAGER</strong> - Project and team management, task assignment</li>
          <li><strong>DEVELOPER</strong> - Task execution, work logging, time tracking</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 20px; background: #fed7d7; border-radius: 8px;">
        <h3>📝 Complete Documentation</h3>
        <p><strong>Total: 109 API Endpoints</strong></p>
        <p>This page shows key endpoints. For complete interactive documentation with all request/response schemas, examples, and testing capabilities:</p>
        <p>🔗 <strong><a href="/api/swagger" style="color: #2d3748;">Visit Full Swagger UI Documentation</a></strong></p>
        <p>📄 <strong><a href="/api/docs/swagger.json" style="color: #2d3748;">Download OpenAPI JSON Specification</a></strong></p>
      </div>
      
      <div style="margin-top: 20px; padding: 20px; background: #e6fffa; border-radius: 8px;">
        <h3>🚀 Getting Started</h3>
        <ol>
          <li>Register: <code>POST /api/auth/register</code></li>
          <li>Verify email with OTP: <code>POST /api/auth/verify-otp</code></li>
          <li>Login: <code>POST /api/auth/login</code></li>
          <li>Use the returned JWT token in all requests</li>
          <li>Start creating projects, tasks, and tracking work!</li>
        </ol>
      </div>
    </div>
  </div>
</body>
</html>`;

module.exports = { apiDocsHTML };