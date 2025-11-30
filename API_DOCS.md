# Project Management Backend API Documentation

## Overview

This backend API provides a REST interface for the Project Management System. It includes email-based OTP verification for secure user registration, works with Supabase as the database, and provides role-based access control for ADMIN, MANAGER, and DEVELOPER users.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except auth) require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication & OTP Verification (`/api/auth`)

#### Register User (Step 1: Send OTP)

- **POST** `/auth/register`
- **Body**: `{ username, email, password, role }`
- **Response**: `{ message: "OTP sent to your email. Please verify to complete registration.", tempUserId: "uuid" }`
- **Description**: Initiates registration by sending a 6-digit OTP to the user's email. User data is temporarily stored until verification.

#### Verify OTP (Step 2: Complete Registration)

- **POST** `/auth/verify-otp`
- **Body**: `{ email, otp }`
- **Response**: `{ message: "Email verified and account created successfully", token: "jwt_token", user: { id, username, email, role, email_verified: true } }`
- **Description**: Verifies the OTP and completes user registration. Returns JWT token for immediate login.

#### Resend OTP

- **POST** `/auth/resend-otp`
- **Body**: `{ email }`
- **Response**: `{ message: "New OTP sent to your email" }`
- **Description**: Resends a new OTP to the user's email if the previous one expired or was lost.

#### Login User

- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ token, user: { id, username, email, role, email_verified } }`
- **Description**: Authenticates user login. Only users with verified emails can log in.

**Registration Flow Example:**

```javascript
// Step 1: Register and send OTP
POST /auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "DEVELOPER"
}
// Response: { "message": "OTP sent to your email...", "tempUserId": "..." }

// Step 2: User receives email with 6-digit code, then verifies
POST /auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
// Response: { "token": "jwt_token", "user": {...}, "message": "Email verified and account created successfully" }

