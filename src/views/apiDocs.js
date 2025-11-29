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
      <h1>🚀 Project Management API</h1>
      <p>Complete API Documentation</p>
    </div>
    
    <div class="content">
      <h2>🔐 Authentication Endpoints</h2>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/register</div>
        <div class="endpoint-info">
          <div class="description">Register a new user</div>
          <pre>{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "ADMIN | MANAGER | DEVELOPER"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/auth/login</div>
        <div class="endpoint-info">
          <div class="description">Login user</div>
          <pre>{
  "email": "string",
  "password": "string"
}</pre>
        </div>
      </div>
      
      <h2>📊 Project Endpoints</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects</div>
        <div class="endpoint-info">
          <div class="description">Get all projects</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/projects</div>
        <div class="endpoint-info">
          <div class="description">Create a new project</div>
          <pre>{
  "project_name": "string",
  "description": "string"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects/developers</div>
        <div class="endpoint-info">
          <div class="description">Get all developers (for managers)</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get project by ID</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Update project</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/projects/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Delete project</div>
        </div>
      </div>
      
      <h2>📋 Task Endpoints</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks</div>
        <div class="endpoint-info">
          <div class="description">Get all tasks</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method get">GET /api/tasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Get tasks for a specific project</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/project/{projectId}</div>
        <div class="endpoint-info">
          <div class="description">Create a new task</div>
          <pre>{
  "title": "string",
  "description": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method post">POST /api/tasks/{taskId}/assign</div>
        <div class="endpoint-info">
          <div class="description">Assign developer to task</div>
          <pre>{
  "developer_id": "string"
}</pre>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method put">PUT /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Update task</div>
        </div>
      </div>
      
      <div class="endpoint">
        <div class="method delete">DELETE /api/tasks/{taskId}</div>
        <div class="endpoint-info">
          <div class="description">Delete task</div>
        </div>
      </div>
      
      <h2>👥 Admin Endpoints</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/admin/users</div>
        <div class="endpoint-info">
          <div class="description">Get all users (admin only)</div>
        </div>
      </div>
      
      <h2>🔧 Utility Endpoints</h2>
      
      <div class="endpoint">
        <div class="method get">GET /api/health</div>
        <div class="endpoint-info">
          <div class="description">Health check</div>
          <pre>{ "status": "ok" }</pre>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding: 20px; background: #edf2f7; border-radius: 8px;">
        <h3>🔑 Authentication</h3>
        <p>All endpoints except <code>/auth/*</code> and <code>/health</code> require a Bearer token:</p>
        <pre>Authorization: Bearer {your-jwt-token}</pre>
      </div>
      
      <div style="margin-top: 20px; padding: 20px; background: #fed7d7; border-radius: 8px;">
        <h3>📝 Response Format</h3>
        <p>All responses are in JSON format. Error responses include a <code>message</code> field.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

module.exports = { apiDocsHTML };