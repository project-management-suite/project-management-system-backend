// test-api.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Base URL for your API
const BASE_URL = 'http://localhost:5000/api';

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
        console.log(`   DEBUG: Request failed for ${method} ${endpoint}`);
        console.log(`   DEBUG: Error status: ${error.response?.status || 'No status'}`);
        console.log(`   DEBUG: Error data:`, error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Test authentication
async function testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION');
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
}

// Test profile endpoints
async function testProfileEndpoints() {
    console.log('\n👤 TESTING PROFILE ENDPOINTS');
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
}

// Test admin endpoints
async function testAdminEndpoints() {
    console.log('\n👑 TESTING ADMIN ENDPOINTS');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available, skipping admin tests');
        return;
    }

    // Get all users
    console.log('\nTesting get all users:');
    const usersResult = await apiRequest('GET', '/admin/users', null, tokens.admin);
    if (usersResult.success) {
        console.log(`✅ Get all users successful - Found ${usersResult.data.users.length} users`);
        usersResult.data.users.forEach(user => {
            console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
        });
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
}

// Test project endpoints
async function testProjectEndpoints() {
    console.log('\n📋 TESTING PROJECT ENDPOINTS');
    console.log('='.repeat(50));

    if (!tokens.manager) {
        console.log('❌ No manager token available, skipping project tests');
        return;
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
    }    // Get all projects
    console.log('\nTesting get all projects:');
    const projectsResult = await apiRequest('GET', '/projects', null, tokens.manager);
    if (projectsResult.success) {
        console.log(`✅ Get projects successful - Found ${projectsResult.data.projects.length} projects`);
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

    // Get developers for assignment
    console.log('\nTesting get developers:');
    const developersResult = await apiRequest('GET', '/projects/developers', null, tokens.manager);
    if (developersResult.success) {
        const developers = developersResult.data.developers || developersResult.data || [];
        console.log(`✅ Get developers successful - Found ${developers.length} developers`);
    } else {
        console.log('❌ Get developers failed:', developersResult.error);
    }
}

// Test task endpoints
async function testTaskEndpoints() {
    console.log('\n✅ TESTING TASK ENDPOINTS');
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
    }    // Get project tasks
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

    // Assign developer to task
    if (userProfiles.developer && userProfiles.developer.user_id) {
        console.log('\nTesting assign developer to task:');
        const assignResult = await apiRequest('POST', `/tasks/${taskId}/assign`, {
            developer_id: userProfiles.developer.id
        }, tokens.manager);

        if (assignResult.success) {
            console.log('✅ Assign developer successful');
        } else {
            console.log('❌ Assign developer failed:', assignResult.error);
        }
    } else {
        console.log('\nSkipping task assignment - developer user_id not available');
    }    // Update task
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

    // Get user tasks (developer view)
    if (tokens.developer) {
        console.log('\nTesting get user tasks (developer view):');
        const userTasksResult = await apiRequest('GET', '/tasks', null, tokens.developer);
        if (userTasksResult.success) {
            const tasks = userTasksResult.data.tasks || userTasksResult.data || [];
            console.log(`✅ Get user tasks successful - Found ${tasks.length} assigned tasks`);
        } else {
            console.log('❌ Get user tasks failed:', userTasksResult.error);
        }
    }
}

// Test calendar endpoints
async function testCalendarEndpoints() {
    console.log('\n📅 TESTING CALENDAR ENDPOINTS');
    console.log('='.repeat(50));

    // Test get holidays
    console.log('\nTesting get holidays:');
    const holidaysResult = await apiRequest('GET', '/calendar/holidays', null, tokens.manager);
    if (holidaysResult.success) {
        const holidays = holidaysResult.data.holidays || holidaysResult.data || [];
        console.log(`✅ Get holidays successful - Found ${holidays.length} holidays`);
        holidays.forEach(holiday => {
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

    // Test get tasks calendar
    console.log('\nTesting get tasks calendar:');
    const tasksCalendarResult = await apiRequest('GET', '/calendar/tasks', null, tokens.manager);
    if (tasksCalendarResult.success) {
        const tasks = tasksCalendarResult.data.calendar?.tasks || tasksCalendarResult.data.tasks || tasksCalendarResult.data || [];
        console.log(`✅ Get tasks calendar successful - Found ${tasks.length} tasks`);
    } else {
        console.log('❌ Get tasks calendar failed:', tasksCalendarResult.error);
    }

    // Test get upcoming deadlines
    console.log('\nTesting get upcoming deadlines:');
    const deadlinesResult = await apiRequest('GET', '/calendar/deadlines?days=30', null, tokens.manager);
    if (deadlinesResult.success) {
        const deadlines = deadlinesResult.data.deadlines;
        const totalDeadlines = deadlines.overdue.length + deadlines.today.length +
            deadlines.thisWeek.length + deadlines.nextWeek.length + deadlines.later.length;
        console.log(`✅ Get upcoming deadlines successful - Found ${totalDeadlines} total deadlines`);
        console.log(`   Overdue: ${deadlines.overdue.length}, Today: ${deadlines.today.length}, This week: ${deadlines.thisWeek.length}`);
    } else {
        console.log('❌ Get upcoming deadlines failed:', deadlinesResult.error);
    }

    // Test set deadline reminder
    if (taskId && tokens.developer) {
        console.log('\nTesting set deadline reminder:');
        const reminderResult = await apiRequest('POST', '/calendar/reminders', {
            taskId: taskId,
            reminderDate: '2025-12-10T09:00:00Z',
            reminderType: 'email'
        }, tokens.developer);

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
    console.log('\n📊 TESTING REPORTING ENDPOINTS');
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
}

// Test file endpoints
async function testFileEndpoints() {
    console.log('\n📁 TESTING FILE ENDPOINTS');
    console.log('='.repeat(50));

    // Test get files
    console.log('\nTesting get files:');
    const filesResult = await apiRequest('GET', '/files', null, tokens.manager);
    if (filesResult.success) {
        console.log('✅ Get files successful');
    } else {
        console.log('❌ Get files failed:', filesResult.error);
    }
}

// Clean up test data
async function cleanup() {
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

// Main test function
async function runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE API TESTING');
    console.log('='.repeat(60));
    console.log(`Testing API at: ${BASE_URL}`);
    console.log(`Testing with users: Admin, Manager, Developer`);

    try {
        await testAuthentication();
        await testProfileEndpoints();
        await testAdminEndpoints();
        await testProjectEndpoints();
        await testTaskEndpoints();
        await testCalendarEndpoints();
        await testReportingEndpoints();
        await testFileEndpoints();
        await cleanup();

        console.log('\n🎉 ALL TESTS COMPLETED!');
        console.log('='.repeat(60));
        console.log('Check the output above for any failed tests (❌)');
        console.log('All successful tests are marked with (✅)');

    } catch (error) {
        console.error('\n💥 UNEXPECTED ERROR DURING TESTING:', error.message);
    }
}

// Run the tests
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests, apiRequest, TEST_USERS };