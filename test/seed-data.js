// seed-data.js - Populate database with sample data for testing
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Base URL for your API
const BASE_URL = 'http://localhost:5000/api';

// Check for command line flags
const CREATE_USERS = process.argv.includes('--create-users') || process.argv.includes('--users');
const VERBOSE_MODE = process.argv.includes('--verbose') || process.argv.includes('--info');

// Sample users data (these should already exist)
const TEST_USERS = {
    admin: { email: 'testadmin@testapp.com', password: 'testpass123' },
    manager: { email: 'testmanager@testapp.com', password: 'testpass123' },
    developer: { email: 'testdeveloper@testapp.com', password: 'testpass123' }
};

// Additional sample users to create
const SAMPLE_USERS = [
    { username: 'alice_dev', email: 'alice@company.com', password: 'samplepass123', role: 'DEVELOPER' },
    { username: 'bob_manager', email: 'bob@company.com', password: 'samplepass123', role: 'MANAGER' },
    { username: 'carol_dev', email: 'carol@company.com', password: 'samplepass123', role: 'DEVELOPER' },
    { username: 'david_admin', email: 'david@company.com', password: 'samplepass123', role: 'ADMIN' },
    { username: 'eve_manager', email: 'eve@company.com', password: 'samplepass123', role: 'MANAGER' }
];

// Sample projects data
const SAMPLE_PROJECTS = [
    {
        project_name: 'E-Commerce Platform',
        description: 'Building a modern e-commerce platform with React and Node.js. Features include user authentication, product catalog, shopping cart, and payment integration.'
    },
    {
        project_name: 'Mobile Banking App',
        description: 'Secure mobile banking application with biometric authentication, transaction history, bill payments, and real-time notifications.'
    },
    {
        project_name: 'AI Chat Assistant',
        description: 'Intelligent chat assistant powered by machine learning for customer support automation and query resolution.'
    },
    {
        project_name: 'Inventory Management System',
        description: 'Comprehensive inventory tracking system for warehouses with barcode scanning, stock alerts, and analytics dashboard.'
    },
    {
        project_name: 'Social Media Dashboard',
        description: 'Analytics dashboard for social media management with post scheduling, engagement metrics, and competitor analysis.'
    }
];

