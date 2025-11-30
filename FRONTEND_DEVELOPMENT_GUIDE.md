# 🚀 Frontend Development Guide

## 📋 Complete Backend API Documentation for Frontend Developers

This document provides comprehensive guidance for frontend developers to build a modern, feature-rich project management application using our complete backend API system.

## 🎯 **What We've Built - Complete Backend System**

### **✅ Complete Enterprise-Grade Backend (109 API Endpoints)**

Our backend provides a **complete, production-ready API** with the following modules:

| Module                   | Endpoints | Status      | Description                                   |
| ------------------------ | --------- | ----------- | --------------------------------------------- |
| **🔐 Authentication**    | 9         | ✅ Complete | JWT auth, OTP verification, role-based access |
| **📊 Projects**          | 15        | ✅ Complete | Full project lifecycle management             |
| **📋 Tasks**             | 12        | ✅ Complete | Task creation, assignment, scheduling         |
| **📁 File Management**   | 8         | ✅ Complete | File upload, download, sharing                |
| **👑 Admin Panel**       | 8         | ✅ Complete | User management, system administration        |
| **📅 Calendar**          | 8         | ✅ Complete | Holiday management, scheduling                |
| **📈 Analytics**         | 6         | ✅ Complete | Dashboard metrics, reporting                  |
| **👤 User Profiles**     | 8         | ✅ Complete | Profile management, photo uploads             |
| **👥 Team Management**   | 14        | ✅ Complete | Team creation, member assignment              |
| **⏱️ Work Logs**         | 10        | ✅ Complete | Time tracking, productivity metrics           |
| **📊 Estimation System** | 16        | ✅ Complete | Task estimation, accuracy tracking            |
| **📈 Subtasks**          | 7         | ✅ Complete | Task breakdown, hierarchical management       |

---

## 🔧 **Backend Infrastructure**

### **Base URL**

```
Production: https://project-management-system-backend-service.vercel.app/api
Development: http://localhost:5000/api
```

### **Authentication System**

```javascript
// All API requests require JWT token in header
Authorization: Bearer <your_jwt_token>
```

---

## 🎨 **Frontend Implementation Requirements**

### **1. User Interface Architecture**

#### **Role-Based Dashboards Required:**

**👑 Admin Dashboard:**

```javascript
// Required Views:
- System Overview (users, projects, tasks statistics)
- User Management (CRUD operations)
- System Administration
- Analytics Dashboard
- Role Management Interface

// Key API Endpoints:
GET /api/admin/dashboard          // System statistics
GET /api/admin/users             // User list with roles
PATCH /api/admin/users/{id}/role // Update user roles
GET /api/reports/analytics       // Advanced analytics
```

**👔 Manager Dashboard:**

```javascript
// Required Views:
- Project Overview (owned projects)
- Team Management
- Task Assignment Interface
- Project Creation Forms
- Progress Tracking

// Key API Endpoints:
GET /api/projects/dashboard      // Project overview
GET /api/projects               // Manager's projects
POST /api/projects              // Create new project
GET /api/projects/developers    // Available developers for assignment
POST /api/tasks                 // Create tasks
POST /api/tasks/{id}/assign     // Assign tasks to developers
```

**👨‍💻 Developer Dashboard:**

```javascript
// Required Views:
- Assigned Tasks Overview
- Work Log Interface
- File Upload/Download
- Task Status Updates
- Time Tracking

// Key API Endpoints:
GET /api/tasks/my-tasks         // Developer's assigned tasks
PUT /api/tasks/{id}/status      // Update task status
POST /api/worklogs              // Log work hours
GET /api/files/project/{id}     // Project files
POST /api/files/project/{id}/upload // Upload files
```

---

### **2. Core UI Components Needed**

#### **Authentication Components:**

```javascript
// Registration with OTP Verification
POST / api / auth / register; // Registration (sends OTP)
POST / api / auth / verify - otp; // Verify email with OTP
POST / api / auth / resend - otp; // Resend OTP if needed

// Login System
POST / api / auth / login; // Login with email/password
POST / api / auth / refresh; // Refresh JWT token
POST / api / auth / logout; // Logout (optional cleanup)
```

#### **Project Management Components:**

```javascript
// Project CRUD Interface
GET / api / projects; // List user's projects
POST / api / projects; // Create new project
GET / api / projects / { id }; // Get project details
PUT / api / projects / { id }; // Update project
DELETE / api / projects / { id }; // Delete project

// Project Statistics Dashboard
GET / api / projects / { id } / stats; // Project metrics
GET / api / projects / { id } / timeline; // Project timeline
```

#### **Task Management Interface:**

```javascript
// Task Management
GET / api / tasks; // List tasks (filterable)
POST / api / tasks; // Create new task
PUT / api / tasks / { id }; // Update task
DELETE / api / tasks / { id }; // Delete task
POST / api / tasks / { id } / assign; // Assign to developers
DELETE / api / tasks / { id } / unassign / { developerId }; // Unassign

// Task Status Updates
PUT / api / tasks / { id } / status; // Update status (NEW, ASSIGNED, IN_PROGRESS, COMPLETED)
GET / api / tasks / my - tasks; // Developer's assigned tasks
```

