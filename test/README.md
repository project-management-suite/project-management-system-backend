# API Testing Suite

This directory contains comprehensive tests for all backend API endpoints.

## 🚀 Quick Start

```bash
# 1. Start the backend server (from project root)
cd /path/to/project-management-system-backend
NODE_ENV=development npm run dev

# 2. Run the comprehensive API tests (from project root or test directory)
node test/test-api.js
```

## 📁 Directory Structure

```
test/
├── README.md           # This documentation
├── test-api.js         # Main comprehensive API test script
└── assets/             # Test assets (images, files, etc.)
    ├── divyansh.jpeg   # Test photo for admin user
    ├── jane.jpeg       # Test photo for updates
    ├── john.jpeg       # Test photo for developer user
    ├── mike.jpeg       # Additional test photo
    └── sarah.jpeg      # Test photo for manager user
```

## 🧪 Test Coverage

The test suite covers **all 46 API endpoints** across 8 modules:

### 🔐 Authentication (4 endpoints)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (requires email config)
- `POST /api/auth/verify-otp` - Email verification (requires email config)
- `POST /api/auth/resend-otp` - Resend verification code (requires email config)

### 👤 Profile Management (7 endpoints)

- `GET /api/profile/` - Get current user profile
- `GET /api/profile/:userId` - Get user profile by ID
- `POST /api/profile/photo/upload` - Upload profile photo ✨
- `PUT /api/profile/photo/update` - Update profile photo ✨
- `DELETE /api/profile/photo/remove` - Remove profile photo ✨
- `GET /api/profile/photo/history` - Get photo history ✨
- `POST /api/profile/admin/cleanup-photos` - Admin photo cleanup ✨

### 👑 Admin Functions (4 endpoints)

- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user (not tested to preserve data)

### 📋 Project Management (8 endpoints)

- `GET /api/projects/` - Get all projects
- `GET /api/projects/dashboard` - Project dashboard
- `GET /api/projects/developers` - Get available developers
- `POST /api/projects/` - Create new project
- `GET /api/projects/:projectId` - Get specific project
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project
- `POST /api/projects/:projectId/assign` - Assign members

### ✅ Task Management (8 endpoints)

- `GET /api/tasks/` - Get user's tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks/project/:projectId` - Create task
- `GET /api/tasks/:taskId` - Get specific task
- `PATCH /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task
- `POST /api/tasks/:taskId/assign` - Assign developer
- `DELETE /api/tasks/:taskId/unassign/:developerId` - Unassign developer

### 📅 Calendar Features (8 endpoints)

- `GET /api/calendar/holidays` - Get holidays
- `POST /api/calendar/holidays` - Add holiday (Admin)
- `PUT /api/calendar/holidays/:id` - Update holiday (Admin)
- `DELETE /api/calendar/holidays/:id` - Delete holiday (Admin)
- `GET /api/calendar/tasks` - Get tasks calendar
- `GET /api/calendar/deadlines` - Get upcoming deadlines
- `POST /api/calendar/reminders` - Set deadline reminder
- `GET /api/calendar/projects/:projectId` - Get project calendar

### 📊 Reporting (5 endpoints)

- `GET /api/reports/analytics` - Dashboard analytics
- `GET /api/reports/weekly/:projectId` - Weekly report
- `GET /api/reports/monthly/:projectId` - Monthly report
- `GET /api/reports/custom` - Custom date range report
- `POST /api/reports/export/pdf` - Export PDF report

### 📁 File Management (2 endpoints)

- `GET /api/files/` - Get files list
- `GET /api/files/:fileId` - Get specific file

## 🎯 Test Features

✅ **Comprehensive Coverage** - Tests all 46 endpoints  
✅ **Real File Uploads** - Tests photo upload with actual images ✨  
✅ **Role-Based Testing** - Tests Admin, Manager, Developer permissions  
✅ **Data Cleanup** - Automatically cleans up test data  
✅ **Detailed Reporting** - Shows success/failure for each endpoint  
✅ **Error Handling** - Graceful handling of missing dependencies

## 📋 Prerequisites

1. **Backend server running** on `http://localhost:5000`
2. **Test users created** in Supabase:
   - `testadmin@testapp.com` (ADMIN role)
   - `testmanager@testapp.com` (MANAGER role)
   - `testdeveloper@testapp.com` (DEVELOPER role)
3. **Database accessible** with proper Supabase configuration

## 🔧 Configuration

The test script uses these default settings:

- **Base URL**: `http://localhost:5000/api`
- **Test Password**: `testpass123` (for all test users)
- **Photo Assets**: Located in `test/assets/`

## 📖 Usage Tips

- **Email endpoints** require proper email service configuration
- **Photo endpoints** use real file uploads from `test/assets/`
- **Admin functions** require admin token (automatic via login)
- **Cleanup runs automatically** after tests complete
- **Failed tests show detailed error messages** for debugging

## 🚨 Important Notes

- Tests create and delete temporary projects/tasks
- Photo uploads are tested with real files
- Some endpoints may fail if email service is not configured
- Admin user deletion is skipped to preserve test accounts

---

**💡 Tip**: Run tests regularly during development to catch regressions early!
