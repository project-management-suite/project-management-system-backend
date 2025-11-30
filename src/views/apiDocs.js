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
      <p>Complete API Documentation - 109 Endpoints</p>
      <p style="margin: 10px 0; opacity: 0.9;">Authentication • Projects • Tasks • Subtasks • Work Logs • Estimates • Teams • Reports • Files • Calendar • Profiles • Admin</p>
      <div style="margin: 15px 0;">
        <a href="/api/swagger" style="color: #90cdf4; text-decoration: none; margin: 0 10px;">📚 Interactive Swagger UI</a>
        <a href="/api/docs/swagger.json" style="color: #90cdf4; text-decoration: none; margin: 0 10px;">📄 OpenAPI JSON</a>
      </div>
    </div>
    
    <div class="content">
      <h2>🔐 Authentication Endpoints (5)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/register</div>
        <div class="endpoint-info">
          <div class="description">Register a new user (sends OTP to email)</div>
          <pre>{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "DEVELOPER"
}</pre>
          <div class="description"><strong>Response:</strong> OTP sent to email for verification</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "john@example.com",
  "tempUserId": "temp-uuid-123"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/verify-otp</div>
        <div class="endpoint-info">
          <div class="description">Verify OTP and complete registration</div>
          <pre>{
  "email": "john@example.com",
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
    "username": "john_doe",
    "email": "john@example.com",
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
  "email": "john@example.com"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/login</div>
        <div class="endpoint-info">
          <div class="description">Login user (requires verified email)</div>
          <pre>{
  "email": "john@example.com",
  "password": "securePassword123"
}</pre>
          <div class="description"><strong>Response:</strong> JWT token and user profile</div>
          <pre><strong>Sample Response (200):</strong>
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-456",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "DEVELOPER",
    "email_verified": true
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/auth/test/last-otp</div>
        <div class="endpoint-info">
          <div class="description">Get last generated OTP (Development/Test only)</div>
          <div class="description"><strong>Query:</strong> ?email=john@example.com</div>
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
      "project_name": "E-commerce Platform",
      "description": "Online shopping platform",
      "status": "IN_PROGRESS",
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "created_by": "manager-uuid-789",
      "task_count": 25,
      "completed_tasks": 15,
      "team_members": 8
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
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/projects</div>
        <div class="endpoint-info">
          <div class="description">Create a new project</div>
          <pre>{
  "project_name": "E-commerce Platform",
  "description": "A comprehensive online shopping platform",
  "start_date": "2024-01-01",
  "end_date": "2024-06-30"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
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
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Delete project and all associated data</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/projects/{projectId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign team members to project</div>
          <pre>{
  "userIds": ["user-uuid-1", "user-uuid-2"]
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <h2>📋 Task Endpoints (8)</h2>
      
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
      "title": "Implement User Authentication",
      "description": "Create secure login system",
      "project_id": "proj-uuid-123",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "due_date": "2024-02-15T23:59:59Z",
      "estimated_hours": 16,
      "actual_hours": 8.5,
      "assigned_to": "dev-uuid-123",
      "subtask_count": 3,
      "completion_percentage": 60
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
  "title": "Implement User Authentication",
  "description": "Create secure login system with JWT tokens",
  "priority": "HIGH",
  "due_date": "2024-02-15T23:59:59Z",
  "estimated_hours": 16,
  "assigned_to": "user-uuid-456"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get task details by ID</div>
          <div class="description"><strong>Response:</strong> Full task information with subtasks</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method patch">PATCH /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Update task information</div>
          <pre>{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "actual_hours": 12.5
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Delete task and all related data</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/{taskId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign developer to task</div>
          <pre>{
  "developer_id": "user-uuid-123"
}</pre>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/{taskId}/unassign/{developerId}</div>
        <div class="endpoint-info">
          <div class="description">Unassign developer from task</div>
          <div class="description"><strong>Auth Required:</strong> Manager or Admin role</div>
        </div>
      </div>
      
      <h2>📝 Subtask Endpoints (11)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks</div>
        <div class="endpoint-info">
          <div class="description">Create a new subtask</div>
          <pre>{
  "title": "Create login form",
  "description": "Design responsive login form with validation",
  "task_id": "task-uuid-123",
  "priority": "MEDIUM",
  "estimated_hours": 4
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Subtask created successfully",
  "subtask": {
    "id": "subtask-uuid-789",
    "title": "Create login form",
    "description": "Design responsive login form with validation",
    "task_id": "task-uuid-123",
    "status": "TODO",
    "priority": "MEDIUM",
    "estimated_hours": 4,
    "created_by": "dev-uuid-456",
    "created_at": "2024-01-15T14:30:00Z"
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
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get subtasks for a project with filters</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Get subtask details by ID</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Update subtask information</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/subtasks/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Delete subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign user to subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/unassign/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Unassign user from subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/subtasks/{subtaskId}/estimate</div>
        <div class="endpoint-info">
          <div class="description">Add estimate to subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/subtasks/{subtaskId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get subtask statistics</div>
        </div>
      </div>
      
      <h2>⏱️ Work Log Endpoints (12)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/worklogs</div>
        <div class="endpoint-info">
          <div class="description">Create a new work log entry</div>
          <pre>{
  "hours_logged": 3.5,
  "work_date": "2024-01-15",
  "task_id": "task-uuid-123",
  "description": "Implemented login validation",
  "log_type": "DEVELOPMENT"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Work log created successfully",
  "worklog": {
    "id": "log-uuid-456",
    "user_id": "dev-uuid-123",
    "hours_logged": 3.5,
    "work_date": "2024-01-15",
    "task_id": "task-uuid-123",
    "description": "Implemented login validation",
    "log_type": "DEVELOPMENT",
    "created_at": "2024-01-15T18:30:00Z"
  }
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/worklogs/bulk</div>
        <div class="endpoint-info">
          <div class="description">Create multiple work log entries</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/my</div>
        <div class="endpoint-info">
          <div class="description">Get current user's work logs with filters</div>
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
    "total_hours_logged": 160.5,
    "hours_this_week": 40,
    "hours_this_month": 140,
    "total_work_days": 22,
    "average_hours_per_day": 7.3,
    "most_productive_day": "Tuesday",
    "breakdown_by_type": {
      "DEVELOPMENT": 120.5,
      "TESTING": 25,
      "REVIEW": 15
    },
    "recent_activity": [
      {
        "date": "2024-01-15",
        "hours": 8,
        "tasks_worked": 3
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
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/task/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a specific task</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/subtask/{subtaskId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a specific subtask</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get work logs for a project (Manager/Admin only)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/project/{projectId}/stats</div>
        <div class="endpoint-info">
          <div class="description">Get project work statistics</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Get work log by ID</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Update work log</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/worklogs/{logId}</div>
        <div class="endpoint-info">
          <div class="description">Delete work log</div>
        </div>
      </div>

      <h2>👥 Admin Endpoints (6)</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/admin/dashboard</div>
        <div class="endpoint-info">
          <div class="description">Get admin dashboard statistics</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/admin/users</div>
        <div class="endpoint-info">
          <div class="description">Get all users (admin only)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method patch">PATCH /api/admin/users/{userId}/role</div>
        <div class="endpoint-info">
          <div class="description">Update user role</div>
          <pre>{
  "role": "MANAGER"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/admin/users/{userId}</div>
        <div class="endpoint-info">
          <div class="description">Delete user account</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/admin/users/by-email/{email}</div>
        <div class="endpoint-info">
          <div class="description">Delete user by email (Test only)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/admin/cleanup-pending-data</div>
        <div class="endpoint-info">
          <div class="description">Cleanup pending registrations (Test only)</div>
        </div>
      </div>
      
      <h2>📊 Estimation Endpoints (16)</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/estimates</div>
        <div class="endpoint-info">
          <div class="description">Create a new task/subtask estimate</div>
          <pre>{
  "estimated_hours": 8,
  "task_id": "task-uuid-123",
  "complexity": "MEDIUM",
  "confidence_level": 4,
  "notes": "Based on similar features"
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
        </div>
      </div>
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Estimation endpoints include 12 more detailed endpoints for task/subtask estimates, summaries, and accuracy tracking. Visit <a href="/api/swagger">/api/swagger</a> for complete details.
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
  "team_name": "Frontend Development Team",
  "description": "Responsible for UI/UX development"
}</pre>
          <pre><strong>Sample Response (201):</strong>
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "team_id": "team-uuid-123",
    "team_name": "Frontend Development Team",
    "description": "Responsible for UI/UX development",
    "manager_id": "manager-uuid-456",
    "member_count": 0,
    "created_at": "2024-01-15T09:00:00Z"
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
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Team management includes 11 more endpoints for member management, project assignments, and team statistics. Visit <a href="/api/swagger">/api/swagger</a> for complete details.
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
      "totalProjects": 15,
      "totalTasks": 245,
      "completedTasks": 180,
      "overdueTasks": 12,
      "activeUsers": 25
    },
    "thisMonth": {
      "tasksCompleted": 45,
      "hoursLogged": 1250,
      "projectsDelivered": 3
    },
    "statusDistribution": {
      "TODO": 25,
      "IN_PROGRESS": 40,
      "IN_REVIEW": 15,
      "DONE": 180,
      "BLOCKED": 5
    },
    "productivity": {
      "estimationAccuracy": 82.5,
      "onTimeDelivery": 78.3,
      "teamVelocity": 92.1
    }
  }
}</pre>
        </div>
      </div>
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Also includes custom reports, PDF export, and download endpoints.
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
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Also includes task files, file stats, and file management endpoints.
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
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Also includes holiday management, reminders, and project calendar endpoints.
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
      
      <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
        <strong>Note:</strong> Also includes photo management, profile updates, and admin photo cleanup endpoints.
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