#### **File Management Interface:**

```javascript
// File Operations (Multipart Form Data)
POST / api / files / project / { id } / upload; // Upload files to project
GET / api / files / project / { id }; // Get project files
GET / api / files / task / { id }; // Get task files
GET / api / files / { id } / download; // Download specific file
DELETE / api / files / { id }; // Delete file
```

---

### **3. Advanced Features Implementation**

#### **Team Management System:**

```javascript
// Team Operations
GET / api / teams; // List teams
POST / api / teams; // Create team
PUT / api / teams / { id }; // Update team
POST / api / teams / { id } / members; // Add team members
DELETE / api / teams / { id } / members / { userId }; // Remove member
GET / api / teams / dashboard; // Team performance metrics
```

#### **Work Logging & Time Tracking:**

```javascript
// Time Tracking
POST / api / worklogs; // Log work hours
GET / api / worklogs / task / { id }; // Get task work logs
PUT / api / worklogs / { id }; // Update work log
DELETE / api / worklogs / { id }; // Delete work log
GET / api / worklogs / user / stats; // User productivity stats
```

#### **Estimation System:**

```javascript
// Task Estimation
POST / api / estimates; // Create task estimate
GET / api / estimates / task / { id }; // Get task estimates
PUT / api / estimates / { id }; // Update estimate
GET / api / estimates / accuracy; // Estimation accuracy metrics
```

#### **Calendar Integration:**

```javascript
// Calendar Features
GET / api / calendar / tasks; // Calendar view of tasks
GET / api / calendar / deadlines; // Upcoming deadlines
GET / api / calendar / holidays; // Holiday calendar
POST / api / calendar / reminders; // Set deadline reminders
GET / api / calendar / projects / { id }; // Project calendar view
```

---

## 📊 **Data Models & Schemas**

### **User/Profile Model:**

