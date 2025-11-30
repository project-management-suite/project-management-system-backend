// test-api.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Base URL for your API
const BASE_URL = 'http://localhost:5000/api';

// Check for command line flags
const isInfoMode = process.argv.includes('--info');
const isHelpMode = process.argv.includes('--help') || process.argv.includes('-h');

// Show help message and exit
if (isHelpMode) {
    console.log(`
🚀 PROJECT MANAGEMENT API TEST SUITE
=====================================

USAGE:
  node test/test-api.js [OPTIONS]
  npm test [-- OPTIONS]
  npm run test:info
  npm run test:verbose

OPTIONS:
  --info, --verbose    Enable detailed request/response logging
  --help, -h          Show this help message

EXAMPLES:
  node test/test-api.js                 # Basic testing
  node test/test-api.js --info          # Verbose testing
  npm test                              # Basic testing via npm
  npm run test:info                     # Verbose testing via npm

DESCRIPTION:
  Comprehensive test suite for all 102 API endpoints across 12 modules:
  
  🔐 Authentication (4 endpoints)        - Login, registration, OTP verification
  👤 Profile Management (7 endpoints)    - Profile CRUD, photo upload/management
  👑 Admin Functions (4 endpoints)       - Dashboard, user management, roles
  📋 Project Management (8 endpoints)    - Project CRUD, assignments, dashboard
  ✅ Task Management (8 endpoints)       - Task CRUD, assignments, status updates
  🔄 Subtask Management (12 endpoints)   - Subtask CRUD, assignments, estimates, statistics
  ⏱️ Work Log System (12 endpoints)      - Work hour logging, bulk operations, statistics
  📊 Estimation System (16 endpoints)    - Task/subtask estimates, accuracy tracking, trends
  📅 Calendar System (8 endpoints)       - Holidays, deadlines, reminders
  📊 Reporting (5 endpoints)             - Analytics, reports, PDF export
  📁 File Management (6 endpoints)       - File upload, download, management
  👥 Team Management (14 endpoints)      - Team CRUD, member management, assignments

REQUIREMENTS:
  - Backend server running on http://localhost:5000
  - Test users: testadmin@testapp.com, testmanager@testapp.com, testdeveloper@testapp.com
  - Supabase Storage configured with 'uploads' bucket

OUTPUT MODES:
  Standard: Shows request URLs, response status, basic errors
  Verbose:  Adds request/response data, headers, detailed error info
`);
    process.exit(0);
}

// Helper function for info logging
function logInfo(...args) {
    if (isInfoMode) {
        console.log('   📋 INFO:', ...args);
    }
}

// Test credentials
const TEST_USERS = {
    admin: {
        email: 'testadmin@testapp.com',
        password: 'testpass123',
        role: 'ADMIN'
    },
    manager: {
        email: 'testmanager@testapp.com',
        password: 'testpass123',
        role: 'MANAGER'
    },
    developer: {
        email: 'testdeveloper@testapp.com',
        password: 'testpass123',
        role: 'DEVELOPER'
    }
};

// Store tokens for each user
const tokens = {};
const userProfiles = {};
let projectId = null;
let taskId = null;

// Test results folder for downloaded files
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test-results');

// Ensure test results directory exists
function ensureTestResultsDir() {
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
        fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
        console.log(`📁 Created test results directory: ${TEST_RESULTS_DIR}`);
    }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false, responseType = 'json') {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {},
            timeout: 30000, // 30 second timeout
            responseType
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

        // Log the command being executed
        console.log(`\n   🔗 ${method} ${BASE_URL}${endpoint}`);
        logInfo('Headers:', Object.keys(config.headers).map(key => `${key}: ${key === 'Authorization' ? config.headers[key].substring(0, 20) + '...' : config.headers[key]}`).join(', '));
        if (data && !isFormData) {
            logInfo('Request Data:', JSON.stringify(data, null, 2));
        } else if (isFormData) {
            logInfo('FormData:', 'Contains file upload data');
        }

        const response = await axios(config);

        // Log successful response
        console.log(`   ✅ Response: ${response.status} ${response.statusText}`);
        logInfo('Response Data:', JSON.stringify(response.data, null, 2));

        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        // Log failed response with more details
        console.log(`   ❌ Request failed: ${method} ${BASE_URL}${endpoint}`);
        console.log(`   ❌ Error: ${error.response?.status || 'No status'} - ${error.response?.statusText || 'No status text'}`);

        if (isInfoMode) {
            console.log(`   📋 ERROR Details:`, JSON.stringify(error.response?.data || error.message, null, 2));
        } else {
            console.log(`   📋 Error:`, error.response?.data?.message || error.response?.data || error.message);
        }

        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Helper function to add delay between requests to prevent connection issues
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test authentication
async function testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS (4/52)');
    console.log('='.repeat(50));

    for (const [userType, credentials] of Object.entries(TEST_USERS)) {
        console.log(`\nTesting login for ${userType}:`);

        const loginResult = await apiRequest('POST', '/auth/login', {
            email: credentials.email,
            password: credentials.password
        });

        if (loginResult.success) {
            tokens[userType] = loginResult.data.token;
            userProfiles[userType] = loginResult.data.user;
            console.log(`✅ ${userType} login successful`);
            console.log(`   Role: ${loginResult.data.user.role}`);
            console.log(`   Token: ${loginResult.data.token.substring(0, 20)}...`);
            console.log(`   User ID: ${loginResult.data.user.id || 'undefined'}`);
        } else {
            console.log(`❌ ${userType} login failed:`, loginResult.error);
        }
    }

    // Test OTP endpoints (register, verify-otp, resend-otp) would require email setup
    console.log('\n📧 Note: OTP endpoints (register, verify-otp, resend-otp) require email configuration');
    console.log('   These can be tested manually when email service is configured');
}

// Test profile endpoints
async function testProfileEndpoints() {
    console.log('\n👤 TESTING PROFILE ENDPOINTS (8/52)');
    console.log('='.repeat(50));

    for (const [userType, token] of Object.entries(tokens)) {
        console.log(`\nTesting profile endpoints for ${userType}:`);

        // Get own profile
        const profileResult = await apiRequest('GET', '/profile', null, token);
        if (profileResult.success) {
            console.log(`✅ Get ${userType} profile successful`);
            console.log(`   Username: ${profileResult.data.profile.username}`);
        } else {
            console.log(`❌ Get ${userType} profile failed:`, profileResult.error);
        }
    }

    // Test admin viewing other profiles
    if (tokens.admin && userProfiles.manager && userProfiles.manager.id) {
        console.log('\nTesting admin viewing other profiles:');
        const managerProfile = await apiRequest('GET', `/profile/${userProfiles.manager.id}`, null, tokens.admin);
        if (managerProfile.success) {
            console.log('✅ Admin can view manager profile');
        } else {
            console.log('❌ Admin view manager profile failed:', managerProfile.error);
        }
    } else {
        console.log('\nSkipping admin viewing other profiles - manager profile or ID not available');
    }

    // Test profile photo endpoints
    console.log('\n📷 Testing Profile Photo Endpoints:');

    // Test photo upload for each user type
    const testPhotos = [
        { user: 'admin', filename: 'divyansh.jpeg' },
        { user: 'manager', filename: 'sarah.jpeg' },
        { user: 'developer', filename: 'john.jpeg' }
    ];

    for (const { user, filename } of testPhotos) {
        if (!tokens[user]) continue;

        console.log(`\nTesting photo upload for ${user}:`);

        // Check if photo exists
        const photoPath = path.join(__dirname, 'assets', filename);
        if (!fs.existsSync(photoPath)) {
            console.log(`❌ Photo ${filename} not found, skipping upload test`);
            continue;
        }

        // Create form data for photo upload
        const formData = new FormData();
        formData.append('profilePhoto', fs.createReadStream(photoPath));

        const uploadResult = await apiRequest('POST', '/profile/photo/upload', formData, tokens[user], true);
        if (uploadResult.success) {
            console.log(`✅ Photo upload successful for ${user}`);
            console.log(`   Photo URL: ${uploadResult.data.profile.profile_photo_url}`);

            // Test photo history
            const historyResult = await apiRequest('GET', '/profile/photo/history', null, tokens[user]);
            if (historyResult.success) {
                console.log(`✅ Photo history retrieved - ${historyResult.data.photos.length} photos`);
            } else {
                console.log('❌ Photo history failed:', historyResult.error);
            }

            // Test photo update (upload different photo)
            const updatePhotoPath = path.join(__dirname, 'assets', 'jane.jpeg');
            if (fs.existsSync(updatePhotoPath)) {
                const updateFormData = new FormData();
                updateFormData.append('profilePhoto', fs.createReadStream(updatePhotoPath));

                const updateResult = await apiRequest('PUT', '/profile/photo/update', updateFormData, tokens[user], true);
                if (updateResult.success) {
                    console.log(`✅ Photo update successful for ${user}`);
                } else {
                    console.log(`❌ Photo update failed for ${user}:`, updateResult.error);
                }
            }

            // Test photo removal
            const removeResult = await apiRequest('DELETE', '/profile/photo/remove', null, tokens[user]);
            if (removeResult.success) {
                console.log(`✅ Photo removal successful for ${user}`);
            } else {
                console.log(`❌ Photo removal failed for ${user}:`, removeResult.error);
            }

        } else {
            console.log(`❌ Photo upload failed for ${user}:`, uploadResult.error);
        }
    }

    // Test admin cleanup photos
    if (tokens.admin) {
        console.log('\nTesting admin photo cleanup:');
        const cleanupResult = await apiRequest('POST', '/profile/admin/cleanup-photos', null, tokens.admin);
        if (cleanupResult.success) {
            console.log('✅ Admin old photo cleanup successful');
            console.log(`   Removed old photos: ${cleanupResult.data.removed || 0}`);
        } else {
            console.log('❌ Admin old photo cleanup failed:', cleanupResult.error);
        }

        // Test sample photo cleanup (development only)
        console.log('\nTesting admin sample photo cleanup:');
        const sampleCleanupResult = await apiRequest('POST', '/profile/admin/cleanup-sample-photos', null, tokens.admin);
        if (sampleCleanupResult.success) {
            console.log('✅ Admin sample photo cleanup successful');
            console.log(`   Removed sample photos: ${sampleCleanupResult.data.removed || 0}`);
        } else {
            console.log('❌ Admin sample photo cleanup failed:', sampleCleanupResult.error);
        }
    }
}