// Sample tasks for each project
const SAMPLE_TASKS = [
    // E-Commerce Platform tasks
    { title: 'User Authentication System', description: 'Implement secure login/logout with JWT tokens', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Product Catalog API', description: 'Create REST API for product CRUD operations', priority: 'HIGH', status: 'COMPLETED' },
    { title: 'Shopping Cart Frontend', description: 'Build responsive shopping cart component', priority: 'MEDIUM', status: 'PENDING' },
    { title: 'Payment Gateway Integration', description: 'Integrate Stripe payment processing', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Order Management System', description: 'Backend system for order processing', priority: 'MEDIUM', status: 'PENDING' },

    // Mobile Banking App tasks
    { title: 'Biometric Authentication', description: 'Implement fingerprint and face recognition', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Transaction History UI', description: 'Design transaction list with filtering', priority: 'MEDIUM', status: 'COMPLETED' },
    { title: 'Bill Payment Module', description: 'Create bill payment interface', priority: 'MEDIUM', status: 'PENDING' },
    { title: 'Push Notifications', description: 'Real-time transaction alerts', priority: 'LOW', status: 'PENDING' },

    // AI Chat Assistant tasks
    { title: 'Natural Language Processing', description: 'Train ML model for intent recognition', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Knowledge Base Integration', description: 'Connect to company knowledge database', priority: 'MEDIUM', status: 'PENDING' },
    { title: 'Chat Interface Design', description: 'Create user-friendly chat UI', priority: 'MEDIUM', status: 'COMPLETED' },

    // Inventory Management tasks
    { title: 'Barcode Scanner Integration', description: 'Implement camera-based barcode scanning', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Stock Alert System', description: 'Automated low-stock notifications', priority: 'MEDIUM', status: 'PENDING' },
    { title: 'Analytics Dashboard', description: 'Real-time inventory analytics', priority: 'LOW', status: 'PENDING' },

    // Social Media Dashboard tasks
    { title: 'Post Scheduling Engine', description: 'Backend for scheduled social media posts', priority: 'HIGH', status: 'COMPLETED' },
    { title: 'Engagement Analytics', description: 'Track likes, shares, comments metrics', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { title: 'Competitor Analysis Tool', description: 'Monitor competitor social media activity', priority: 'LOW', status: 'PENDING' }
];

// Sample holidays
const SAMPLE_HOLIDAYS = [
    { holiday_name: 'New Year\'s Day', holiday_date: '2025-01-01', description: 'Start of the new year', is_recurring: true },
    { holiday_name: 'Martin Luther King Jr. Day', holiday_date: '2025-01-20', description: 'Federal holiday', is_recurring: true },
    { holiday_name: 'Presidents Day', holiday_date: '2025-02-17', description: 'Federal holiday', is_recurring: true },
    { holiday_name: 'Memorial Day', holiday_date: '2025-05-26', description: 'Federal holiday', is_recurring: true },
    { holiday_name: 'Independence Day', holiday_date: '2025-07-04', description: 'Independence Day celebration', is_recurring: true },
    { holiday_name: 'Labor Day', holiday_date: '2025-09-01', description: 'Federal holiday', is_recurring: true },
    { holiday_name: 'Thanksgiving', holiday_date: '2025-11-27', description: 'Thanksgiving Day', is_recurring: true },
    { holiday_name: 'Christmas Day', holiday_date: '2025-12-25', description: 'Christmas celebration', is_recurring: true },
    { holiday_name: 'Company Annual Party', holiday_date: '2025-12-20', description: 'Annual company celebration', is_recurring: false }
];

let tokens = {};
let createdUsers = [];
let createdProjects = [];
let createdTasks = [];

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {}
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            if (isFormData) {
                config.data = data;
                config.headers = { ...config.headers, ...data.getHeaders() };
            } else {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Wait function for rate limiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Login existing users
async function loginUsers() {
    console.log('\n🔐 LOGGING IN EXISTING USERS');
    console.log('='.repeat(50));

    for (const [userType, credentials] of Object.entries(TEST_USERS)) {
        const result = await apiRequest('POST', '/auth/login', credentials);
        if (result.success) {
            tokens[userType] = result.data.token;
            console.log(`✅ ${userType} logged in successfully`);
        } else {
            console.log(`❌ ${userType} login failed:`, result.error);
        }
    }
}

// Helper function to get OTP from backend (for testing only)
async function getRealOTPFromBackend(email) {
    console.log(`🔍 Retrieving actual OTP for ${email} from backend...`);

    try {
        // Wait a moment for OTP generation to complete
        await wait(2000);

        // Call the testing endpoint to get the real OTP
        const result = await apiRequest('GET', `/auth/test/last-otp?email=${encodeURIComponent(email)}`);

        if (result.success && result.data.otp) {
            console.log(`✅ Retrieved real OTP: ${result.data.otp}`);
            console.log(`   Generated at: ${result.data.generated_at}`);
            console.log(`   Valid for: ${result.data.valid_for_seconds} seconds`);
            return result.data.otp;
        } else {
            console.log(`❌ Could not retrieve OTP:`, result.error);
            console.log(`⚠️  Check server console for OTP logs`);
            // Fallback to asking user to check console
            return null;
        }
    } catch (error) {
        console.log(`❌ Error retrieving OTP:`, error.message);
        console.log(`⚠️  Check server console for OTP logs`);
        return null;
    }
}// Create additional sample users with OTP verification for testing
async function createSampleUsers() {
    console.log('\n👥 CREATING ADDITIONAL SAMPLE USERS (WITH OTP VERIFICATION)');
    console.log('='.repeat(50));
    console.log('🧪 TEST MODE: This will handle OTP verification for testing purposes');

    for (const user of SAMPLE_USERS) {
        console.log(`\nCreating user: ${user.username} (${user.email})`);

        // Step 1: Register user
        console.log('📝 Step 1: Registering user...');
        const registerResult = await apiRequest('POST', '/auth/register', user);

        if (!registerResult.success) {
            console.log(`❌ Registration failed for ${user.username}:`, registerResult.error);
            continue;
        }

        console.log(`✅ Registration initiated for ${user.username}`);
        console.log('📧 OTP should have been sent to:', user.email);

        // Step 2: Get real OTP from backend
        console.log('🔍 Step 2: Retrieving actual OTP from backend...');

        // Wait for email processing and OTP generation
        await wait(3000);

        // Get the real OTP that was generated by the backend
        const realOTP = await getRealOTPFromBackend(user.email);

        if (!realOTP) {
            console.log(`❌ Could not retrieve OTP for ${user.username}`);
            console.log('🔄 Check the server console output for the OTP and verify manually:');
            console.log(`   Look for: 🔑 OTP: XXXXXX in the server logs`);
            console.log(`   Then use: POST /auth/verify-otp { "email": "${user.email}", "otp": "XXXXXX" }`);
            continue;
        }

        console.log(`🔑 REAL OTP for ${user.email}: ${realOTP}`);
        console.log('✅ This is the actual OTP generated by your backend!');        // Step 3: Verify OTP
        console.log('✅ Step 3: Verifying real OTP...');
        const verifyResult = await apiRequest('POST', '/auth/verify-otp', {
            email: user.email,
            otp: realOTP
        });

        if (verifyResult.success) {
            console.log(`✅ OTP verified successfully for ${user.username}`);
            console.log(`✅ User ${user.username} is now active and can login`);

            // Store the created user info
            createdUsers.push({
                username: user.username,
                email: user.email,
                role: user.role,
                status: 'verified'
            });

            // Optional: Login the newly created user to get their token
            console.log('🔐 Logging in new user...');
            const loginResult = await apiRequest('POST', '/auth/login', {
                email: user.email,
                password: user.password
            });

            if (loginResult.success) {
                console.log(`🎉 ${user.username} successfully logged in!`);
                // Store token if needed for further operations
                tokens[user.username] = loginResult.data.token;
            }

        } else {
            console.log(`❌ OTP verification failed for ${user.username}:`, verifyResult.error);
            console.log('🔄 You can manually verify this user later with:');
            console.log(`   POST /auth/verify-otp { "email": "${user.email}", "otp": "ACTUAL_OTP" }`);
        }

        // Rate limiting between user creations
        await wait(3000);
    }

    console.log(`\n📊 Summary: ${createdUsers.length} users successfully created and verified`);
    if (createdUsers.length > 0) {
        console.log('✅ Verified users:');
        createdUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
        });
    }
}// Upload profile photos
async function uploadProfilePhotos() {
    console.log('\n📷 UPLOADING PROFILE PHOTOS');
    console.log('='.repeat(50));

    const photoMappings = [
        { userType: 'admin', filename: 'divyansh.jpeg' },
        { userType: 'manager', filename: 'sarah.jpeg' },
        { userType: 'developer', filename: 'john.jpeg' }
    ];

    for (const { userType, filename } of photoMappings) {
        if (!tokens[userType]) continue;

        const photoPath = path.join(__dirname, 'assets', filename);
        if (!fs.existsSync(photoPath)) {
            console.log(`❌ Photo ${filename} not found for ${userType}`);
            continue;
        }

        const formData = new FormData();
        formData.append('profilePhoto', fs.createReadStream(photoPath));

        const result = await apiRequest('POST', '/profile/photo/upload', formData, tokens[userType], true);
        if (result.success) {
            console.log(`✅ Uploaded profile photo for ${userType}`);
            console.log(`   URL: ${result.data.profile.profile_photo_url}`);
        } else {
            console.log(`❌ Failed to upload photo for ${userType}:`, result.error);
        }

        await wait(500);
    }
}

// Create sample projects
async function createProjects() {
    console.log('\n📋 CREATING SAMPLE PROJECTS');
    console.log('='.repeat(50));

    if (!tokens.manager) {
        console.log('❌ No manager token available for creating projects');
        return;
    }

    for (const project of SAMPLE_PROJECTS) {
        const result = await apiRequest('POST', '/projects', project, tokens.manager);
        if (result.success) {
            createdProjects.push(result.data);
            console.log(`✅ Created project: ${project.project_name}`);
            console.log(`   Project ID: ${result.data.project_id}`);
        } else {
            console.log(`❌ Failed to create project ${project.project_name}:`, result.error);
        }

        await wait(500);
    }
}

// Create sample tasks
async function createTasks() {
    console.log('\n✅ CREATING SAMPLE TASKS');
    console.log('='.repeat(50));

    if (!tokens.manager || createdProjects.length === 0) {
        console.log('❌ No manager token or projects available for creating tasks');
        return;
    }

    let taskIndex = 0;
    for (let i = 0; i < createdProjects.length; i++) {
        const project = createdProjects[i];
        const tasksPerProject = Math.ceil(SAMPLE_TASKS.length / createdProjects.length);

        console.log(`\nCreating tasks for project: ${project.project_name}`);

        for (let j = 0; j < tasksPerProject && taskIndex < SAMPLE_TASKS.length; j++, taskIndex++) {
            const task = SAMPLE_TASKS[taskIndex];

            // Add date ranges to tasks
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 7); // 7-37 days from now

            const taskData = {
                ...task,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            };

            const result = await apiRequest('POST', `/tasks/project/${project.project_id}`, taskData, tokens.manager);
            if (result.success) {
                createdTasks.push(result.data);
                console.log(`  ✅ Created task: ${task.title}`);
            } else {
                console.log(`  ❌ Failed to create task ${task.title}:`, result.error);
            }

            await wait(300);
        }
    }
}

// Upload sample files
async function uploadSampleFiles() {
    console.log('\n📁 UPLOADING SAMPLE FILES');
    console.log('='.repeat(50));

    if (!tokens.manager || createdProjects.length === 0) {
        console.log('❌ No manager token or projects available for uploading files');
        return;
    }

    // Create some sample documents if they don't exist
    const sampleFiles = [
        {
            name: 'project-requirements.txt',
            content: `# Project Requirements Document

## Functional Requirements
1. User authentication and authorization
2. Real-time data synchronization
3. Mobile-responsive design
4. API documentation
5. Security compliance

## Technical Requirements
- React.js frontend
- Node.js backend
- PostgreSQL database
- RESTful API design
- JWT authentication

## Performance Requirements
- Page load time < 2 seconds
- API response time < 500ms
- Support for 1000+ concurrent users

Created: ${new Date().toISOString()}
`
        },
        {
            name: 'technical-specification.md',
            content: `# Technical Specification

## Architecture Overview
The system follows a microservices architecture with the following components:

### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI
- **Routing**: React Router

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Supabase Client
- **Authentication**: JWT

### Infrastructure
- **Hosting**: Cloud platform
- **Storage**: Supabase Storage
- **CI/CD**: GitHub Actions

## Database Schema
- Users table with role-based access
- Projects and tasks with relationships
- File storage with metadata tracking

Generated: ${new Date().toISOString()}
`
        },
        {
            name: 'meeting-notes.txt',
            content: `# Project Meeting Notes

## Meeting Date: ${new Date().toLocaleDateString()}

### Attendees
- Project Manager
- Lead Developer
- UI/UX Designer
- QA Engineer

### Agenda Items
1. Sprint review and retrospective
2. Next sprint planning
3. Technical challenges discussion
4. Timeline adjustments

### Key Decisions
- Implement automated testing pipeline
- Weekly code review sessions
- Bi-weekly client updates
- Performance optimization priority

### Action Items
- [ ] Set up CI/CD pipeline
- [ ] Create API documentation
- [ ] Design system updates
- [ ] Security audit scheduling

### Next Meeting: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
`
        }
    ];

    // Create sample files in assets directory
    for (const file of sampleFiles) {
        const filePath = path.join(__dirname, 'assets', file.name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.content, 'utf8');
            console.log(`📝 Created sample file: ${file.name}`);
        }
    }

    // Upload files to projects
    for (let i = 0; i < Math.min(createdProjects.length, sampleFiles.length); i++) {
        const project = createdProjects[i];
        const file = sampleFiles[i];
        const filePath = path.join(__dirname, 'assets', file.name);

        const formData = new FormData();
        formData.append('files', fs.createReadStream(filePath));

        const result = await apiRequest('POST', `/files/project/${project.project_id}/upload`, formData, tokens.manager, true);
        if (result.success) {
            console.log(`✅ Uploaded ${file.name} to ${project.project_name}`);
        } else {
            console.log(`❌ Failed to upload ${file.name}:`, result.error);
        }

        await wait(500);
    }
}

// Create sample holidays
async function createHolidays() {
    console.log('\n📅 CREATING SAMPLE HOLIDAYS');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available for creating holidays');
        return;
    }

    for (const holiday of SAMPLE_HOLIDAYS) {
        const result = await apiRequest('POST', '/calendar/holidays', holiday, tokens.admin);
        if (result.success) {
            console.log(`✅ Created holiday: ${holiday.holiday_name} (${holiday.holiday_date})`);
        } else {
            console.log(`❌ Failed to create holiday ${holiday.holiday_name}:`, result.error);
        }

        await wait(300);
    }
}

// Generate sample data summary
async function generateSummary() {
    console.log('\n📊 SAMPLE DATA SUMMARY');
    console.log('='.repeat(50));

    console.log(`✅ Projects Created: ${createdProjects.length}`);
    console.log(`✅ Tasks Created: ${createdTasks.length}`);
    console.log(`✅ Profile Photos: Uploaded for admin, manager, developer`);
    console.log(`✅ Sample Files: Uploaded to projects`);
    console.log(`✅ Holidays: ${SAMPLE_HOLIDAYS.length} created`);

    console.log('\n🎯 TESTING REPORTS & ANALYTICS');
    console.log('='.repeat(50));

    if (tokens.manager) {
        // Test analytics endpoint
        console.log('\nTesting analytics dashboard:');
        const analyticsResult = await apiRequest('GET', '/reports/analytics', null, tokens.manager);
        if (analyticsResult.success) {
            const analytics = analyticsResult.data.analytics;
            console.log(`📈 Total Projects: ${analytics.overview.totalProjects}`);
            console.log(`📈 Total Tasks: ${analytics.overview.totalTasks}`);
            console.log(`📈 Completed Tasks: ${analytics.overview.completedTasks}`);
            console.log(`📈 In Progress Tasks: ${analytics.overview.inProgressTasks}`);
        }

        // Test project report if we have projects
        if (createdProjects.length > 0) {
            const projectId = createdProjects[0].project_id;
            console.log('\nTesting weekly project report:');
            const weeklyResult = await apiRequest('GET', `/reports/weekly/${projectId}`, null, tokens.manager);
            if (weeklyResult.success) {
                const report = weeklyResult.data.report;
                console.log(`📊 Project: ${report.project.project_name}`);
                console.log(`📊 Total Tasks: ${report.metrics.totalTasks}`);
                console.log(`📊 Completed: ${report.metrics.completedTasks}`);
                console.log(`📊 Completion Rate: ${report.metrics.completionRate}%`);
            }
        }
    }

    console.log('\n🏆 SAMPLE DATA SEEDING COMPLETED!');
    console.log('='.repeat(50));
    console.log('Your database now has comprehensive test data for:');
    console.log('• Profile photos in Supabase Storage');
    console.log('• Multiple projects with realistic data');
    console.log('• Tasks with different statuses and priorities');
    console.log('• Project files and documents');
    console.log('• Holiday calendar entries');
    console.log('• Rich analytics and reporting data');
    console.log('\nYou can now test all API endpoints with meaningful data! 🚀');
}

// Main seeding function
async function seedDatabase() {
    console.log('🌱 SEEDING DATABASE WITH SAMPLE DATA');
    console.log('='.repeat(60));
    console.log(`Target API: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);

    if (CREATE_USERS) {
        console.log('🧪 USER CREATION MODE: Will create and verify additional sample users');
    } else {
        console.log('📋 STANDARD MODE: Will use existing test users only');
        console.log('💡 Use --create-users flag to create additional sample users');
    }

    try {
        await loginUsers();

        // Only create sample users if flag is provided
        if (CREATE_USERS) {
            await createSampleUsers();
        }

        await uploadProfilePhotos();
        await createProjects();
        await createTasks();
        await uploadSampleFiles();
        await createHolidays();
        await generateSummary();

    } catch (error) {
        console.error('\n💥 ERROR DURING SEEDING:', error.message);
        if (VERBOSE_MODE) {
            console.error('💥 FULL ERROR:', error);
        }
    }
}

// Run the seeding script
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };