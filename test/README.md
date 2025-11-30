# 🧪 Comprehensive API Testing Suite

This directory contains comprehensive tests for **all 109 backend API endpoints** across 12 functional modules, ensuring complete system validation and reliability.

## 🚀 Quick Start

### Standard Testing

```bash
# 1. Start the backend server (from project root)
cd /path/to/project-management-system-backend
NODE_ENV=development npm run dev

# 2. Run the comprehensive API tests
node test/test-api.js
```

### Verbose Testing (with detailed logging)

```bash
# Run with --info flag for detailed request/response information
node test/test-api.js --info
```

## 📁 Directory Structure

```
test/
├── README.md           # This comprehensive documentation
├── test-api.js         # Main comprehensive API test script (109 endpoints)
├── seed-data.js        # Test data population and management
└── assets/             # Test assets (images, files, etc.)
    ├── divyansh.jpeg   # Test photo for admin user
    ├── jane.jpeg       # Test photo for updates
    ├── john.jpeg       # Test photo for developer user
    ├── mike.jpeg       # Additional test photo
    └── sarah.jpeg      # Test photo for manager user
```

## 🎯 Complete Test Coverage (109 Endpoints)

The test suite provides **comprehensive coverage** of all API endpoints across 12 functional modules:

### 🔐 Authentication & Security (9 endpoints)

- `POST /api/auth/register` - User registration with OTP
- `POST /api/auth/verify-otp` - Email verification
- `POST /api/auth/resend-otp` - Resend verification code
- `POST /api/auth/login` - User authentication
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/verify-reset-otp` - Verify reset token
- `POST /api/auth/reset-password` - Complete password reset
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/logout` - Session termination

### 👤 Profile Management (8 endpoints) ✨

- `GET /api/profile/` - Get current user profile
- `GET /api/profile/:userId` - Get user profile by ID (Admin/own)
- `POST /api/profile/photo/upload` - Upload profile photo with real files ✨
- `PUT /api/profile/photo/update` - Update profile photo with real files ✨
- `DELETE /api/profile/photo/remove` - Remove profile photo ✨
- `GET /api/profile/photo/history` - Get photo upload history ✨
- `POST /api/profile/admin/cleanup-photos` - Admin photo cleanup ✨
- `POST /api/profile/admin/cleanup-sample-photos` - Sample data cleanup ✨

### 👑 Admin Functions (8 endpoints)

