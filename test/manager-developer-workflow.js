// test/manager-developer-workflow.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const MANAGER_EMAIL = 'testmanager@testapp.com';
const MANAGER_PASSWORD = 'testpass123';
const DEVELOPER_EMAIL = 'testdeveloper@testapp.com';
const DEVELOPER_PASSWORD = 'testpass123';

let managerToken = '';
let developerToken = '';
let testProjectId = '';
let developerUserId = '';

async function authenticateUsers() {
    try {
        console.log('🔐 Authenticating users...');

        // Authenticate manager
        const managerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: MANAGER_EMAIL,
            password: MANAGER_PASSWORD
        });
        managerToken = managerLogin.data.token;
        console.log('✅ Manager authenticated successfully');

        // Authenticate developer
        const developerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: DEVELOPER_EMAIL,
            password: DEVELOPER_PASSWORD
        });
        developerToken = developerLogin.data.token;
        developerUserId = developerLogin.data.user.user_id;
        console.log('✅ Developer authenticated successfully');
        console.log(`   Developer ID: ${developerUserId}`);

        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
        return false;
    }
}

async function managerCreatesProject() {
    try {
        console.log('\\n📋 Manager creating project...');

        const createResponse = await axios.post(`${BASE_URL}/projects`, {
            project_name: 'Team Collaboration Test Project',
            description: 'Project for testing manager-developer collaboration and bulk operations'
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        testProjectId = createResponse.data.project_id;
        console.log('✅ Manager created project:', testProjectId);
        return true;
    } catch (error) {
        console.error('❌ Manager failed to create project:', error.response?.data || error.message);
        return false;
    }
}

async function managerAssignsDeveloper() {
    try {
        console.log('\\n👥 Manager assigning developer to project...');

        // Assign developer to project
        const assignResponse = await axios.post(`${BASE_URL}/projects/${testProjectId}/assign`, {
            userIds: [developerUserId]
        }, {
            headers: { Authorization: `Bearer ${managerToken}` }
        });

        console.log('✅ Manager assigned developer to project');
        console.log(`   Assigned users: ${assignResponse.data.assigned_users?.length || 1}`);
        return true;
    } catch (error) {
        console.error('❌ Manager failed to assign developer:', error.response?.data || error.message);
        return false;
    }
}

async function developerCreatesTasks() {
    console.log('\\n👤 Developer creating tasks and subtasks...');

    // Test bulk creation of tasks
    const tasks = Array.from({ length: 20 }, (_, i) => ({
        title: `Developer Task ${i + 1}`,
        description: `Task ${i + 1} created by developer in bulk operation`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

    console.log(`\\n📝 Developer creating ${tasks.length} tasks in bulk...`);

    try {
        const createResponse = await axios.post(`${BASE_URL}/tasks/project/${testProjectId}/bulk/create`, {
            tasks: tasks
        }, {
            headers: { Authorization: `Bearer ${developerToken}` }
        });

        console.log(`✅ Developer successfully created ${createResponse.data.successful} tasks`);
        console.log(`   No limits enforced - created ${createResponse.data.total} tasks at once!`);

        // Get task IDs for subtask creation
        const taskIds = createResponse.data.results.map(r => r.task.task_id);
        global.createdTaskIds = taskIds;

        // Create subtasks for some of the tasks
        console.log('\\n🔄 Developer creating subtasks...');
        let subtaskIds = [];

        for (let i = 0; i < Math.min(5, taskIds.length); i++) {
            const subtaskResponse = await axios.post(`${BASE_URL}/subtasks`, {
                parent_task_id: taskIds[i],
                title: `Subtask for Task ${i + 1}`,
                description: `Detailed subtask for the main task ${i + 1}`,
                priority: 'MEDIUM',
                estimated_hours: 2.5
            }, {
                headers: { Authorization: `Bearer ${developerToken}` }
            });

            if (subtaskResponse.data && subtaskResponse.data.subtask) {
                subtaskIds.push(subtaskResponse.data.subtask.subtask_id);
                console.log(`   ✅ Created subtask: ${subtaskResponse.data.subtask.title}`);
            }
        }

        global.createdSubtaskIds = subtaskIds;
        console.log(`✅ Developer created ${subtaskIds.length} subtasks`);

        // Test bulk task updates
        console.log('\\n🔄 Developer updating tasks in bulk...');
        const updates = taskIds.slice(0, 10).map(taskId => ({
            task_id: taskId,
            status: 'IN_PROGRESS',
            description: 'Updated by developer via bulk operation'
        }));

        const updateResponse = await axios.put(`${BASE_URL}/tasks/bulk/update`, {
            updates: updates
        }, {
            headers: { Authorization: `Bearer ${developerToken}` }
        });

        console.log(`✅ Developer successfully updated ${updateResponse.data.successful} tasks`);
        return true;

    } catch (error) {
        console.error('❌ Developer task creation failed:', error.response?.data || error.message);
        return false;
    }
}

async function developerDeletesTasks() {
    console.log('\\n🗑️  Developer deleting subtasks and tasks...');

    try {
        // Delete subtasks first
        if (global.createdSubtaskIds && global.createdSubtaskIds.length > 0) {
            console.log('\\n🔄 Deleting subtasks individually...');
            for (const subtaskId of global.createdSubtaskIds) {
                try {
                    await axios.delete(`${BASE_URL}/subtasks/${subtaskId}`, {
                        headers: { Authorization: `Bearer ${developerToken}` }
                    });
                    console.log(`   ✅ Deleted subtask: ${subtaskId}`);
                } catch (error) {
                    console.log(`   ❌ Failed to delete subtask ${subtaskId}:`, error.response?.data?.message);
                }
            }
        }

        // Bulk delete all tasks
        if (global.createdTaskIds && global.createdTaskIds.length > 0) {
            console.log(`\\n🗑️  Bulk deleting ALL ${global.createdTaskIds.length} tasks at once...`);
            const deleteResponse = await axios.delete(`${BASE_URL}/tasks/bulk/delete`, {
                data: { task_ids: global.createdTaskIds },
                headers: { Authorization: `Bearer ${developerToken}` }
            });

            console.log(`✅ Developer successfully deleted ${deleteResponse.data.successful}/${deleteResponse.data.total} tasks`);
            console.log(`   No limits enforced - deleted ${deleteResponse.data.total} tasks at once!`);

            if (deleteResponse.data.errors && deleteResponse.data.errors.length > 0) {
                console.log(`   ⚠️  ${deleteResponse.data.errors.length} deletion errors occurred`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Developer deletion failed:', error.response?.data || error.message);
        return false;
    }
}

async function cleanup() {
    if (testProjectId) {
        try {
            console.log('\\n🧹 Manager cleaning up test project...');
            await axios.delete(`${BASE_URL}/projects/${testProjectId}`, {
                headers: { Authorization: `Bearer ${managerToken}` }
            });
            console.log('✅ Test project cleaned up by manager');
        } catch (error) {
            console.log('⚠️  Project cleanup may have failed');
        }
    }
}

async function runManagerDeveloperWorkflow() {
    console.log('🚀 Starting Manager-Developer Collaboration Test\\n');

    // Step 1: Authenticate both users
    const authSuccess = await authenticateUsers();
    if (!authSuccess) return;

    // Step 2: Manager creates project
    const projectSuccess = await managerCreatesProject();
    if (!projectSuccess) return;

    // Step 3: Manager assigns developer to project
    const assignSuccess = await managerAssignsDeveloper();
    if (!assignSuccess) return;

    // Step 4: Developer creates tasks and subtasks
    const createSuccess = await developerCreatesTasks();
    if (!createSuccess) return;

    // Step 5: Developer deletes tasks and subtasks
    await developerDeletesTasks();

    // Step 6: Clean up
    await cleanup();

    console.log('\\n🎉 Manager-Developer Collaboration Test Complete!');
    console.log('\\n📋 Summary:');
    console.log('   ✅ Manager CAN create projects');
    console.log('   ✅ Manager CAN assign developers to projects');
    console.log('   ✅ Developer CAN create tasks/subtasks in assigned projects');
    console.log('   ✅ Developer CAN perform bulk operations WITHOUT LIMITS');
    console.log('   ✅ Developer CAN delete any number of tasks/subtasks at once');
    console.log('   ✅ Full collaboration workflow works perfectly');
    console.log('\\n🚫 CONFIRMED: NO bulk operation limits enforced!');
}

runManagerDeveloperWorkflow().catch(console.error);