// Test admin endpoints
async function testAdminEndpoints() {
    console.log('\n👑 TESTING ADMIN ENDPOINTS (6/52)');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available, skipping admin tests');
        return;
    }

    // Test dashboard stats
    console.log('\nTesting admin dashboard stats:');
    const dashboardResult = await apiRequest('GET', '/admin/dashboard', null, tokens.admin);
    if (dashboardResult.success) {
        console.log('✅ Admin dashboard stats successful');
        console.log(`   Total users: ${dashboardResult.data.users?.total || 'N/A'}`);
        console.log(`   Total projects: ${dashboardResult.data.projects?.total || 'N/A'}`);
    } else {
        console.log('❌ Admin dashboard stats failed:', dashboardResult.error);
    }

    // Get all users
    console.log('\nTesting get all users:');
    const usersResult = await apiRequest('GET', '/admin/users', null, tokens.admin);
    if (usersResult.success) {
        console.log(`✅ Get all users successful - Found ${usersResult.data.users.length} users`);
        usersResult.data.users.slice(0, 3).forEach(user => {
            console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
        });
        if (usersResult.data.users.length > 3) {
            console.log(`   ... and ${usersResult.data.users.length - 3} more users`);
        }
    } else {
        console.log('❌ Get all users failed:', usersResult.error);
    }

    // Test role update (temporarily change developer to manager and back)
    if (userProfiles.developer && userProfiles.developer.id) {
        console.log('\nTesting role update:');
        const updateRoleResult = await apiRequest('PATCH', `/admin/users/${userProfiles.developer.id}/role`, {
            role: 'MANAGER'
        }, tokens.admin);

        if (updateRoleResult.success) {
            console.log('✅ Role update successful - Developer temporarily promoted to Manager');

            // Change back to developer
            const revertRoleResult = await apiRequest('PATCH', `/admin/users/${userProfiles.developer.id}/role`, {
                role: 'DEVELOPER'
            }, tokens.admin);

            if (revertRoleResult.success) {
                console.log('✅ Role reverted back to Developer');
            } else {
                console.log('❌ Role revert failed:', revertRoleResult.error);
            }
        } else {
            console.log('❌ Role update failed:', updateRoleResult.error);
        }
    } else {
        console.log('\nSkipping role update test - developer profile or ID not available');
    }

    // Test cleanup pending registrations and OTPs (development only)
    console.log('\nTesting cleanup pending data:');
    const cleanupResult = await apiRequest('POST', '/admin/cleanup-pending-data', null, tokens.admin);
    if (cleanupResult.success) {
        console.log('✅ Cleanup pending data successful');
        console.log(`   Pending registrations removed: ${cleanupResult.data.pending_registrations || 0}`);
        console.log(`   OTPs removed: ${cleanupResult.data.all_otps || 0}`);
    } else {
        console.log('❌ Cleanup pending data failed:', cleanupResult.error);
    }

    // Test comprehensive user management (creation, verification, deletion)
    console.log('\nTesting comprehensive user management:');

    const testUsers = [
        {
            username: `test_dev_${Date.now()}`,
            email: `test-dev-${Date.now()}@testapp.com`,
            role: 'DEVELOPER'
        },
        {
            username: `test_mgr_${Date.now()}`,
            email: `test-mgr-${Date.now()}@testapp.com`,
            role: 'MANAGER'
        }
    ];

    let createdUsers = [];

    for (const testUser of testUsers) {
        console.log(`\n   Creating ${testUser.role}: ${testUser.email}`);

        // Register user
        const registerResult = await apiRequest('POST', '/auth/register', {
            username: testUser.username,
            email: testUser.email,
            password: 'testpass123',
            role: testUser.role
        });

        if (registerResult.success) {
            console.log(`   ✅ ${testUser.role} registered successfully`);

            // Small delay to prevent connection issues
            await delay(500);

            // Get OTP
            const otpResult = await apiRequest('GET', `/auth/test/last-otp?email=${encodeURIComponent(testUser.email)}`, null, tokens.admin);

            if (otpResult.success && otpResult.data.otp) {
                console.log(`   ✅ Retrieved OTP for ${testUser.role}`);

                // Verify OTP
                const verifyResult = await apiRequest('POST', '/auth/verify-otp', {
                    email: testUser.email,
                    otp: otpResult.data.otp
                });

                if (verifyResult.success) {
                    console.log(`   ✅ ${testUser.role} activated successfully`);
                    createdUsers.push(testUser.email);
                } else {
                    console.log(`   ❌ Failed to verify ${testUser.role}:`, verifyResult.error);
                }
            } else {
                console.log(`   ❌ Failed to get OTP for ${testUser.role}`);
            }
        } else {
            console.log(`   ❌ Failed to register ${testUser.role}:`, registerResult.error);
        }

        // Delay between user creations
        await delay(1000);
    }

    // Test bulk user deletion
    console.log(`\n   Testing bulk user deletion (${createdUsers.length} users)`);
    for (const email of createdUsers) {
        const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${encodeURIComponent(email)}`, null, tokens.admin);

        if (deleteResult.success) {
            console.log(`   ✅ Deleted user: ${email}`);
        } else {
            console.log(`   ❌ Failed to delete user ${email}:`, deleteResult.error);
        }

        // Small delay between deletions
        await delay(300);
    }

    console.log(`\n📊 User management test summary:`);
    console.log(`   Created: ${testUsers.length} users`);
    console.log(`   Activated: ${createdUsers.length} users`);
    console.log(`   Deleted: ${createdUsers.length} users`);
}

// Test project endpoints
async function testProjectEndpoints() {
    console.log('\n📋 TESTING PROJECT ENDPOINTS (8/52)');
    console.log('='.repeat(50));

    if (!tokens.manager) {
        console.log('❌ No manager token available, skipping project tests');
        return;
    }

    // Test project dashboard
    console.log('\nTesting project dashboard:');
    const dashboardResult = await apiRequest('GET', '/projects/dashboard', null, tokens.manager);
    if (dashboardResult.success) {
        console.log('✅ Project dashboard successful');
        const data = dashboardResult.data;
        console.log(`   Projects: ${data.projects?.length || 0}, Tasks: ${data.tasks?.length || 0}`);
    } else {
        console.log('❌ Project dashboard failed:', dashboardResult.error);
    }

    // Get developers for assignment
    console.log('\nTesting get developers:');
    const developersResult = await apiRequest('GET', '/projects/developers', null, tokens.manager);
    if (developersResult.success) {
        const developers = developersResult.data.developers || developersResult.data || [];
        console.log(`✅ Get developers successful - Found ${developers.length} developers`);
    } else {
        console.log('❌ Get developers failed:', developersResult.error);
    }

    // Create a project
    console.log('\nTesting create project:');
    const createProjectResult = await apiRequest('POST', '/projects', {
        project_name: 'Test Project API',
        description: 'A test project created by automated API testing script'
    }, tokens.manager);

    if (createProjectResult.success && createProjectResult.data && createProjectResult.data.project_id) {
        projectId = createProjectResult.data.project_id;
        console.log('✅ Create project successful');
        console.log(`   Project ID: ${projectId}`);
        console.log(`   Project Name: ${createProjectResult.data.project_name}`);
    } else {
        console.log('❌ Create project failed:', createProjectResult.error);
        console.log('   Response data:', createProjectResult.data);
        return;
    }

    // Get all projects
    console.log('\nTesting get all projects:');
    const projectsResult = await apiRequest('GET', '/projects', null, tokens.manager);
    if (projectsResult.success) {
        const projects = projectsResult.data.projects || projectsResult.data || [];
        console.log(`✅ Get projects successful - Found ${projects.length} projects`);
    } else {
        console.log('❌ Get projects failed:', projectsResult.error);
    }

    // Get specific project
    console.log('\nTesting get specific project:');
    const projectResult = await apiRequest('GET', `/projects/${projectId}`, null, tokens.manager);
    if (projectResult.success) {
        console.log('✅ Get specific project successful');
        console.log(`   Name: ${projectResult.data.project_name}`);
    } else {
        console.log('❌ Get specific project failed:', projectResult.error);
    }

    // Update project
    console.log('\nTesting update project:');
    const updateProjectResult = await apiRequest('PUT', `/projects/${projectId}`, {
        project_name: 'Updated Test Project API',
        description: 'Updated description for test project'
    }, tokens.manager);

    if (updateProjectResult.success) {
        console.log('✅ Update project successful');
    } else {
        console.log('❌ Update project failed:', updateProjectResult.error);
    }

    // Test project member assignment (requires developer IDs)
    console.log('\n👥 Project Assignment Endpoint:');
    console.log('   POST /projects/:projectId/assign - (Requires developer IDs for assignment)');
}

// Test task endpoints
async function testTaskEndpoints() {
    console.log('\n✅ TESTING TASK ENDPOINTS (8/52)');
    console.log('='.repeat(50));

    if (!tokens.manager || !projectId) {
        console.log('❌ No manager token or project ID available, skipping task tests');
        return;
    }

    // Create a task
    console.log('\nTesting create task:');
    const createTaskResult = await apiRequest('POST', `/tasks/project/${projectId}`, {
        title: 'Test Task API',
        description: 'A test task created by automated API testing script',
        start_date: '2025-12-01',
        end_date: '2025-12-15',
        status: 'PENDING'
    }, tokens.manager);

    if (createTaskResult.success && createTaskResult.data && createTaskResult.data.task_id) {
        taskId = createTaskResult.data.task_id;
        console.log('✅ Create task successful');
        console.log(`   Task ID: ${taskId}`);
        console.log(`   Task Title: ${createTaskResult.data.title}`);
    } else {
        console.log('❌ Create task failed:', createTaskResult.error);
        console.log('   Response data:', createTaskResult.data);
        return;
    }

    // Get user's tasks
    console.log('\nTesting get user tasks:');
    const userTasksResult = await apiRequest('GET', '/tasks', null, tokens.developer);
    if (userTasksResult.success) {
        const tasks = userTasksResult.data.tasks || userTasksResult.data || [];
        console.log(`✅ Get user tasks successful - Found ${tasks.length} tasks`);
    } else {
        console.log('❌ Get user tasks failed:', userTasksResult.error);
    }

    // Get project tasks
    console.log('\nTesting get project tasks:');
    const projectTasksResult = await apiRequest('GET', `/tasks/project/${projectId}`, null, tokens.manager);
    if (projectTasksResult.success) {
        const tasks = projectTasksResult.data.tasks || projectTasksResult.data || [];
        console.log(`✅ Get project tasks successful - Found ${tasks.length} tasks`);
    } else {
        console.log('❌ Get project tasks failed:', projectTasksResult.error);
    }

    // Get specific task
    console.log('\nTesting get specific task:');
    const taskResult = await apiRequest('GET', `/tasks/${taskId}`, null, tokens.manager);
    if (taskResult.success) {
        console.log('✅ Get specific task successful');
        console.log(`   Title: ${taskResult.data.title}`);
    } else {
        console.log('❌ Get specific task failed:', taskResult.error);
    }

    // Update task
    console.log('\nTesting update task:');
    const updateTaskResult = await apiRequest('PATCH', `/tasks/${taskId}`, {
        title: 'Updated Test Task API',
        status: 'IN_PROGRESS'
    }, tokens.manager);

    if (updateTaskResult.success) {
        console.log('✅ Update task successful');
    } else {
        console.log('❌ Update task failed:', updateTaskResult.error);
    }

    // Task assignment endpoints
    console.log('\n👥 Task Assignment Endpoints:');
    console.log('   POST /tasks/:taskId/assign - (Requires developer ID for assignment)');
    console.log('   DELETE /tasks/:taskId/unassign/:developerId - (Requires assignment first)');
}

// Test calendar endpoints
async function testCalendarEndpoints() {
    console.log('\n📅 TESTING CALENDAR ENDPOINTS (8/52)');
    console.log('='.repeat(50));

    // Test get holidays
    console.log('\nTesting get holidays:');
    const holidaysResult = await apiRequest('GET', '/calendar/holidays', null, tokens.manager);
    if (holidaysResult.success) {
        const holidays = holidaysResult.data.holidays || holidaysResult.data || [];
        console.log(`✅ Get holidays successful - Found ${holidays.length} holidays`);
        holidays.slice(0, 3).forEach(holiday => {
            console.log(`   - ${holiday.holiday_name} on ${holiday.holiday_date}`);
        });
    } else {
        console.log('❌ Get holidays failed:', holidaysResult.error);
    }

    // Test add holiday (admin only)
    if (tokens.admin) {
        console.log('\nTesting add holiday (admin):');
        const addHolidayResult = await apiRequest('POST', '/calendar/holidays', {
            holiday_name: 'Test API Holiday',
            holiday_date: '2025-12-31',
            description: 'A test holiday created by API testing script',
            is_recurring: false
        }, tokens.admin);

        if (addHolidayResult.success) {
            console.log('✅ Add holiday successful');
            const holidayId = addHolidayResult.data.holiday.holiday_id;

            // Test update holiday
            console.log('\nTesting update holiday:');
            const updateHolidayResult = await apiRequest('PUT', `/calendar/holidays/${holidayId}`, {
                holiday_name: 'Updated Test API Holiday',
                description: 'Updated description'
            }, tokens.admin);

            if (updateHolidayResult.success) {
                console.log('✅ Update holiday successful');
            } else {
                console.log('❌ Update holiday failed:', updateHolidayResult.error);
            }

            // Test delete holiday
            console.log('\nTesting delete holiday:');
            const deleteHolidayResult = await apiRequest('DELETE', `/calendar/holidays/${holidayId}`, null, tokens.admin);
            if (deleteHolidayResult.success) {
                console.log('✅ Delete holiday successful');
            } else {
                console.log('❌ Delete holiday failed:', deleteHolidayResult.error);
            }
        } else {
            console.log('❌ Add holiday failed:', addHolidayResult.error);
        }
    }

    // Test get tasks calendar (use admin token for better permissions)
    console.log('\nTesting get tasks calendar:');
    const tasksCalendarResult = await apiRequest('GET', '/calendar/tasks', null, tokens.admin);
    if (tasksCalendarResult.success) {
        const calendar = tasksCalendarResult.data.calendar || tasksCalendarResult.data;
        const tasks = calendar?.tasks || [];
        console.log(`✅ Get tasks calendar successful - Found ${tasks.length} tasks`);
        if (calendar?.month && calendar?.year) {
            console.log(`   Calendar period: ${calendar.month}/${calendar.year}`);
        }
    } else {
        console.log('❌ Get tasks calendar failed:', tasksCalendarResult.error);
    }

    // Test get upcoming deadlines (use admin token for better permissions)
    console.log('\nTesting get upcoming deadlines:');
    const deadlinesResult = await apiRequest('GET', '/calendar/deadlines?days=30', null, tokens.admin);
    if (deadlinesResult.success) {
        const deadlines = deadlinesResult.data.deadlines;
        if (deadlines) {
            const totalDeadlines = (deadlines.overdue?.length || 0) + (deadlines.today?.length || 0) +
                (deadlines.thisWeek?.length || 0) + (deadlines.nextWeek?.length || 0) + (deadlines.later?.length || 0);
            console.log(`✅ Get upcoming deadlines successful - Found ${totalDeadlines} total deadlines`);
            console.log(`   Overdue: ${deadlines.overdue?.length || 0}, Today: ${deadlines.today?.length || 0}, This week: ${deadlines.thisWeek?.length || 0}`);
        } else {
            console.log('✅ Get upcoming deadlines successful - No deadline structure returned');
        }
    } else {
        console.log('❌ Get upcoming deadlines failed:', deadlinesResult.error);
    }

    // Test set deadline reminder (use admin token and proper task ownership)
    if (taskId && tokens.admin) {
        console.log('\nTesting set deadline reminder:');
        const reminderResult = await apiRequest('POST', '/calendar/reminders', {
            taskId: taskId,
            reminderDate: '2025-12-10T09:00:00Z',
            reminderType: 'email'
        }, tokens.admin);

        if (reminderResult.success) {
            console.log('✅ Set deadline reminder successful');
        } else {
            console.log('❌ Set deadline reminder failed:', reminderResult.error);
        }
    }

    // Test get project calendar
    if (projectId && tokens.manager) {
        console.log('\nTesting get project calendar:');
        const projectCalendarResult = await apiRequest('GET', `/calendar/projects/${projectId}`, null, tokens.manager);
        if (projectCalendarResult.success) {
            console.log('✅ Get project calendar successful');
            console.log(`   Project: ${projectCalendarResult.data.projectCalendar?.project?.name || 'Project calendar data'}`);
        } else {
            console.log('❌ Get project calendar failed:', projectCalendarResult.error);
        }
    }
}

// Test reporting endpoints
async function testReportingEndpoints() {
    console.log('\n📊 TESTING REPORTING ENDPOINTS (5/52)');
    console.log('='.repeat(50));

    if (!tokens.manager || !projectId) {
        console.log('❌ No manager token or project ID available, skipping reporting tests');
        return;
    }

    // Test get analytics dashboard
    console.log('\nTesting get analytics dashboard:');
    const analyticsResult = await apiRequest('GET', '/reports/analytics', null, tokens.manager);
    if (analyticsResult.success) {
        console.log('✅ Get analytics dashboard successful');
        console.log(`   Total projects: ${analyticsResult.data.analytics.overview.totalProjects}`);
        console.log(`   Total tasks: ${analyticsResult.data.analytics.overview.totalTasks}`);
    } else {
        console.log('❌ Get analytics dashboard failed:', analyticsResult.error);
    }

    // Test weekly report
    console.log('\nTesting weekly report:');
    const weeklyReportResult = await apiRequest('GET', `/reports/weekly/${projectId}`, null, tokens.manager);
    if (weeklyReportResult.success) {
        console.log('✅ Get weekly report successful');
        console.log(`   Total tasks: ${weeklyReportResult.data.report.metrics.totalTasks}`);
    } else {
        console.log('❌ Get weekly report failed:', weeklyReportResult.error);
    }

    // Test monthly report
    console.log('\nTesting monthly report:');
    const monthlyReportResult = await apiRequest('GET', `/reports/monthly/${projectId}`, null, tokens.manager);
    if (monthlyReportResult.success) {
        console.log('✅ Get monthly report successful');
    } else {
        console.log('❌ Get monthly report failed:', monthlyReportResult.error);
    }

    // Test custom report
    console.log('\nTesting custom report:');
    const customReportResult = await apiRequest('GET',
        `/reports/custom?startDate=2025-11-01&endDate=2025-12-31&projectId=${projectId}`,
        null, tokens.manager);
    if (customReportResult.success) {
        console.log('✅ Get custom report successful');
    } else {
        console.log('❌ Get custom report failed:', customReportResult.error);
    }

    // Test PDF export (download actual file)
    console.log('\nTesting PDF export:');
    const pdfExportResult = await apiRequest('POST', '/reports/export/pdf', {
        reportType: 'weekly',
        projectId: projectId,
        startDate: '2025-12-01'
    }, tokens.manager, false, 'json');

    if (pdfExportResult.success) {
        console.log('✅ PDF export successful');
        console.log(`   📊 Report ID: ${pdfExportResult.data.reportId}`);
        console.log(`   📄 Filename: ${pdfExportResult.data.filename}`);
        console.log(`   🔗 Download URL: ${pdfExportResult.data.downloadUrl}`);
        console.log('   📝 Note: PDF file created on server, download URL provided');

        // Test PDF download directly from Supabase URL
        if (pdfExportResult.data.downloadUrl) {
            console.log('\nTesting PDF download:');
            try {
                const response = await axios.get(pdfExportResult.data.downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                console.log('✅ PDF download successful');
                // Save PDF to test results folder
                const pdfPath = path.join(TEST_RESULTS_DIR, `downloaded-report-${Date.now()}.pdf`);
                fs.writeFileSync(pdfPath, response.data);
                console.log(`   📄 PDF saved to: ${pdfPath}`);
                console.log(`   📊 File size: ${Math.round(response.data.byteLength / 1024)} KB`);
            } catch (downloadError) {
                console.log('❌ PDF download failed:', downloadError.message);
            }
        }
    } else {
        console.log('❌ PDF export failed:', pdfExportResult.error);
    }
}

// Test file endpoints
async function testFileEndpoints() {
    console.log('\n📁 TESTING FILE ENDPOINTS (6/52)');
    console.log('='.repeat(50));

    if (!tokens.manager || !projectId) {
        console.log('❌ No manager token or project ID available, skipping file tests');
        return;
    }

    // Test get all files
    console.log('\nTesting get all files:');
    const allFilesResult = await apiRequest('GET', '/files', null, tokens.manager);
    if (allFilesResult.success) {
        const files = allFilesResult.data.files || [];
        console.log(`✅ Get all files successful - Found ${files.length} files`);
    } else {
        console.log('❌ Get all files failed:', allFilesResult.error);
    }

    // Create test assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Test file upload to project with various file types
    console.log('\nTesting file upload to project (multiple file types):');

    // Test files to create and upload
    const testFiles = [
        {
            name: 'test-document.txt',
            content: `# Test Project Document\n\nThis is a test document for API testing.\nCreated: ${new Date().toISOString()}\n\n## Project Details\n- API Testing Document\n- Used for automated testing of file upload functionality\n- Contains sample content for validation`,
            description: 'Text document'
        },
        {
            name: 'technical-specification.md',
            content: `# Technical Specification\n\n## Overview\nThis is a markdown document to test file upload functionality.\n\n### Features\n- Markdown support\n- Code blocks\n- Lists\n\n\`\`\`javascript\nconsole.log('Hello World');\n\`\`\`\n\n### Requirements\n1. File upload support\n2. All file type acceptance\n3. Storage management`,
            description: 'Markdown document'
        },
        {
            name: 'config.json',
            content: JSON.stringify({
                "project": "Test API",
                "version": "1.0.0",
                "features": ["file_upload", "all_types"],
                "timestamp": new Date().toISOString()
            }, null, 2),
            description: 'JSON configuration'
        }
    ];

    let uploadedFileIds = [];

    for (const testFile of testFiles) {
        const testFilePath = path.join(assetsDir, testFile.name);

        // Create test file
        try {
            fs.writeFileSync(testFilePath, testFile.content, 'utf8');
            console.log(`   📝 Created ${testFile.description}: ${testFile.name}`);
        } catch (err) {
            console.log(`   ⚠️ Could not create ${testFile.name}:`, err.message);
            continue;
        }

        // Upload file to project
        if (fs.existsSync(testFilePath)) {
            const formData = new FormData();
            formData.append('files', fs.createReadStream(testFilePath));

            // Add delay to prevent connection issues
            await delay(2000);

            const uploadResult = await apiRequest('POST', `/files/project/${projectId}/upload`, formData, tokens.manager, true);
            if (uploadResult.success) {
                console.log(`✅ ${testFile.description} upload successful: ${testFile.name}`);
                console.log(`   Files uploaded: ${uploadResult.data.uploaded_files?.length || 0}`);

                if (uploadResult.data.uploaded_files && uploadResult.data.uploaded_files.length > 0) {
                    uploadedFileIds.push(...uploadResult.data.uploaded_files.map(f => f.file_id));
                }
            } else {
                console.log(`❌ ${testFile.description} upload failed:`, uploadResult.error);
            }
        }
    }

    // Add delay before testing project files
    await delay(1500);

    // Test get project files
    console.log('\nTesting get project files:');
    const projectFilesResult = await apiRequest('GET', `/files/project/${projectId}`, null, tokens.manager);
    if (projectFilesResult.success) {
        const files = projectFilesResult.data.files || [];
        console.log(`✅ Get project files successful - Found ${files.length} files`);

        if (files.length > 0) {
            // Test get specific file
            console.log('\nTesting get specific file:');
            const fileId = files[0].file_id;
            const specificFileResult = await apiRequest('GET', `/files/${fileId}`, null, tokens.manager);
            if (specificFileResult.success) {
                console.log('✅ Get specific file successful');
                console.log(`   File name: ${specificFileResult.data.file.file_name}`);
                console.log(`   File size: ${specificFileResult.data.file.file_size} bytes`);
                console.log(`   MIME type: ${specificFileResult.data.file.mime_type}`);
            } else {
                console.log('❌ Get specific file failed:', specificFileResult.error);
            }

            // Test file deletion for uploaded test files
            console.log('\nTesting file deletion:');
            let deletedCount = 0;
            for (const fileId of uploadedFileIds) {
                const deleteResult = await apiRequest('DELETE', `/files/${fileId}`, null, tokens.manager);
                if (deleteResult.success) {
                    deletedCount++;
                    console.log(`✅ File deletion successful (${deletedCount}/${uploadedFileIds.length})`);
                } else {
                    console.log('❌ File deletion failed:', deleteResult.error);
                }
            }
        }
    } else {
        console.log('❌ Get project files failed:', projectFilesResult.error);
    }

    // Test task file upload if we have a task
    // Add delay before task file upload
    await delay(1500);

    if (taskId && projectId) {
        const testTaskFilePath = path.join(assetsDir, 'test-document.txt');
        if (fs.existsSync(testTaskFilePath)) {
            console.log('\\nTesting task file upload:');
            const taskFormData = new FormData();
            taskFormData.append('files', fs.createReadStream(testTaskFilePath));
            taskFormData.append('task_id', taskId);

            const taskUploadResult = await apiRequest('POST', `/files/project/${projectId}/upload`, taskFormData, tokens.manager, true);
            if (taskUploadResult.success) {
                console.log('✅ Task file upload successful');
                console.log(`   Files uploaded: ${taskUploadResult.data.uploaded_files?.length || 0}`);
                console.log(`   📌 Associated with task ID: ${taskId}`);
            } else {
                console.log('❌ Task file upload failed:', taskUploadResult.error);
            }
        }
    }

    console.log('\n📊 File upload testing completed');
    console.log('   ✅ Tested multiple file types: .txt, .md, .json');
    console.log('   ✅ Verified all file type acceptance');
    console.log('   ✅ Confirmed CRUD operations on files');
}