- `GET /api/admin/dashboard` - Comprehensive admin dashboard stats
- `GET /api/admin/users` - Get all users with filtering
- `GET /api/admin/users/:userId` - Get specific user details
- `PATCH /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user account
- `GET /api/admin/system/health` - System health monitoring
- `POST /api/admin/system/cleanup` - System maintenance
- `GET /api/admin/analytics` - Administrative analytics

### 📋 Project Management (12 endpoints)

- `GET /api/projects/` - Get all accessible projects
- `GET /api/projects/dashboard` - Project dashboard analytics
- `GET /api/projects/developers` - Get available developers
- `POST /api/projects/` - Create new project
- `GET /api/projects/:projectId` - Get specific project details
- `PUT /api/projects/:projectId` - Update project information
- `DELETE /api/projects/:projectId` - Delete project
- `POST /api/projects/:projectId/assign` - Assign team members
- `GET /api/projects/:projectId/statistics` - Project metrics
- `GET /api/projects/:projectId/timeline` - Project timeline
- `PUT /api/projects/:projectId/status` - Update project status
- `GET /api/projects/:projectId/members` - Get team members

### ✅ Task Management (14 endpoints)

- `GET /api/tasks/` - Get user's assigned tasks
- `GET /api/tasks/project/:projectId` - Get all project tasks
- `POST /api/tasks/project/:projectId` - Create new task
- `GET /api/tasks/:taskId` - Get specific task details
- `PATCH /api/tasks/:taskId` - Update task information
- `DELETE /api/tasks/:taskId` - Delete task
- `POST /api/tasks/:taskId/assign` - Assign developers to task
- `DELETE /api/tasks/:taskId/unassign/:developerId` - Unassign developer
- `GET /api/tasks/:taskId/statistics` - Task performance metrics
- `POST /api/tasks/bulk/create` - Bulk task creation
- `PUT /api/tasks/bulk/update` - Bulk task updates
- `DELETE /api/tasks/bulk/delete` - Bulk task deletion
- `GET /api/tasks/search` - Advanced task search
- `GET /api/tasks/dependencies` - Task dependency mapping

### 🔧 Subtask Management (8 endpoints)

- `GET /api/subtasks/task/:taskId` - Get task subtasks
- `POST /api/subtasks/task/:taskId` - Create new subtask
- `GET /api/subtasks/:subtaskId` - Get subtask details
- `PUT /api/subtasks/:subtaskId` - Update subtask
- `DELETE /api/subtasks/:subtaskId` - Delete subtask
- `POST /api/subtasks/:subtaskId/complete` - Mark subtask complete
- `GET /api/subtasks/user` - Get user's subtasks
- `GET /api/subtasks/:subtaskId/statistics` - Subtask metrics

### ⏰ Work Log Management (12 endpoints)

- `GET /api/work-logs/` - Get user work logs
- `GET /api/work-logs/task/:taskId` - Get task work logs
- `POST /api/work-logs/` - Create work log entry
- `GET /api/work-logs/:logId` - Get specific work log
- `PUT /api/work-logs/:logId` - Update work log
- `DELETE /api/work-logs/:logId` - Delete work log
- `GET /api/work-logs/user/:userId` - Get user's work logs
- `GET /api/work-logs/statistics` - Work log statistics
- `POST /api/work-logs/bulk/create` - Bulk work log creation
- `PUT /api/work-logs/bulk/update` - Bulk work log updates
- `DELETE /api/work-logs/bulk/delete` - Bulk work log deletion
- `GET /api/work-logs/analytics` - Work log analytics

### 📊 Estimation System (9 endpoints)

- `GET /api/estimates/task/:taskId` - Get task estimates
- `POST /api/estimates/task/:taskId` - Create task estimate
- `GET /api/estimates/:estimateId` - Get estimate details
- `PUT /api/estimates/:estimateId` - Update estimate
- `DELETE /api/estimates/:estimateId` - Delete estimate
- `GET /api/estimates/user` - Get user estimates
- `GET /api/estimates/accuracy` - Estimation accuracy tracking
- `GET /api/estimates/statistics` - Estimation statistics
- `GET /api/estimates/analytics` - Estimation analytics

### 👥 Team Management (10 endpoints)

- `GET /api/teams/` - Get all teams
- `POST /api/teams/` - Create new team
- `GET /api/teams/:teamId` - Get team details
- `PUT /api/teams/:teamId` - Update team information
- `DELETE /api/teams/:teamId` - Delete team
- `POST /api/teams/:teamId/members` - Add team members
- `DELETE /api/teams/:teamId/members/:userId` - Remove team member
- `GET /api/teams/:teamId/statistics` - Team performance stats
- `GET /api/teams/user` - Get user's teams
- `GET /api/teams/:teamId/workload` - Team workload analysis

### 📅 Calendar Management (8 endpoints)

- `GET /api/calendar/holidays` - Get holiday calendar
- `POST /api/calendar/holidays` - Add holiday (Admin only)
- `PUT /api/calendar/holidays/:holidayId` - Update holiday (Admin only)
- `DELETE /api/calendar/holidays/:holidayId` - Delete holiday (Admin only)
- `GET /api/calendar/tasks` - Get task calendar view
- `GET /api/calendar/deadlines` - Get upcoming deadlines
- `POST /api/calendar/reminders` - Set deadline reminders
- `GET /api/calendar/projects/:projectId` - Get project calendar

### 📈 Analytics & Reporting (6 endpoints)

- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/projects` - Project analytics
- `GET /api/analytics/tasks` - Task analytics
- `GET /api/analytics/users` - User performance analytics
- `GET /api/analytics/teams` - Team performance analytics
- `POST /api/analytics/custom` - Custom analytics queries

### 📁 File Management (5 endpoints)

- `GET /api/files/` - Get accessible files
- `GET /api/files/:fileId` - Get specific file
- `POST /api/files/upload` - Upload project files
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/statistics` - File storage statistics

## 🎯 Advanced Testing Features

### ✅ **Enterprise-Grade Test Coverage**

- **109 API Endpoints** - Complete system validation
- **Real File Uploads** - Tests photo and document uploads with actual files ✨
- **Role-Based Testing** - Comprehensive Admin, Manager, Developer permission testing
- **Bulk Operations Testing** - Validates batch processing capabilities
- **Security Testing** - Authentication, authorization, and access control validation
- **Data Integrity** - Database consistency and relationship testing
- **Performance Validation** - Response time and throughput testing
- **Error Handling** - Comprehensive error scenario testing

### 🔧 **Test Execution Modes**

#### **Standard Mode** (Default)

- HTTP method and endpoint URL for each request
- Response status (✅ success / ❌ failure)
- Basic error messages for quick debugging
- Test execution summary and statistics

#### **Info Mode** (`--info` flag)

- All standard features plus:
- Request headers (with token truncation for security)
- Complete request data/payload (formatted JSON)
- Full response data (formatted JSON)
- Detailed error information with stack traces
- File upload indicators for FormData requests
- Performance timing information

### 📊 **Test Results & Analytics**

#### **Standard Output Example:**

```
🧪 COMPREHENSIVE API TESTING SUITE
=================================================