// Step 3: User is now logged in and can use the token
```

### Projects (`/api/projects`)

#### List Projects

- **GET** `/projects`
- **Access**: All roles (filtered by permissions)
- **Response**: `{ projects: [...] }`

#### Create Project

- **POST** `/projects`
- **Access**: MANAGER, ADMIN
- **Body**: `{ project_name, description }`
- **Response**: Project object

#### Get Project

- **GET** `/projects/:projectId`
- **Access**: Project members, ADMIN
- **Response**: Project object with owner details

#### Update Project

- **PUT** `/projects/:projectId`
- **Access**: Project owner, ADMIN
- **Body**: `{ project_name?, description? }`
- **Response**: Updated project object

#### Delete Project

- **DELETE** `/projects/:projectId`
- **Access**: Project owner, ADMIN
- **Response**: `{ message: "Project deleted successfully" }`

#### Get Dashboard

- **GET** `/projects/dashboard`
- **Access**: All roles
- **Response**: `{ projects: [...], tasks: [...] }`

### Tasks (`/api/tasks`)

#### List User Tasks

- **GET** `/tasks`
- **Access**: All roles (filtered by assignments/ownership)
- **Response**: `{ tasks: [...] }`

#### List Project Tasks

- **GET** `/tasks/project/:projectId`
- **Access**: Project members, ADMIN
- **Response**: `{ tasks: [...] }`

#### Create Task

- **POST** `/tasks/project/:projectId`
- **Access**: Project owner, ADMIN
- **Body**: `{ title, description?, start_date?, end_date? }`
- **Response**: Task object

#### Get Task

- **GET** `/tasks/:taskId`
- **Access**: Task assignees, project owner, ADMIN
- **Response**: Task object with assignments

#### Update Task

- **PATCH** `/tasks/:taskId`
- **Access**: Varies by field and role
- **Body**: `{ title?, description?, start_date?, end_date?, status? }`
- **Response**: Updated task object

#### Delete Task

- **DELETE** `/tasks/:taskId`
- **Access**: Project owner, ADMIN
- **Response**: `{ message: "Task deleted successfully" }`

#### Assign Developer

- **POST** `/tasks/:taskId/assign`
- **Access**: Project owner, ADMIN
- **Body**: `{ developer_id }`
- **Response**: Assignment object

#### Unassign Developer

- **DELETE** `/tasks/:taskId/unassign/:developerId`
- **Access**: Project owner, ADMIN
- **Response**: `{ message: "Developer unassigned successfully" }`

### Files (`/api/files`)

#### Upload File

- **POST** `/files/upload`
- **Access**: Project members
- **Body**: FormData with file and metadata
- **Response**: File object

#### Get Project Files

- **GET** `/files/project/:projectId`
- **Access**: Project members
- **Response**: `{ files: [...] }`

#### Get Task Files

- **GET** `/files/task/:taskId`
- **Access**: Task assignees, project owner
- **Response**: `{ files: [...] }`

#### Delete File

- **DELETE** `/files/:fileId`
- **Access**: File uploader, project owner, ADMIN
- **Response**: `{ message: "File deleted successfully" }`

### Admin (`/api/admin`)

#### Get Dashboard Stats

- **GET** `/admin/dashboard`
- **Access**: ADMIN only
- **Response**: System-wide statistics

#### List All Users

- **GET** `/admin/users`
- **Access**: ADMIN only
- **Response**: `{ users: [...] }`

#### Update User Role

- **PATCH** `/admin/users/:userId/role`
- **Access**: ADMIN only
- **Body**: `{ role }`
- **Response**: `{ message: "User role updated successfully", user: {...} }`

#### Delete User

- **DELETE** `/admin/users/:userId`
- **Access**: ADMIN only
- **Response**: `{ message: "User deleted successfully" }`

## Data Models

### User/Profile

```javascript
{
  user_id: "uuid",
  username: "string",
  email: "string",
  role: "ADMIN" | "MANAGER" | "DEVELOPER",
  email_verified: "boolean",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### OTP Record

```javascript
{
  id: "uuid",
  email: "string",
  otp: "string",
  expires_at: "timestamp",
  used: "boolean",
  created_at: "timestamp"
}
```

### Pending Registration

```javascript
{
  id: "uuid",
  email: "string",
  user_data: {
    username: "string",
    email: "string",
    password_hash: "string",
    role: "string"
  },
  created_at: "timestamp"
}
```

### Project

```javascript
{
  project_id: "uuid",
  project_name: "string",
  description: "string",
  owner_manager_id: "uuid",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Task

```javascript
{
  task_id: "uuid",
  project_id: "uuid",
  title: "string",
  description: "string",
  start_date: "date",
  end_date: "date",
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED",
  created_at: "timestamp",
  updated_at: "timestamp",
  assignments: [{ developer: { user_id, username, email } }]
}
```

### File

```javascript
{
  file_id: "uuid",
  project_id: "uuid",
  task_id: "uuid",
  uploaded_by_user_id: "uuid",
  file_name: "string",
  file_path_in_storage: "string",
  file_size: "number",
  mime_type: "string",
  upload_date: "timestamp"
}
```

## Role-Based Permissions

### ADMIN

- Full access to all resources
- Can manage users and roles
- Can view system-wide statistics

### MANAGER

- Can create and manage own projects
- Can create, update, and assign tasks in own projects
- Can upload files to own projects

### DEVELOPER

- Can view projects they're assigned to (via tasks)
- Can view and update status of assigned tasks
- Can upload files to assigned tasks
- Cannot create projects or tasks

## Error Responses

All endpoints return consistent error responses:

```javascript
{
  "message": "Error description",
  "error": "Detailed error message" // In development
}
```

Common HTTP status codes:

- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `400` - Bad request (validation error)
- `500` - Internal server error

## Integration with Frontend

This backend is designed to work alongside the existing Supabase frontend. The frontend can either:

1. **Direct Supabase**: Continue using Supabase client for real-time features and simple CRUD
2. **Backend API**: Use this REST API for complex business logic and file uploads
3. **Hybrid**: Use both approaches where appropriate

The backend provides additional features like:

- **Email OTP Verification**: Secure user registration with 6-digit email verification
- **Professional Email Templates**: HTML-formatted emails with modern design
- Advanced file upload handling
- Complex permission checks
- Email notifications
- Background job processing
- Detailed audit logging

## Email System Features

- **SMTP Integration**: Uses Gmail SMTP with nodemailer for reliable email delivery
- **OTP Security**: 6-digit codes with 10-minute expiration
- **Professional Templates**: Branded HTML emails with responsive design
- **Automatic Cleanup**: Expired OTPs and pending registrations are automatically cleaned
- **Resend Functionality**: Users can request new OTP codes if needed
