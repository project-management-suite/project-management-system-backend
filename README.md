# Project Management Backend API

A Node.js Express backend API for project management system using Supabase as the database.

## Features

- **Authentication**: JWT-based authentication with Supabase Auth
- **Role-based Authorization**: ADMIN, MANAGER, DEVELOPER roles
- **Project Management**: CRUD operations for projects
- **Task Management**: Create, assign, and track tasks
- **File Management**: Upload and manage project files
- **Real-time Updates**: Integration with Supabase real-time features
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **File Storage**: AWS S3 + Supabase Storage
- **Documentation**: Swagger UI
- **Queue Management**: Bull + Redis

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- A Supabase project
- Redis server (for job queues)
- AWS account (for file uploads)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Project-mngmt-Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp env.example .env
   ```

   Fill in your environment variables in `.env`:

   ```bash
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret

   # Other configurations...
   ```

4. **Database Setup**

   Ensure your Supabase database has the required tables. The frontend repository contains the migration files:

   - `profiles` table for user data
   - `projects` table for project management
   - `tasks` and `task_assignments` tables for task management
   - `files` table for file metadata

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

6. **API Documentation**

   Visit `http://localhost:5000/api-docs` to view the Swagger documentation.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects

- `GET /api/projects` - List projects (role-based)
- `POST /api/projects` - Create project (managers only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/dashboard` - Get dashboard data

### Tasks

- `GET /api/tasks` - Get user tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks/project/:projectId` - Create task
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign developer to task
- `DELETE /api/tasks/:id/unassign/:developerId` - Unassign developer

### Files

- `POST /api/files/upload` - Upload file
- `GET /api/files/project/:projectId` - Get project files
- `GET /api/files/task/:taskId` - Get task files
- `DELETE /api/files/:id` - Delete file

### Reports & Admin

- Various admin and reporting endpoints

## Database Schema

The backend works with the following Supabase tables:

- **profiles**: User information and roles
- **projects**: Project data and ownership
- **tasks**: Task details and status
- **task_assignments**: Developer-task relationships
- **files**: File metadata and storage paths

## Role-Based Permissions

- **ADMIN**: Full access to all resources
- **MANAGER**: Can create/manage own projects and tasks
- **DEVELOPER**: Can view assigned tasks and update their status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