🔐 Testing Authentication Endpoints (9):
🔗 POST http://localhost:5000/api/auth/login
✅ Response: 200 OK - Login successful

📋 Testing Project Management (12):
🔗 GET http://localhost:5000/api/projects
✅ Response: 200 OK - Projects retrieved

📈 TEST SUMMARY:
✅ Passed: 104/109 endpoints
❌ Failed: 5/109 endpoints
⏱️ Total Time: 45.3 seconds
🔍 Run with --info for detailed analysis
```

#### **Info Mode Output Example:**

```
🔗 POST http://localhost:5000/api/auth/login
📋 INFO: Headers: { "Content-Type": "application/json" }
📋 INFO: Request Data: {
  "email": "testadmin@testapp.com",
  "password": "testpass123"
}
✅ Response: 200 OK (156ms)
📋 INFO: Response Data: {
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "admin-uuid-123",
    "username": "testadmin",
    "role": "ADMIN"
  }
}
```

## 📋 Test Prerequisites & Setup

### **Required Test Environment**

1. **Backend Server Running**

   ```bash
   # Backend must be accessible at:
   http://localhost:5000

   # Start with:
   npm run dev
   ```

2. **Test User Accounts**

   ```sql
   -- Required test users in Supabase:
   testadmin@testapp.com     (ADMIN role)
   testmanager@testapp.com   (MANAGER role)
   testdeveloper@testapp.com (DEVELOPER role)

   -- Password for all: testpass123
   ```

3. **Database Configuration**

   - Supabase project accessible and configured
   - All migrations applied successfully
   - Row Level Security (RLS) policies enabled

4. **File Assets Available**
   ```
   test/assets/
   ├── divyansh.jpeg  # Admin profile photo
   ├── sarah.jpeg     # Manager profile photo
   ├── john.jpeg      # Developer profile photo
   ├── jane.jpeg      # Update test photo
   └── mike.jpeg      # Additional test photo
   ```

### **Configuration Settings**

The test suite uses these default configurations:

```javascript
// Base API configuration
const BASE_URL = "http://localhost:5000/api";
const TEST_PASSWORD = "testpass123";

// Test users configuration
const TEST_USERS = {
  admin: { email: "testadmin@testapp.com", role: "ADMIN" },
  manager: { email: "testmanager@testapp.com", role: "MANAGER" },
  developer: { email: "testdeveloper@testapp.com", role: "DEVELOPER" },
};

// File upload test assets
const PHOTO_ASSETS = {
  admin: "divyansh.jpeg",
  manager: "sarah.jpeg",
  developer: "john.jpeg",
  update: "jane.jpeg",
};
```

## 🔧 Advanced Testing Capabilities

### **Real File Upload Testing** ✨

- Tests actual file uploads with multipart/form-data
- Validates file size limits and type restrictions
- Tests profile photo upload, update, and removal
- Verifies file storage and retrieval functionality

### **Bulk Operations Testing**

- Validates batch task creation, updates, and deletion
- Tests bulk work log operations
- Verifies data consistency across bulk operations
- Performance testing for large data sets

### **Security & Permission Testing**

- Role-based access control validation
- Authentication token verification
- Authorization boundary testing
- Data isolation verification

### **Data Consistency Testing**

- Database relationship integrity
- Cascade deletion validation
- Foreign key constraint testing
- Transaction rollback verification

## 🚨 Important Testing Notes

### **Data Safety**

- Tests create and clean up temporary data automatically
- Original test user accounts are preserved
- Photo uploads are tested but cleaned up after execution
- No permanent data modifications to production accounts

### **Email Testing**

- Email endpoints require SMTP configuration
- OTP verification tests may be skipped without email setup
- Password reset functionality requires email service

### **Performance Considerations**

- Full test suite takes approximately 45-60 seconds
- Individual module testing available for faster iterations
- Parallel execution optimized for efficiency

### **Error Handling**

- Graceful handling of missing dependencies
- Detailed error reporting for debugging
- Automatic cleanup on test failures
- Comprehensive logging for troubleshooting

---

**💡 Pro Tip**: Use `--info` mode during development for detailed debugging, and standard mode for CI/CD pipelines!