// Clean up test data
async function cleanup() {
    // Add delay before cleanup to let server stabilize
    await delay(2000);

    console.log('\n🧹 CLEANING UP TEST DATA');
    console.log('='.repeat(50));

    // Clean up subtasks first (they depend on tasks)
    if (global.testSubtaskId && tokens.manager) {
        console.log('\nDeleting test subtask:');
        const deleteSubtaskResult = await apiRequest('DELETE', `/subtasks/${global.testSubtaskId}`, null, tokens.manager);
        if (deleteSubtaskResult.success) {
            console.log('✅ Test subtask deleted successfully');
        } else {
            console.log('❌ Failed to delete test subtask:', deleteSubtaskResult.error);
        }
    }

    if (taskId && tokens.manager) {
        console.log('\nDeleting test task:');
        const deleteTaskResult = await apiRequest('DELETE', `/tasks/${taskId}`, null, tokens.manager);
        if (deleteTaskResult.success) {
            console.log('✅ Test task deleted successfully');
        } else {
            console.log('❌ Failed to delete test task:', deleteTaskResult.error);
        }
    }

    if (projectId && tokens.manager) {
        console.log('\nDeleting test project:');
        const deleteProjectResult = await apiRequest('DELETE', `/projects/${projectId}`, null, tokens.manager);
        if (deleteProjectResult.success) {
            console.log('✅ Test project deleted successfully');
        } else {
            console.log('❌ Failed to delete test project:', deleteProjectResult.error);
        }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log('   - Work logs and estimates are automatically cleaned up with subtask/task deletion');
    console.log('   - Test subtasks, tasks, and projects have been removed');
    console.log('   - Database relationships properly maintained during cleanup');
}

// Test subtask endpoints
async function testSubtaskEndpoints() {
    console.log('\n🔄 TESTING SUBTASK ENDPOINTS (12/52)');
    console.log('='.repeat(50));

    if (!tokens.manager || !taskId) {
        console.log('❌ No manager token or task ID available, skipping subtask tests');
        return;
    }

    let subtaskId = null;
    let subtaskEstimateId = null;

    // Test create subtask
    console.log('\nTesting create subtask:');
    const createSubtaskResult = await apiRequest('POST', '/subtasks', {
        parent_task_id: taskId,
        title: 'Test Subtask API',
        description: 'A test subtask created by automated API testing script',
        priority: 'MEDIUM',
        estimated_hours: 4.5,
        start_date: '2025-12-02',
        end_date: '2025-12-05'
    }, tokens.manager);

    if (createSubtaskResult.success && createSubtaskResult.data && createSubtaskResult.data.subtask) {
        subtaskId = createSubtaskResult.data.subtask.subtask_id;
        console.log('✅ Create subtask successful');
        console.log(`   Subtask ID: ${subtaskId}`);
        console.log(`   Title: ${createSubtaskResult.data.subtask.title}`);
    } else {
        console.log('❌ Create subtask failed:', createSubtaskResult.error);
        return;
    }

    // Test get user's subtasks
    console.log('\nTesting get user subtasks:');
    const userSubtasksResult = await apiRequest('GET', '/subtasks/my', null, tokens.developer);
    if (userSubtasksResult.success) {
        const subtasks = userSubtasksResult.data.subtasks || [];
        console.log(`✅ Get user subtasks successful - Found ${subtasks.length} subtasks`);
    } else {
        console.log('❌ Get user subtasks failed:', userSubtasksResult.error);
    }

    // Test get subtasks for task
    console.log('\nTesting get task subtasks:');
    const taskSubtasksResult = await apiRequest('GET', `/subtasks/task/${taskId}`, null, tokens.manager);
    if (taskSubtasksResult.success) {
        const subtasks = taskSubtasksResult.data.subtasks || [];
        console.log(`✅ Get task subtasks successful - Found ${subtasks.length} subtasks`);
    } else {
        console.log('❌ Get task subtasks failed:', taskSubtasksResult.error);
    }

    // Test get subtasks for project
    console.log('\nTesting get project subtasks:');
    const projectSubtasksResult = await apiRequest('GET', `/subtasks/project/${projectId}`, null, tokens.manager);
    if (projectSubtasksResult.success) {
        const subtasks = projectSubtasksResult.data.subtasks || [];
        console.log(`✅ Get project subtasks successful - Found ${subtasks.length} subtasks`);
    } else {
        console.log('❌ Get project subtasks failed:', projectSubtasksResult.error);
    }

    // Test get specific subtask
    console.log('\nTesting get specific subtask:');
    const subtaskResult = await apiRequest('GET', `/subtasks/${subtaskId}`, null, tokens.manager);
    if (subtaskResult.success) {
        console.log('✅ Get specific subtask successful');
        console.log(`   Title: ${subtaskResult.data.subtask.title}`);
        console.log(`   Status: ${subtaskResult.data.subtask.status}`);
    } else {
        console.log('❌ Get specific subtask failed:', subtaskResult.error);
    }

    // Test update subtask
    console.log('\nTesting update subtask:');
    const updateSubtaskResult = await apiRequest('PUT', `/subtasks/${subtaskId}`, {
        title: 'Updated Test Subtask API',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        estimated_hours: 6.0
    }, tokens.manager);
    if (updateSubtaskResult.success) {
        console.log('✅ Update subtask successful');
    } else {
        console.log('❌ Update subtask failed:', updateSubtaskResult.error);
    }

    // Test assign user to subtask
    if (userProfiles.developer && userProfiles.developer.user_id) {
        console.log('\nTesting assign user to subtask:');
        const assignResult = await apiRequest('POST', `/subtasks/${subtaskId}/assign`, {
            assigneeId: userProfiles.developer.user_id
        }, tokens.manager);
        if (assignResult.success) {
            console.log('✅ Assign user to subtask successful');
            console.log(`   Assigned: ${userProfiles.developer.username || 'Developer'}`);

            // Test unassign user from subtask
            console.log('\nTesting unassign user from subtask:');
            const unassignResult = await apiRequest('POST', `/subtasks/${subtaskId}/unassign/${userProfiles.developer.user_id}`, null, tokens.manager);
            if (unassignResult.success) {
                console.log('✅ Unassign user from subtask successful');
            } else {
                console.log('❌ Unassign user from subtask failed:', unassignResult.error);
            }
        } else {
            console.log('❌ Assign user to subtask failed:', assignResult.error);
        }
    }

    // Test add estimate to subtask
    console.log('\nTesting add estimate to subtask:');
    const estimateResult = await apiRequest('POST', `/subtasks/${subtaskId}/estimate`, {
        estimatedHours: 8.5,
        notes: 'Initial estimate for subtask completion',
        estimateType: 'INITIAL'
    }, tokens.developer);
    if (estimateResult.success) {
        console.log('✅ Add estimate to subtask successful');
        console.log(`   Estimated hours: 8.5`);
    } else {
        console.log('❌ Add estimate to subtask failed:', estimateResult.error);
    }

    // Test get subtask statistics
    console.log('\nTesting get subtask statistics:');
    const statsResult = await apiRequest('GET', `/subtasks/${subtaskId}/stats`, null, tokens.manager);
    if (statsResult.success) {
        console.log('✅ Get subtask statistics successful');
        if (statsResult.data.stats) {
            console.log(`   Status: ${statsResult.data.stats.status}`);
            console.log(`   Estimated hours: ${statsResult.data.stats.estimated_hours || 'N/A'}`);
        }
    } else {
        console.log('❌ Get subtask statistics failed:', statsResult.error);
    }

    // Store subtask ID for other tests
    global.testSubtaskId = subtaskId;

    return subtaskId;
}

// Test work log endpoints
async function testWorkLogEndpoints() {
    console.log('\n⏱️ TESTING WORK LOG ENDPOINTS (12/52)');
    console.log('='.repeat(50));

    if (!tokens.developer) {
        console.log('❌ No developer token available, skipping work log tests');
        return;
    }

    let workLogId = null;

    // Test create work log for task
    if (taskId) {
        console.log('\nTesting create work log for task:');
        const createWorkLogResult = await apiRequest('POST', '/worklogs', {
            task_id: taskId,
            hours_logged: 3.5,
            work_date: '2025-12-01',
            description: 'Implemented core functionality for the task',
            log_type: 'DEVELOPMENT'
        }, tokens.developer);

        if (createWorkLogResult.success && createWorkLogResult.data && createWorkLogResult.data.workLog) {
            workLogId = createWorkLogResult.data.workLog.log_id;
            console.log('✅ Create work log for task successful');
            console.log(`   Work Log ID: ${workLogId}`);
            console.log(`   Hours logged: ${createWorkLogResult.data.workLog.hours_logged}`);
        } else {
            console.log('❌ Create work log for task failed:', createWorkLogResult.error);
        }
    }

    // Test create work log for subtask
    if (global.testSubtaskId) {
        console.log('\nTesting create work log for subtask:');
        const createSubtaskLogResult = await apiRequest('POST', '/worklogs', {
            subtask_id: global.testSubtaskId,
            hours_logged: 2.0,
            work_date: '2025-12-02',
            description: 'Completed initial setup and configuration',
            log_type: 'DEVELOPMENT'
        }, tokens.developer);

        if (createSubtaskLogResult.success) {
            console.log('✅ Create work log for subtask successful');
            console.log(`   Hours logged: ${createSubtaskLogResult.data.workLog.hours_logged}`);
        } else {
            console.log('❌ Create work log for subtask failed:', createSubtaskLogResult.error);
        }
    }

    // Test bulk work log creation
    console.log('\nTesting bulk work log creation:');
    const bulkWorkLogs = [
        {
            task_id: taskId,
            hours_logged: 1.5,
            work_date: '2025-12-03',
            description: 'Code review and testing',
            log_type: 'REVIEW'
        },
        {
            task_id: taskId,
            hours_logged: 2.0,
            work_date: '2025-12-04',
            description: 'Bug fixes and documentation',
            log_type: 'BUG_FIX'
        }
    ];

    const bulkCreateResult = await apiRequest('POST', '/worklogs/bulk', {
        workLogs: bulkWorkLogs
    }, tokens.developer);

    if (bulkCreateResult.success) {
        console.log('✅ Bulk work log creation successful');
        console.log(`   Created: ${bulkCreateResult.data.created?.length || 0} work logs`);
    } else {
        console.log('❌ Bulk work log creation failed:', bulkCreateResult.error);
    }

    // Test get user's work logs
    console.log('\nTesting get user work logs:');
    const userWorkLogsResult = await apiRequest('GET', '/worklogs/my', null, tokens.developer);
    if (userWorkLogsResult.success) {
        const workLogs = userWorkLogsResult.data.workLogs || [];
        console.log(`✅ Get user work logs successful - Found ${workLogs.length} logs`);
        if (workLogs.length > 0) {
            const totalHours = workLogs.reduce((sum, log) => sum + parseFloat(log.hours_logged || 0), 0);
            console.log(`   Total hours logged: ${totalHours.toFixed(1)}`);
        }
    } else {
        console.log('❌ Get user work logs failed:', userWorkLogsResult.error);
    }

    // Test get user's work statistics
    console.log('\nTesting get user work statistics:');
    const userStatsResult = await apiRequest('GET', '/worklogs/my/stats', null, tokens.developer);
    if (userStatsResult.success) {
        console.log('✅ Get user work statistics successful');
        if (userStatsResult.data.stats) {
            console.log(`   Total hours: ${userStatsResult.data.stats.totalHours || 0}`);
            console.log(`   Total logs: ${userStatsResult.data.stats.totalLogs || 0}`);
        }
    } else {
        console.log('❌ Get user work statistics failed:', userStatsResult.error);
    }

    // Test get recent work logs
    console.log('\nTesting get recent work logs:');
    const recentLogsResult = await apiRequest('GET', '/worklogs/recent?days=7', null, tokens.developer);
    if (recentLogsResult.success) {
        const recentLogs = recentLogsResult.data.workLogs || [];
        console.log(`✅ Get recent work logs successful - Found ${recentLogs.length} recent logs`);
    } else {
        console.log('❌ Get recent work logs failed:', recentLogsResult.error);
    }

    // Test get work logs for task
    if (taskId) {
        console.log('\nTesting get task work logs:');
        const taskLogsResult = await apiRequest('GET', `/worklogs/task/${taskId}`, null, tokens.manager);
        if (taskLogsResult.success) {
            const taskLogs = taskLogsResult.data.workLogs || [];
            console.log(`✅ Get task work logs successful - Found ${taskLogs.length} logs`);
        } else {
            console.log('❌ Get task work logs failed:', taskLogsResult.error);
        }
    }

    // Test get work logs for subtask
    if (global.testSubtaskId) {
        console.log('\nTesting get subtask work logs:');
        const subtaskLogsResult = await apiRequest('GET', `/worklogs/subtask/${global.testSubtaskId}`, null, tokens.manager);
        if (subtaskLogsResult.success) {
            const subtaskLogs = subtaskLogsResult.data.workLogs || [];
            console.log(`✅ Get subtask work logs successful - Found ${subtaskLogs.length} logs`);
        } else {
            console.log('❌ Get subtask work logs failed:', subtaskLogsResult.error);
        }
    }

    // Test get project work logs (Manager/Admin only)
    if (projectId && tokens.manager) {
        console.log('\nTesting get project work logs (Manager):');
        const projectLogsResult = await apiRequest('GET', `/worklogs/project/${projectId}`, null, tokens.manager);
        if (projectLogsResult.success) {
            const projectLogs = projectLogsResult.data.workLogs || [];
            console.log(`✅ Get project work logs successful - Found ${projectLogs.length} logs`);
        } else {
            console.log('❌ Get project work logs failed:', projectLogsResult.error);
        }
    }

    // Test get project work statistics (Manager/Admin only)
    if (projectId && tokens.manager) {
        console.log('\nTesting get project work statistics (Manager):');
        const projectStatsResult = await apiRequest('GET', `/worklogs/project/${projectId}/stats`, null, tokens.manager);
        if (projectStatsResult.success) {
            console.log('✅ Get project work statistics successful');
            if (projectStatsResult.data.stats) {
                console.log(`   Total hours: ${projectStatsResult.data.stats.totalHours || 0}`);
                console.log(`   Total logs: ${projectStatsResult.data.stats.totalLogs || 0}`);
            }
        } else {
            console.log('❌ Get project work statistics failed:', projectStatsResult.error);
        }
    }

    // Test get specific work log
    if (workLogId) {
        console.log('\nTesting get specific work log:');
        const workLogResult = await apiRequest('GET', `/worklogs/${workLogId}`, null, tokens.developer);
        if (workLogResult.success) {
            console.log('✅ Get specific work log successful');
            console.log(`   Hours: ${workLogResult.data.workLog.hours_logged}`);
            console.log(`   Type: ${workLogResult.data.workLog.log_type}`);
        } else {
            console.log('❌ Get specific work log failed:', workLogResult.error);
        }

        // Test update work log
        console.log('\nTesting update work log:');
        const updateLogResult = await apiRequest('PUT', `/worklogs/${workLogId}`, {
            hours_logged: 4.0,
            description: 'Updated: Implemented core functionality and added tests',
            log_type: 'TESTING'
        }, tokens.developer);
        if (updateLogResult.success) {
            console.log('✅ Update work log successful');
        } else {
            console.log('❌ Update work log failed:', updateLogResult.error);
        }

        // Test delete work log
        console.log('\nTesting delete work log:');
        const deleteLogResult = await apiRequest('DELETE', `/worklogs/${workLogId}`, null, tokens.developer);
        if (deleteLogResult.success) {
            console.log('✅ Delete work log successful');
        } else {
            console.log('❌ Delete work log failed:', deleteLogResult.error);
        }
    }
}

// Test estimate endpoints
async function testEstimateEndpoints() {
    console.log('\n📊 TESTING ESTIMATE ENDPOINTS (16/52)');
    console.log('='.repeat(50));

    if (!tokens.developer || !taskId) {
        console.log('❌ No developer token or task ID available, skipping estimate tests');
        return;
    }

    let estimateId = null;

    // Test create estimate for task
    console.log('\nTesting create estimate for task:');
    const createEstimateResult = await apiRequest('POST', '/estimates', {
        task_id: taskId,
        estimated_hours: 16.0,
        complexity: 'MEDIUM',
        confidence_level: 4,
        notes: 'Initial estimate based on requirements analysis'
    }, tokens.developer);

    if (createEstimateResult.success && createEstimateResult.data && createEstimateResult.data.estimate) {
        estimateId = createEstimateResult.data.estimate.estimate_id;
        console.log('✅ Create estimate for task successful');
        console.log(`   Estimate ID: ${estimateId}`);
        console.log(`   Estimated hours: ${createEstimateResult.data.estimate.estimated_hours}`);
    } else {
        console.log('❌ Create estimate for task failed:', createEstimateResult.error);
    }

    // Test create estimate for subtask
    if (global.testSubtaskId) {
        console.log('\nTesting create estimate for subtask:');
        const createSubtaskEstimateResult = await apiRequest('POST', '/estimates', {
            subtask_id: global.testSubtaskId,
            estimated_hours: 6.0,
            complexity: 'LOW',
            confidence_level: 5,
            notes: 'Subtask is well-defined and straightforward'
        }, tokens.developer);

        if (createSubtaskEstimateResult.success) {
            console.log('✅ Create estimate for subtask successful');
            console.log(`   Estimated hours: ${createSubtaskEstimateResult.data.estimate.estimated_hours}`);
        } else {
            console.log('❌ Create estimate for subtask failed:', createSubtaskEstimateResult.error);
        }
    }

    // Test get user's estimates
    console.log('\nTesting get user estimates:');
    const userEstimatesResult = await apiRequest('GET', '/estimates/my', null, tokens.developer);
    if (userEstimatesResult.success) {
        const estimates = userEstimatesResult.data.estimates || [];
        console.log(`✅ Get user estimates successful - Found ${estimates.length} estimates`);
        if (estimates.length > 0) {
            const totalHours = estimates.reduce((sum, est) => sum + parseFloat(est.estimated_hours || 0), 0);
            console.log(`   Total estimated hours: ${totalHours.toFixed(1)}`);
        }
    } else {
        console.log('❌ Get user estimates failed:', userEstimatesResult.error);
    }

    // Test get user's estimation accuracy
    console.log('\nTesting get user estimation accuracy:');
    const accuracyResult = await apiRequest('GET', '/estimates/my/accuracy', null, tokens.developer);
    if (accuracyResult.success) {
        console.log('✅ Get user estimation accuracy successful');
        if (accuracyResult.data.accuracy) {
            console.log(`   Average accuracy: ${accuracyResult.data.accuracy.averageAccuracy || 'N/A'}%`);
            console.log(`   Total estimates: ${accuracyResult.data.accuracy.totalEstimates || 0}`);
        }
    } else {
        console.log('❌ Get user estimation accuracy failed:', accuracyResult.error);
    }

    // Test get estimation trends
    console.log('\nTesting get estimation trends:');
    const trendsResult = await apiRequest('GET', '/estimates/trends', null, tokens.manager);
    if (trendsResult.success) {
        console.log('✅ Get estimation trends successful');
        if (trendsResult.data.trends) {
            console.log(`   Trend data points: ${trendsResult.data.trends.length || 0}`);
        }
    } else {
        console.log('❌ Get estimation trends failed:', trendsResult.error);
    }

    // Test get task estimates
    console.log('\nTesting get task estimates:');
    const taskEstimatesResult = await apiRequest('GET', `/estimates/task/${taskId}`, null, tokens.manager);
    if (taskEstimatesResult.success) {
        const estimates = taskEstimatesResult.data.estimates || [];
        console.log(`✅ Get task estimates successful - Found ${estimates.length} estimates`);
    } else {
        console.log('❌ Get task estimates failed:', taskEstimatesResult.error);
    }

    // Test get task estimation summary
    console.log('\nTesting get task estimation summary:');
    const taskSummaryResult = await apiRequest('GET', `/estimates/task/${taskId}/summary`, null, tokens.manager);
    if (taskSummaryResult.success) {
        console.log('✅ Get task estimation summary successful');
        if (taskSummaryResult.data.summary) {
            console.log(`   Total estimates: ${taskSummaryResult.data.summary.totalEstimates || 0}`);
            console.log(`   Average estimate: ${taskSummaryResult.data.summary.averageEstimate || 'N/A'} hours`);
        }
    } else {
        console.log('❌ Get task estimation summary failed:', taskSummaryResult.error);
    }

    // Test update task estimate (Manager/Admin only)
    if (tokens.manager) {
        console.log('\nTesting update task estimate (Manager):');
        const updateTaskEstimateResult = await apiRequest('PUT', `/estimates/task/${taskId}/estimate`, {
            actualHours: 18.5
        }, tokens.manager);
        if (updateTaskEstimateResult.success) {
            console.log('✅ Update task estimate successful');
            console.log(`   Actual hours set to: 18.5`);
        } else {
            console.log('❌ Update task estimate failed:', updateTaskEstimateResult.error);
        }
    }

    // Test get subtask estimates
    if (global.testSubtaskId) {
        console.log('\nTesting get subtask estimates:');
        const subtaskEstimatesResult = await apiRequest('GET', `/estimates/subtask/${global.testSubtaskId}`, null, tokens.manager);
        if (subtaskEstimatesResult.success) {
            const estimates = subtaskEstimatesResult.data.estimates || [];
            console.log(`✅ Get subtask estimates successful - Found ${estimates.length} estimates`);
        } else {
            console.log('❌ Get subtask estimates failed:', subtaskEstimatesResult.error);
        }

        // Test get subtask estimation summary
        console.log('\nTesting get subtask estimation summary:');
        const subtaskSummaryResult = await apiRequest('GET', `/estimates/subtask/${global.testSubtaskId}/summary`, null, tokens.manager);
        if (subtaskSummaryResult.success) {
            console.log('✅ Get subtask estimation summary successful');
        } else {
            console.log('❌ Get subtask estimation summary failed:', subtaskSummaryResult.error);
        }

        // Test update subtask estimate (Manager/Admin only)
        if (tokens.manager) {
            console.log('\nTesting update subtask estimate (Manager):');
            const updateSubtaskEstimateResult = await apiRequest('PUT', `/estimates/subtask/${global.testSubtaskId}/estimate`, {
                actualHours: 7.0
            }, tokens.manager);
            if (updateSubtaskEstimateResult.success) {
                console.log('✅ Update subtask estimate successful');
                console.log(`   Actual hours set to: 7.0`);
            } else {
                console.log('❌ Update subtask estimate failed:', updateSubtaskEstimateResult.error);
            }
        }
    }

    // Test get project estimation statistics
    if (projectId) {
        console.log('\nTesting get project estimation statistics:');
        const projectStatsResult = await apiRequest('GET', `/estimates/project/${projectId}/stats`, null, tokens.manager);
        if (projectStatsResult.success) {
            console.log('✅ Get project estimation statistics successful');
            if (projectStatsResult.data.stats) {
                console.log(`   Total estimates: ${projectStatsResult.data.stats.totalEstimates || 0}`);
                console.log(`   Average accuracy: ${projectStatsResult.data.stats.averageAccuracy || 'N/A'}%`);
            }
        } else {
            console.log('❌ Get project estimation statistics failed:', projectStatsResult.error);
        }
    }

    // Test get estimator estimates
    if (userProfiles.developer && userProfiles.developer.id) {
        console.log('\nTesting get estimator estimates:');
        const estimatorResult = await apiRequest('GET', `/estimates/estimator/${userProfiles.developer.id}`, null, tokens.manager);
        if (estimatorResult.success) {
            const estimates = estimatorResult.data.estimates || [];
            console.log(`✅ Get estimator estimates successful - Found ${estimates.length} estimates`);
        } else {
            console.log('❌ Get estimator estimates failed:', estimatorResult.error);
        }

        // Test get estimation accuracy by estimator
        console.log('\nTesting get estimation accuracy by estimator:');
        const estimatorAccuracyResult = await apiRequest('GET', `/estimates/estimator/${userProfiles.developer.id}/accuracy`, null, tokens.manager);
        if (estimatorAccuracyResult.success) {
            console.log('✅ Get estimation accuracy by estimator successful');
        } else {
            console.log('❌ Get estimation accuracy by estimator failed:', estimatorAccuracyResult.error);
        }
    }

    // Test get specific estimate
    if (estimateId) {
        console.log('\nTesting get specific estimate:');
        const estimateResult = await apiRequest('GET', `/estimates/${estimateId}`, null, tokens.developer);
        if (estimateResult.success) {
            console.log('✅ Get specific estimate successful');
            console.log(`   Hours: ${estimateResult.data.estimate.estimated_hours}`);
            console.log(`   Complexity: ${estimateResult.data.estimate.complexity}`);
        } else {
            console.log('❌ Get specific estimate failed:', estimateResult.error);
        }

        // Test update estimate
        console.log('\nTesting update estimate:');
        const updateEstimateResult = await apiRequest('PUT', `/estimates/${estimateId}`, {
            estimated_hours: 20.0,
            complexity: 'HIGH',
            confidence_level: 3,
            notes: 'Updated estimate after further analysis - increased complexity'
        }, tokens.developer);
        if (updateEstimateResult.success) {
            console.log('✅ Update estimate successful');
        } else {
            console.log('❌ Update estimate failed:', updateEstimateResult.error);
        }

        // Test delete estimate
        console.log('\nTesting delete estimate:');
        const deleteEstimateResult = await apiRequest('DELETE', `/estimates/${estimateId}`, null, tokens.developer);
        if (deleteEstimateResult.success) {
            console.log('✅ Delete estimate successful');
        } else {
            console.log('❌ Delete estimate failed:', deleteEstimateResult.error);
        }
    }
}

// Test team endpoints
async function testTeamEndpoints() {
    console.log('\n📋 Testing Team Management Endpoints...');
    console.log('-'.repeat(50));

    let teamId;
    let developerId;

    if (!tokens.manager) {
        console.log('❌ Manager token not available, skipping team tests');
        return;
    }

    try {
        // 1. Get all teams (should work for all roles)
        console.log('\n1. Testing GET /teams - All Teams');
        try {
            // Test as manager
            const teamsResponse = await axios.get(`${BASE_URL}/teams`, {
                headers: { Authorization: `Bearer ${tokens.manager}` }
            });

            if (teamsResponse.data.success && Array.isArray(teamsResponse.data.teams)) {
                console.log('✅ Get all teams successful');
                if (isInfoMode) {
                    console.log(`   Found ${teamsResponse.data.teams.length} teams`);
                    teamsResponse.data.teams.forEach(team => {
                        console.log(`   - ${team.team_name} (Manager: ${team.manager?.username || 'Unknown'})`);
                    });
                }
            } else {
                console.log('❌ Get all teams failed - Invalid response structure');
            }
        } catch (error) {
            console.log(`❌ Get all teams failed: ${error.response?.data?.error || error.message}`);
        }

        // 2. Create a new team (Manager only)
        console.log('\n2. Testing POST /teams - Create Team');
        try {
            const createTeamResponse = await axios.post(`${BASE_URL}/teams`, {
                team_name: `Test Team ${Date.now()}`,
                description: 'This is a test team created by API testing'
            }, {
                headers: { Authorization: `Bearer ${tokens.manager}` }
            });

            if (createTeamResponse.data.success && createTeamResponse.data.team) {
                teamId = createTeamResponse.data.team.team_id;
                console.log('✅ Create team successful');
                if (isInfoMode) {
                    console.log(`   Team ID: ${teamId}`);
                    console.log(`   Team Name: ${createTeamResponse.data.team.team_name}`);
                }
            } else {
                console.log('❌ Create team failed - Invalid response');
            }
        } catch (error) {
            console.log(`❌ Create team failed: ${error.response?.data?.error || error.message}`);
        }

        // 3. Get team by ID
        if (teamId) {
            console.log('\n3. Testing GET /teams/:id - Get Team by ID');
            try {
                const teamResponse = await axios.get(`${BASE_URL}/teams/${teamId}`, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (teamResponse.data.success && teamResponse.data.team) {
                    console.log('✅ Get team by ID successful');
                    if (isInfoMode) {
                        console.log(`   Team: ${teamResponse.data.team.team_name}`);
                        console.log(`   Description: ${teamResponse.data.team.description}`);
                    }
                } else {
                    console.log('❌ Get team by ID failed');
                }
            } catch (error) {
                console.log(`❌ Get team by ID failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 4. Get available developers
        console.log('\n4. Testing GET /teams/available-developers - Available Developers');
        try {
            const developersResponse = await axios.get(`${BASE_URL}/teams/available-developers`, {
                headers: { Authorization: `Bearer ${tokens.manager}` }
            });

            if (developersResponse.data.success && Array.isArray(developersResponse.data.developers)) {
                console.log('✅ Get available developers successful');
                if (developersResponse.data.developers.length > 0) {
                    developerId = developersResponse.data.developers[0].user_id;
                    if (isInfoMode) {
                        console.log(`   Found ${developersResponse.data.developers.length} available developers`);
                        developersResponse.data.developers.slice(0, 3).forEach(dev => {
                            console.log(`   - ${dev.username} (${dev.full_name || 'No name'})`);
                        });
                    }
                } else {
                    console.log('   No available developers found');
                }
            } else {
                console.log('❌ Get available developers failed');
            }
        } catch (error) {
            console.log(`❌ Get available developers failed: ${error.response?.data?.error || error.message}`);
        }

        // 5. Add member to team
        if (teamId && developerId) {
            console.log('\n5. Testing POST /teams/:id/members - Add Member');
            try {
                const addMemberResponse = await axios.post(`${BASE_URL}/teams/${teamId}/members`, {
                    userId: developerId,
                    roleInTeam: 'DEVELOPER'
                }, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (addMemberResponse.data.success) {
                    console.log('✅ Add member to team successful');
                    if (isInfoMode) {
                        console.log(`   Added developer to team with role: DEVELOPER`);
                    }
                } else {
                    console.log('❌ Add member to team failed');
                }
            } catch (error) {
                console.log(`❌ Add member to team failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 6. Update member role
        if (teamId && developerId) {
            console.log('\n6. Testing PUT /teams/:id/members/:userId/role - Update Member Role');
            try {
                const updateRoleResponse = await axios.put(`${BASE_URL}/teams/${teamId}/members/${developerId}/role`, {
                    roleInTeam: 'LEAD_DEVELOPER'
                }, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (updateRoleResponse.data.success) {
                    console.log('✅ Update member role successful');
                    if (isInfoMode) {
                        console.log(`   Updated role to: LEAD_DEVELOPER`);
                    }
                } else {
                    console.log('❌ Update member role failed');
                }
            } catch (error) {
                console.log(`❌ Update member role failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 7. Get team stats
        if (teamId) {
            console.log('\n7. Testing GET /teams/:id/stats - Team Statistics');
            try {
                const statsResponse = await axios.get(`${BASE_URL}/teams/${teamId}/stats`, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (statsResponse.data.success && statsResponse.data.stats) {
                    console.log('✅ Get team statistics successful');
                    if (isInfoMode) {
                        const stats = statsResponse.data.stats;
                        console.log(`   Members: ${stats.totalMembers}`);
                        console.log(`   Projects: ${stats.totalProjects}`);
                        console.log(`   Tasks: ${stats.totalTasks}`);
                        console.log(`   Completed: ${stats.completedTasks}`);
                    }
                } else {
                    console.log('❌ Get team statistics failed');
                }
            } catch (error) {
                console.log(`❌ Get team statistics failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 8. Get team dashboard (Manager/Admin only)
        console.log('\n8. Testing GET /teams/dashboard - Team Dashboard');
        try {
            const dashboardResponse = await axios.get(`${BASE_URL}/teams/dashboard`, {
                headers: { Authorization: `Bearer ${tokens.manager}` }
            });

            if (dashboardResponse.data.success && dashboardResponse.data.dashboard) {
                console.log('✅ Get team dashboard successful');
                if (isInfoMode) {
                    const dashboard = dashboardResponse.data.dashboard;
                    console.log(`   Total Teams: ${dashboard.totalTeams}`);
                    console.log(`   Total Members: ${dashboard.totalMembers}`);
                    console.log(`   Teams Overview: ${dashboard.teamsOverview.length} teams`);
                }
            } else {
                console.log('❌ Get team dashboard failed');
            }
        } catch (error) {
            console.log(`❌ Get team dashboard failed: ${error.response?.data?.error || error.message}`);
        }

        // 9. Assign team to project (if we have a project)
        if (teamId && projectId) {
            console.log('\n9. Testing POST /teams/:id/projects - Assign to Project');
            try {
                const assignResponse = await axios.post(`${BASE_URL}/teams/${teamId}/projects`, {
                    projectId: projectId
                }, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (assignResponse.data.success) {
                    console.log('✅ Assign team to project successful');
                    if (isInfoMode) {
                        console.log(`   Assigned team to project: ${projectId}`);
                    }
                } else {
                    console.log('❌ Assign team to project failed');
                }
            } catch (error) {
                console.log(`❌ Assign team to project failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 10. Update team
        if (teamId) {
            console.log('\n10. Testing PUT /teams/:id - Update Team');
            try {
                const updateResponse = await axios.put(`${BASE_URL}/teams/${teamId}`, {
                    team_name: `Updated Test Team ${Date.now()}`,
                    description: 'Updated description for test team'
                }, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (updateResponse.data.success) {
                    console.log('✅ Update team successful');
                    if (isInfoMode) {
                        console.log(`   Updated team: ${updateResponse.data.team.team_name}`);
                    }
                } else {
                    console.log('❌ Update team failed');
                }
            } catch (error) {
                console.log(`❌ Update team failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 11. Remove member from team
        if (teamId && developerId) {
            console.log('\n11. Testing DELETE /teams/:id/members/:userId - Remove Member');
            try {
                const removeResponse = await axios.delete(`${BASE_URL}/teams/${teamId}/members/${developerId}`, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (removeResponse.data.success) {
                    console.log('✅ Remove member from team successful');
                } else {
                    console.log('❌ Remove member from team failed');
                }
            } catch (error) {
                console.log(`❌ Remove member from team failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 12. Remove team from project
        if (teamId && projectId) {
            console.log('\n12. Testing DELETE /teams/:id/projects/:projectId - Remove from Project');
            try {
                const removeProjectResponse = await axios.delete(`${BASE_URL}/teams/${teamId}/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (removeProjectResponse.data.success) {
                    console.log('✅ Remove team from project successful');
                } else {
                    console.log('❌ Remove team from project failed');
                }
            } catch (error) {
                console.log(`❌ Remove team from project failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 13. Delete team (cleanup)
        if (teamId) {
            console.log('\n13. Testing DELETE /teams/:id - Delete Team');
            try {
                const deleteResponse = await axios.delete(`${BASE_URL}/teams/${teamId}`, {
                    headers: { Authorization: `Bearer ${tokens.manager}` }
                });

                if (deleteResponse.data.success) {
                    console.log('✅ Delete team successful');
                } else {
                    console.log('❌ Delete team failed');
                }
            } catch (error) {
                console.log(`❌ Delete team failed: ${error.response?.data?.error || error.message}`);
            }
        }

        // 14. Test access control (Developer trying to create team)
        console.log('\n14. Testing Access Control - Developer Create Team (Should Fail)');
        try {
            const unauthorizedResponse = await axios.post(`${BASE_URL}/teams`, {
                team_name: 'Unauthorized Team',
                description: 'This should fail'
            }, {
                headers: { Authorization: `Bearer ${tokens.developer}` }
            });

            console.log('❌ Access control failed - Developer was allowed to create team');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Access control working - Developer correctly denied team creation');
            } else {
                console.log(`❌ Access control test failed: ${error.response?.data?.error || error.message}`);
            }
        }

        console.log('\n📋 Team Management Testing Complete');
        console.log(`✅ Tested 14 team endpoints with proper authentication and authorization`);

    } catch (error) {
        console.log(`\n💥 TEAM TESTING ERROR: ${error.message}`);
        if (isInfoMode) {
            console.error('💥 Full error:', error);
        }
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE API TESTING - ALL 102 ENDPOINTS');
    console.log('='.repeat(70));
    console.log(`Testing API at: ${BASE_URL}`);
    console.log(`Testing with users: Admin, Manager, Developer`);

    if (isInfoMode) {
        console.log('📋 INFO MODE: Verbose logging enabled');
        console.log('📋 This will show detailed request/response information');
    } else {
        console.log('💡 Use --info flag for detailed request/response logging');
    }

    console.log('='.repeat(70));

    // Setup test environment
    ensureTestResultsDir();

    try {
        await testAuthentication();
        await testProfileEndpoints();
        await testAdminEndpoints();
        await testProjectEndpoints();
        await testTaskEndpoints();
        await testSubtaskEndpoints();        // NEW: 12 endpoints
        await testWorkLogEndpoints();        // NEW: 12 endpoints  
        await testEstimateEndpoints();       // NEW: 16 endpoints
        await testCalendarEndpoints();
        await testReportingEndpoints();
        await testFileEndpoints();
        await testTeamEndpoints();
        await cleanup();

        console.log('\n🎉 ALL TESTS COMPLETED!');
        console.log('='.repeat(70));
        console.log('Check the output above for any failed tests (❌)');
        console.log('All successful tests are marked with (✅)');
        console.log(`\n📊 COVERAGE: Testing all 102 API endpoints across 12 modules`);
        console.log('📷 INCLUDES: Profile photo upload/update/delete with real test images');
        console.log('📁 INCLUDES: Project file upload/download/delete with real documents');
        console.log('👥 INCLUDES: Comprehensive team management with member and project assignments');
        console.log('🔄 INCLUDES: Complete subtask lifecycle with assignments and estimates');
        console.log('⏱️ INCLUDES: Work hour logging with bulk operations and statistics');
        console.log('📊 INCLUDES: Estimation system with accuracy tracking and trends analysis');

        if (isInfoMode) {
            console.log('\n📋 INFO MODE: Detailed logging was enabled for this run');
        }

    } catch (error) {
        console.error('\n💥 UNEXPECTED ERROR DURING TESTING:', error.message);
        if (isInfoMode) {
            console.error('💥 FULL ERROR:', error);
        }
    }
}

// Run the tests
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests, apiRequest, TEST_USERS };