```javascript
{
  user_id: "uuid",
  username: "string",
  email: "string",
  role: "ADMIN" | "MANAGER" | "DEVELOPER",
  email_verified: boolean,
  profile_photo_url: "string",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### **Project Model:**

```javascript
{
  project_id: "uuid",
  project_name: "string",
  description: "string",
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD",
  start_date: "date",
  end_date: "date",
  owner_manager_id: "uuid",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### **Task Model:**

```javascript
{
  task_id: "uuid",
  project_id: "uuid",
  title: "string",
  description: "string",
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED",
  priority: "LOW" | "MEDIUM" | "HIGH",
  start_date: "date",
  end_date: "date",
  created_at: "timestamp",
  assignments: [
    {
      developer: {
        user_id: "uuid",
        username: "string",
        email: "string"
      }
    }
  ]
}
```

### **File Model:**

```javascript
{
  file_id: "uuid",
  project_id: "uuid",
  task_id: "uuid", // optional
  file_name: "string",
  file_size: number,
  mime_type: "string",
  download_url: "string",
  uploaded_by: {
    user_id: "uuid",
    username: "string"
  },
  uploaded_at: "timestamp"
}
```

---

## 🎯 **Required Frontend Pages**

### **1. Authentication Pages**

- **Registration Page** - Email, username, password, role selection, OTP verification
- **Login Page** - Email/password with "Remember Me"
- **OTP Verification** - 6-digit code input with resend functionality

### **2. Dashboard Pages**

- **Admin Dashboard** - System overview, user management, analytics
- **Manager Dashboard** - Project overview, team management, task creation
- **Developer Dashboard** - Assigned tasks, work logging, file access

### **3. Project Management Pages**

- **Project List** - Grid/table view with filters
- **Project Details** - Project info, tasks, team members, files
- **Project Creation** - Form with validation
- **Project Statistics** - Charts, progress tracking

### **4. Task Management Pages**

- **Task List** - Kanban board or table view
- **Task Details** - Task info, assignments, work logs, files
- **Task Creation** - Form with scheduling, assignment
- **Task Assignment** - Developer selection interface

### **5. File Management Pages**

- **File Browser** - Project/task file organization
- **File Upload** - Drag & drop interface
- **File Preview** - Document viewer

### **6. Admin Pages**

- **User Management** - CRUD operations, role updates
- **System Settings** - Configuration management
- **Analytics Dashboard** - System-wide metrics

---

## 🔐 **Authentication Flow**

### **Registration Process:**

```javascript
1. User fills registration form
2. POST /api/auth/register (sends OTP to email)
3. User enters OTP from email
4. POST /api/auth/verify-otp (creates account)
5. Redirect to login or auto-login
```

### **Login Process:**

```javascript
1. User enters email/password
2. POST /api/auth/login
3. Receive JWT token
4. Store token (localStorage/sessionStorage)
5. Include token in all subsequent requests
```

### **Token Management:**

```javascript
// Add to all API requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// Refresh token before expiry
POST /api/auth/refresh
```

---

## 📁 **File Upload Implementation**

### **File Upload Example:**

```javascript
// Frontend file upload
const uploadFiles = async (files, projectId, taskId = null) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (taskId) {
    formData.append("task_id", taskId);
  }

  const response = await fetch(`/api/files/project/${projectId}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData
    },
    body: formData,
  });

  return response.json();
};
```

---

## 📊 **Dashboard Data Integration**

### **Admin Dashboard Data:**

```javascript
// Fetch admin dashboard stats
const fetchAdminDashboard = async () => {
  const response = await fetch("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  // Returns: users stats, projects stats, tasks stats, system health
};
```

### **Manager Dashboard Data:**

```javascript
// Fetch manager dashboard
const fetchManagerDashboard = async () => {
  const [projects, analytics] = await Promise.all([
    fetch("/api/projects/dashboard").then((r) => r.json()),
    fetch("/api/reports/analytics").then((r) => r.json()),
  ]);

  // Returns: projects overview, task statistics, team performance
};
```

### **Developer Dashboard Data:**

```javascript
// Fetch developer dashboard
const fetchDeveloperDashboard = async () => {
  const [tasks, workLogs] = await Promise.all([
    fetch("/api/tasks/my-tasks").then((r) => r.json()),
    fetch("/api/worklogs/user/stats").then((r) => r.json()),
  ]);

  // Returns: assigned tasks, work log statistics, productivity metrics
};
```

---

## 🎨 **UI/UX Recommendations**

### **Design System:**

- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS or Material-UI
- **Icons**: Lucide React or Heroicons
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form with validation
- **File Upload**: React Dropzone
- **Date Pickers**: React Date Picker

### **Responsive Design:**

- Mobile-first approach
- Responsive dashboard layouts
- Touch-friendly interfaces
- Progressive Web App capabilities

### **User Experience:**

- Loading states for all API calls
- Error handling with user-friendly messages
- Confirmation dialogs for destructive actions
- Real-time updates where appropriate
- Keyboard shortcuts for power users

---

## 🧪 **Testing & Development**

### **API Testing:**

- All endpoints have working test data
- Use provided test accounts:
  - Admin: `testadmin@testapp.com` (password: `testpass123`)
  - Manager: `testmanager@testapp.com` (password: `testpass123`)
  - Developer: `testdeveloper@testapp.com` (password: `testpass123`)

### **Development Tools:**

- **API Documentation**: `/api/docs` (Interactive Swagger UI)
- **API Specification**: `/api/docs/swagger.json`
- **Test Data**: Run `npm run seed` in backend
- **API Testing**: Run `npm run test` in backend

---

## 🚀 **Getting Started**

### **Step 1: Set up API Client**

```javascript
// Create API client utility
class ApiClient {
  constructor(baseURL = "http://localhost:5000/api") {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("authToken");
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    return response.json();
  }

  // Authentication methods
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Project methods
  async getProjects() {
    return this.request("/projects");
  }

  async createProject(projectData) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  // Add more methods as needed...
}
```

### **Step 2: Set up Authentication Context**

```javascript
// React Context for authentication
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await apiClient.login(email, password);
    if (response.success) {
      localStorage.setItem("authToken", response.token);
      setUser(response.user);
      return response;
    }
    throw new Error(response.message);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Step 3: Implement Role-Based Routing**

```javascript
// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// App routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/developer"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER"]}>
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
```

---

## 📚 **Additional Resources**

### **Complete API Documentation:**

- **Interactive Docs**: Visit `/api/docs` when backend is running
- **OpenAPI Spec**: Download from `/api/docs/swagger.json`
- **Test Suite**: Review `test/test-api.js` for usage examples

### **Database Schema:**

- **Complete ERD**: See `COMPLETE_API_SPECIFICATION.md`
- **Migration Files**: Check `supabase/migrations/`

### **Email System:**

- **SMTP Configuration**: Already set up with Gmail
- **OTP Templates**: Professional email templates ready
- **Production Ready**: Environment variables configured

---

## 🎯 **Success Metrics**

With our complete backend, you can build a frontend that delivers:

- **✅ Complete User Management** - Registration, authentication, role management
- **✅ Project Lifecycle Management** - Creation, planning, execution, completion
- **✅ Task Assignment & Tracking** - Developer assignment, progress monitoring
- **✅ File Management System** - Upload, download, organization, sharing
- **✅ Time Tracking & Analytics** - Work logs, productivity metrics
- **✅ Calendar Integration** - Deadlines, holidays, scheduling
- **✅ Admin Capabilities** - System administration, user management
- **✅ Email Notifications** - OTP verification, task alerts

**Your backend is production-ready and enterprise-grade. Build an amazing frontend to match! 🚀**

---

_This guide provides everything needed to create a modern, scalable project management application. The backend handles all complex business logic, authentication, and data management - focus on creating an intuitive, beautiful user experience._
