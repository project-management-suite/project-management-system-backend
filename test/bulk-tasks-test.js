// test/bulk-tasks-test.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (using the correct test app credentials)
const MANAGER_EMAIL = 'testmanager@testapp.com';
const MANAGER_PASSWORD = 'testpass123';

let managerToken = '';
let testProjectId = '';

// Helper function to authenticate and get token
async function authenticateManager() {
    try {
        console.log('🔐 Authenticating manager...');

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: MANAGER_EMAIL,
            password: MANAGER_PASSWORD
        });

        managerToken = loginResponse.data.token;
        console.log('✅ Manager authenticated successfully');
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
        return false;
    }
}

// Helper function to get or create a test project
async function getTestProject() {
    try {
        console.log('🔍 Getting projects...');

        const response = await axios.get(`${BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        const projects = response.data.data || response.data;
        if (projects && projects.length > 0) {
            testProjectId = projects[0].project_id;
            console.log('✅ Using existing project:', testProjectId);
            return true;
        }

        // Create a new project if none exist
        console.log('📋 Creating test project...');
        const createResponse = await axios.post(`${BASE_URL}/projects`, {
            project_name: 'Bulk Tasks Test Project',
            description: 'Project for testing bulk task operations',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        testProjectId = createResponse.data.project_id;
        console.log('✅ Created test project:', testProjectId);
        return true;
    } catch (error) {
        console.error('❌ Failed to get/create project:', error.response?.data || error.message);
        return false;
    }
}

// Test bulk task creation
async function testBulkCreateTasks() {
    try {
        console.log('\n📝 Testing bulk task creation...');

        const tasksToCreate = [
            {
                title: 'Setup Development Environment',
                description: 'Install all required dependencies and tools',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                title: 'Design Database Schema',
                description: 'Create ERD and define all database tables',
                start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                title: 'Implement Authentication Module',
                description: 'Build user login, registration, and JWT handling',
                start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];

        const response = await axios.post(`${BASE_URL}/tasks/project/${testProjectId}/bulk/create`, {
            tasks: tasksToCreate
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        console.log('✅ Bulk create response:', {
            total: response.data.total,
            successful: response.data.successful,
            failed: response.data.failed
        });

        if (response.data.results && response.data.results.length > 0) {
            console.log('📋 Created tasks:');
            response.data.results.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.task.title} (ID: ${result.task.task_id})`);
            });

            // Store task IDs for further testing
            global.createdTaskIds = response.data.results.map(r => r.task.task_id);
        }

        return response.data.results || [];
    } catch (error) {
        console.error('❌ Bulk create failed:', error.response?.data || error.message);
        return [];
    }
}

// Test bulk task updates
async function testBulkUpdateTasks() {
    try {
        if (!global.createdTaskIds || global.createdTaskIds.length === 0) {
            console.log('⚠️  No tasks available for bulk update test');
            return;
        }

        console.log('\n🔄 Testing bulk task updates...');

        const updatesToMake = global.createdTaskIds.slice(0, 2).map((taskId, index) => ({
            task_id: taskId,
            status: 'IN_PROGRESS',
            description: `Updated description for task ${index + 1} - Now in progress!`
        }));

        const response = await axios.put(`${BASE_URL}/tasks/bulk/update`, {
            updates: updatesToMake
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        console.log('✅ Bulk update response:', {
            total: response.data.total,
            successful: response.data.successful,
            failed: response.data.failed
        });

        if (response.data.results && response.data.results.length > 0) {
            console.log('🔄 Updated tasks:');
            response.data.results.forEach((result, index) => {
                console.log(`  ${index + 1}. Task ${result.task_id} - Status: ${result.task.status}`);
            });
        }
    } catch (error) {
        console.error('❌ Bulk update failed:', error.response?.data || error.message);
    }
}

// Test bulk task deletion
async function testBulkDeleteTasks() {
    try {
        if (!global.createdTaskIds || global.createdTaskIds.length === 0) {
            console.log('⚠️  No tasks available for bulk delete test');
            return;
        }

        console.log('\n🗑️  Testing bulk task deletion...');

        // Delete the last task from our created tasks
        const taskIdsToDelete = [global.createdTaskIds[global.createdTaskIds.length - 1]];

        const response = await axios.delete(`${BASE_URL}/tasks/bulk/delete`, {
            data: { task_ids: taskIdsToDelete },
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        console.log('✅ Bulk delete response:', {
            total: response.data.total,
            successful: response.data.successful,
            failed: response.data.failed
        });

        if (response.data.results && response.data.results.length > 0) {
            console.log('🗑️  Deleted tasks:');
            response.data.results.forEach((result, index) => {
                console.log(`  ${index + 1}. Task ${result.task_id} deleted successfully`);
            });
        }
    } catch (error) {
        console.error('❌ Bulk delete failed:', error.response?.data || error.message);
    }
}

// Main test function
async function runBulkTasksTest() {
    console.log('🚀 Starting Bulk Tasks Test\n');

    // Step 1: Authenticate
    const authSuccess = await authenticateManager();
    if (!authSuccess) return;

    // Step 2: Get/Create test project
    const projectSuccess = await getTestProject();
    if (!projectSuccess) return;

    // Step 3: Test bulk operations
    await testBulkCreateTasks();
    await testBulkUpdateTasks();
    await testBulkDeleteTasks();

    console.log('\n🎉 Bulk Tasks Test Complete!');
}

// Run the test
runBulkTasksTest().catch(console.error);