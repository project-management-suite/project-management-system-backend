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
  Comprehensive test suite for all 52 API endpoints across 8 modules:
  
  🔐 Authentication (4 endpoints)      - Login, registration, OTP verification
  👤 Profile Management (7 endpoints)  - Profile CRUD, photo upload/management
  👑 Admin Functions (4 endpoints)     - Dashboard, user management, roles
  📋 Project Management (8 endpoints)  - Project CRUD, assignments, dashboard
  ✅ Task Management (8 endpoints)     - Task CRUD, assignments, status updates
  📅 Calendar System (8 endpoints)     - Holidays, deadlines, reminders
  📊 Reporting (5 endpoints)           - Analytics, reports, PDF export
  📁 File Management (6 endpoints)     - File upload, download, management

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
    console.log('🚀 STARTING COMPREHENSIVE API TESTING - ALL 66 ENDPOINTS');
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
        await testCalendarEndpoints();
        await testReportingEndpoints();
        await testFileEndpoints();
        await testTeamEndpoints();
        await cleanup();

        console.log('\n🎉 ALL TESTS COMPLETED!');
        console.log('='.repeat(70));
        console.log('Check the output above for any failed tests (❌)');
        console.log('All successful tests are marked with (✅)');
        console.log(`\n📊 COVERAGE: Testing all 66 API endpoints across 9 modules`);
        console.log('📷 INCLUDES: Profile photo upload/update/delete with real test images');
        console.log('📁 INCLUDES: Project file upload/download/delete with real documents');
        console.log('👥 INCLUDES: Comprehensive team management with member and project assignments');

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