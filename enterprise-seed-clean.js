/**
 * Enterprise Seed Data Script - Complete Workflow Implementation
 * 
 * This script creates a realistic enterprise environment:
 * - Creates 2 admins, 5 managers, 20 developers
 * - Forms teams with manager assignments
 * - Creates projects and assigns tasks to developers
 * - Developers create subtasks and log work
 * - Managers generate reports
 * 
 * Usage: node enterprise-seed-data.js
 */

const axios = require('axios');
const { faker } = require('@faker-js/faker');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const USER_CONFIG = {
    admins: 2,
    managers: 5,
    developers: 20
};

// Global storage
let users = {
    admins: [],
    managers: [],
    developers: []
};

let tokens = {
    admins: [],
    managers: [],
    developers: []
};

let createdData = {
    teams: [],
    projects: [],
    tasks: [],
    subtasks: [],
    workLogs: [],
    reports: []
};

/**
 * API Helper Function
 */
async function makeRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method: method.toLowerCase(),
            url: `${API_BASE_URL}${endpoint}`,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
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

/**
 * Helper function to get real OTP from backend (for testing)
 */
async function getRealOTPFromBackend(email) {
    console.log(`🔍 Retrieving actual OTP for ${email}...`);

    try {
        // Small delay to prevent connection issues
        await new Promise(resolve => setTimeout(resolve, 500));

        const otpResult = await makeRequest('GET', `/auth/test/last-otp?email=${encodeURIComponent(email)}`);

        if (otpResult.success && otpResult.data.otp) {
            console.log(`✅ Retrieved OTP for user: ${otpResult.data.otp}`);
            return otpResult.data.otp;
        } else {
            console.log(`❌ Failed to get OTP`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error retrieving OTP: ${error.message}`);
        return null;
    }
}

/**
 * Admin Cleanup Function - Clear existing enterprise data to prevent duplicates
 */
async function performAdminCleanup() {
    console.log('🧹 PERFORMING ADMIN CLEANUP TO PREVENT DUPLICATES');
    console.log('='.repeat(60));
    console.log('📋 Using existing admin credentials to clean database');
    console.log('');

    const adminCredentials = {
        email: 'testadmin@testapp.com',
        password: 'testpass123'
    };

    let adminToken = null;

    try {
        // Login with existing admin
        console.log('🔐 Authenticating with existing admin account...');
        const loginResponse = await makeRequest('POST', '/auth/login', adminCredentials);

        if (loginResponse.success && loginResponse.data?.token) {
            adminToken = loginResponse.data.token;
            console.log('✅ Admin authentication successful');
            console.log(`   Admin: ${adminCredentials.email}`);
        } else {
            console.log('⚠️ Admin login failed - continuing without cleanup');
            console.log('   This is normal if admin doesn\'t exist yet');
            return;
        }

        // Get all users to identify enterprise users
        console.log('\n📋 Identifying enterprise users for cleanup...');
        const usersResponse = await makeRequest('GET', '/admin/users', null, adminToken);

        if (usersResponse.success && usersResponse.data?.users) {
            const enterpriseUsers = usersResponse.data.users.filter(user =>
                user.email.includes('@enterprise.com') ||
                user.email.startsWith('admin') ||
                user.email.startsWith('manager') ||
                user.email.startsWith('developer')
            );

            console.log(`   Found ${enterpriseUsers.length} enterprise users to clean up`);

            // Delete enterprise users
            let deletedCount = 0;
            for (const user of enterpriseUsers) {
                try {
                    const deleteResponse = await makeRequest('DELETE', `/admin/users/by-email/${encodeURIComponent(user.email)}`, null, adminToken);
                    if (deleteResponse.success) {
                        deletedCount++;
                        console.log(`   🗑️ Deleted: ${user.email} (${user.role})`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.log(`   ⚠️ Could not delete ${user.email}: ${error.message}`);
                }
            }

            console.log(`✅ Deleted ${deletedCount}/${enterpriseUsers.length} enterprise users`);
        }

        // Cleanup pending registrations and OTPs
        console.log('\n🧹 Cleaning up pending registrations and OTPs...');
        const cleanupResponse = await makeRequest('POST', '/admin/cleanup-pending-data', null, adminToken);

        if (cleanupResponse.success) {
            console.log('✅ Pending data cleanup successful');
            console.log(`   Pending registrations removed: ${cleanupResponse.data.pending_registrations || 0}`);
            console.log(`   OTPs removed: ${cleanupResponse.data.all_otps || 0}`);
        }

        // Additional cleanup for files and photos if endpoints exist
        try {
            console.log('\n🖼️ Cleaning up old photos...');
            await makeRequest('POST', '/profile/admin/cleanup-photos', null, adminToken);
            console.log('✅ Old photos cleanup completed');
        } catch (error) {
            console.log('   ⚠️ Photo cleanup not available or failed');
        }

        try {
            console.log('\n📁 Cleaning up sample photos...');
            await makeRequest('POST', '/profile/admin/cleanup-sample-photos', null, adminToken);
            console.log('✅ Sample photos cleanup completed');
        } catch (error) {
            console.log('   ⚠️ Sample photo cleanup not available or failed');
        }

        console.log('\n🎉 ADMIN CLEANUP COMPLETED SUCCESSFULLY!');
        console.log('   Database is now clean and ready for enterprise seeding');
        console.log('');

    } catch (error) {
        console.log('❌ Cleanup error:', error.message);
        console.log('⚠️ Continuing with seeding - some duplicates may occur');
        console.log('');
    }

    // Small delay before starting main seeding
    await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Utility Functions
 */
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPastDate(days = 30) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return randomDate(start, end);
}

function randomFutureDate(days = 30) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    return randomDate(start, end);
}

/**
 * Step 1: Create and Authenticate Users
 */
async function createUsers() {
    console.log('👥 Creating enterprise users...');
    console.log(`📊 Target: ${USER_CONFIG.admins} admins, ${USER_CONFIG.managers} managers, ${USER_CONFIG.developers} developers`);
    console.log('🧪 TEST MODE: This will handle OTP verification automatically');
    console.log('');

    // Create admins
    for (let i = 1; i <= USER_CONFIG.admins; i++) {
        try {
            const userData = {
                email: `admin${i}@enterprise.com`,
                password: 'SecureAdmin123!',
                first_name: faker.person.firstName(),
                last_name: faker.person.lastName(),
                role: 'ADMIN'
            };

            console.log(`\nCreating admin: ${userData.email}...`);

            // Step 1: Register user
            console.log('📝 Step 1: Registering user...');
            const registerResponse = await makeRequest('POST', '/auth/register', userData);

            if (registerResponse.success) {
                console.log(`✅ ${userData.role} registered successfully`);
            } else {
                console.log(`❌ Registration failed for ${userData.email}`);
                continue;
            }

            // Step 2: Get real OTP from backend
            console.log('🔍 Step 2: Retrieving actual OTP from backend...');
            await new Promise(resolve => setTimeout(resolve, 500));

            const realOTP = await getRealOTPFromBackend(userData.email);

            if (!realOTP) {
                console.log(`❌ Could not retrieve OTP for ${userData.email}`);
                continue;
            }

            console.log(`🔑 Using OTP: ${realOTP}`);

            // Step 3: Verify OTP
            console.log('✅ Step 3: Verifying OTP...');
            const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
                email: userData.email,
                otp: realOTP
            });

            if (verifyResponse.success) {
                console.log(`✅ ${userData.email} activated successfully`);
            } else {
                console.log(`❌ OTP verification failed for ${userData.email}`);
                continue;
            }

            // Step 4: Login to get token
            console.log('🔐 Step 4: Logging in...');
            const loginResponse = await makeRequest('POST', '/auth/login', {
                email: userData.email,
                password: userData.password
            });

            if (loginResponse.success && loginResponse.data?.token) {
                const userId = loginResponse.data.user?.id || loginResponse.data.user?.user_id || loginResponse.data.id || loginResponse.data.user_id;
                users.admins.push({ ...userData, user_id: userId });
                tokens.admins.push(loginResponse.data.token);
                console.log(`🎉 Admin ${userData.email} fully created and authenticated!`);
            } else {
                console.log(`❌ Login failed for ${userData.email}`);
            }

        } catch (error) {
            console.log(`❌ Error creating admin ${i}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create managers
    for (let i = 1; i <= USER_CONFIG.managers; i++) {
        try {
            const userData = {
                email: `manager${i}@enterprise.com`,
                password: 'SecureManager123!',
                first_name: faker.person.firstName(),
                last_name: faker.person.lastName(),
                role: 'MANAGER'
            };

            console.log(`\nCreating manager: ${userData.email}...`);

            const registerResponse = await makeRequest('POST', '/auth/register', userData);
            if (!registerResponse.success) {
                console.log(`❌ Registration failed for ${userData.email}`);
                continue;
            }

            console.log(`✅ ${userData.role} registered successfully`);

            await new Promise(resolve => setTimeout(resolve, 500));
            const realOTP = await getRealOTPFromBackend(userData.email);
            if (!realOTP) continue;

            const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
                email: userData.email,
                otp: realOTP
            });
            if (!verifyResponse.success) {
                console.log(`❌ OTP verification failed for ${userData.email}`);
                continue;
            }

            console.log(`✅ ${userData.email} activated successfully`);

            const loginResponse = await makeRequest('POST', '/auth/login', {
                email: userData.email,
                password: userData.password
            });

            if (loginResponse.success && loginResponse.data?.token) {
                const userId = loginResponse.data.user?.id || loginResponse.data.user?.user_id || loginResponse.data.id || loginResponse.data.user_id;
                users.managers.push({ ...userData, user_id: userId });
                tokens.managers.push(loginResponse.data.token);
                console.log(`🎉 Manager ${userData.email} fully created and authenticated!`);
            }

        } catch (error) {
            console.log(`❌ Error creating manager ${i}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create developers
    for (let i = 1; i <= USER_CONFIG.developers; i++) {
        try {
            const userData = {
                email: `developer${i}@enterprise.com`,
                password: 'SecureDev123!',
                first_name: faker.person.firstName(),
                last_name: faker.person.lastName(),
                role: 'DEVELOPER'
            };

            console.log(`\nCreating developer: ${userData.email}...`);

            const registerResponse = await makeRequest('POST', '/auth/register', userData);
            if (!registerResponse.success) {
                console.log(`❌ Registration failed for ${userData.email}`);
                continue;
            }

            console.log(`✅ ${userData.role} registered successfully`);

            await new Promise(resolve => setTimeout(resolve, 500));
            const realOTP = await getRealOTPFromBackend(userData.email);
            if (!realOTP) continue;

            const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
                email: userData.email,
                otp: realOTP
            });
            if (!verifyResponse.success) {
                console.log(`❌ OTP verification failed for ${userData.email}`);
                continue;
            }

            console.log(`✅ ${userData.email} activated successfully`);

            const loginResponse = await makeRequest('POST', '/auth/login', {
                email: userData.email,
                password: userData.password
            });

            if (loginResponse.success && loginResponse.data?.token) {
                const userId = loginResponse.data.user?.id || loginResponse.data.user?.user_id || loginResponse.data.id || loginResponse.data.user_id;
                users.developers.push({ ...userData, user_id: userId });
                tokens.developers.push(loginResponse.data.token);
                console.log(`🎉 Developer ${userData.email} fully created and authenticated!`);
            }

        } catch (error) {
            console.log(`❌ Error creating developer ${i}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n📋 User Creation & Authentication Summary:`);
    console.log(`   • Admins: ${users.admins.length}/${USER_CONFIG.admins} authenticated`);
    console.log(`   • Managers: ${users.managers.length}/${USER_CONFIG.managers} authenticated`);
    console.log(`   • Developers: ${users.developers.length}/${USER_CONFIG.developers} authenticated`);
    console.log('');
}/**
 * Step 2: Create Teams with Manager Assignments
 */
async function createTeams() {
    console.log('🏢 Creating teams with manager assignments...');

    if (tokens.admins.length === 0) {
        console.error('❌ No admin tokens available for team creation');
        return;
    }

    const adminToken = tokens.admins[0];
    const teamTemplates = [
        { name: 'Frontend Development Team', description: 'React, Vue, Angular development' },
        { name: 'Backend API Team', description: 'Node.js, Python, API development' },
        { name: 'Mobile Development Team', description: 'iOS, Android, React Native' },
        { name: 'DevOps Infrastructure Team', description: 'AWS, Docker, Kubernetes, CI/CD' },
        { name: 'QA & Testing Team', description: 'Automated testing, manual QA' }
    ];

    for (let i = 0; i < teamTemplates.length && i < users.managers.length; i++) {
        try {
            const manager = users.managers[i];
            const template = teamTemplates[i];

            const teamData = {
                team_name: template.name,
                description: `${template.description}. Managed by ${manager.first_name} ${manager.last_name}`,
                team_color: faker.color.rgb(),
                max_members: 8
            };

            const teamResponse = await makeRequest('POST', '/teams', teamData, adminToken);

            if (teamResponse.success && teamResponse.data) {
                // Extract team_id from the actual API response structure
                const teamId = teamResponse.data.team?.team_id || teamResponse.data.team_id || teamResponse.data.id; if (teamId) {
                    createdData.teams.push({
                        ...teamResponse.data,
                        team_id: teamId,
                        manager: manager,
                        members: []
                    });

                    console.log(`✅ Created team: ${template.name} (Manager: ${manager.email})`);

                    // Assign 3-4 developers to each team
                    const startIdx = i * 4;
                    const endIdx = Math.min(startIdx + 4, users.developers.length);
                    const teamDevs = users.developers.slice(startIdx, endIdx);

                    for (const dev of teamDevs) {
                        try {
                            // Debug: Check if user_id is present
                            if (!dev.user_id) {
                                console.log(`   ⚠️ Skipping ${dev.email} - no user_id found`);
                                console.log(`   🔍 Dev object:`, JSON.stringify(dev, null, 2));
                                continue;
                            }

                            console.log(`   🔍 Adding ${dev.email} with ID: ${dev.user_id}`);

                            const memberData = {
                                userId: dev.user_id,
                                roleInTeam: 'DEVELOPER'
                            };

                            console.log(`   🔍 Sending data:`, JSON.stringify(memberData, null, 2));

                            const memberResponse = await makeRequest('POST', `/teams/${teamId}/members`, memberData, adminToken);
                            if (memberResponse.success) {
                                createdData.teams[createdData.teams.length - 1].members.push(dev);
                                console.log(`   👤 Added ${dev.email} to ${template.name}`);
                            } else {
                                console.log(`   ⚠️ Failed to add ${dev.email} to team:`);
                                console.log(`      Error:`, JSON.stringify(memberResponse.error, null, 2));
                            }

                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.log(`   ⚠️ Error adding ${dev.email} to team:`, error.message);
                        }
                    }
                } else {
                    console.log(`❌ Team created but no team_id found in response: ${template.name}`);
                }

            } else {
                console.log(`❌ Failed to create team: ${template.name}`);
                console.log(`   Error:`, teamResponse.error || 'Unknown error');
            }

            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`❌ Error creating team ${teamTemplates[i].name}:`, error.message);
        }
    }

    console.log(`✅ Created ${createdData.teams.length} teams with ${createdData.teams.reduce((acc, team) => acc + team.members.length, 0)} total members`);
}

/**
 * Step 3: Create Projects
 */
async function createProjects() {
    console.log('📁 Creating enterprise projects...');

    const projectTemplates = [
        {
            name: 'Customer Portal Redesign 2024',
            description: 'Complete redesign of customer-facing portal with modern UI/UX',
            type: 'Web Application',
            priority: 'HIGH'
        },
        {
            name: 'Mobile Banking App V2',
            description: 'Next generation mobile banking application with enhanced security',
            type: 'Mobile Application',
            priority: 'URGENT'
        },
        {
            name: 'Data Analytics Platform',
            description: 'Real-time analytics platform for business intelligence',
            type: 'Data Platform',
            priority: 'MEDIUM'
        },
        {
            name: 'API Gateway Migration',
            description: 'Migration from legacy API gateway to cloud-native solution',
            type: 'Infrastructure',
            priority: 'HIGH'
        },
        {
            name: 'Security Compliance Audit',
            description: 'Implementation of SOC2 and ISO27001 compliance measures',
            type: 'Security',
            priority: 'URGENT'
        }
    ];

    for (let i = 0; i < projectTemplates.length && i < users.managers.length; i++) {
        try {
            const manager = users.managers[i % users.managers.length];
            const template = projectTemplates[i];

            const projectData = {
                project_name: template.name,
                description: template.description,
                start_date: randomPastDate(30).toISOString().split('T')[0],
                end_date: randomFutureDate(90).toISOString().split('T')[0],
                status: faker.helpers.arrayElement(['PLANNING', 'IN_PROGRESS', 'ON_HOLD']),
                priority: template.priority,
                budget: Math.floor(Math.random() * 500000) + 100000,
                estimated_hours: Math.floor(Math.random() * 1000) + 200,
                project_type: template.type,
                client_name: faker.company.name(),
                technology_stack: faker.helpers.arrayElements(['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'TypeScript'], 3).join(', ')
            };

            const projectResponse = await makeRequest('POST', '/projects', projectData, tokens.managers[i % tokens.managers.length]);

            if (projectResponse.success && projectResponse.data?.project_id) {
                createdData.projects.push({
                    ...projectResponse.data,
                    manager: manager,
                    assignedTeam: createdData.teams[i % createdData.teams.length]
                });

                console.log(`✅ Created project: ${template.name} (Manager: ${manager.email})`);
            }

            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`❌ Error creating project ${projectTemplates[i].name}:`, error.message);
        }
    }

    console.log(`✅ Created ${createdData.projects.length} projects`);
}

/**
 * Step 4: Create Tasks and Assign to Developers
 */
async function createTasks() {
    console.log('📋 Creating tasks and assigning to developers...');

    const taskTemplates = [
        { name: 'User Authentication Module', type: 'FEATURE', priority: 'HIGH' },
        { name: 'Dashboard Analytics Widget', type: 'FEATURE', priority: 'MEDIUM' },
        { name: 'API Rate Limiting', type: 'ENHANCEMENT', priority: 'HIGH' },
        { name: 'Database Performance Optimization', type: 'IMPROVEMENT', priority: 'MEDIUM' },
        { name: 'Fix Login Session Timeout', type: 'BUG', priority: 'URGENT' },
        { name: 'Mobile Responsive Layout', type: 'FEATURE', priority: 'HIGH' },
        { name: 'Email Notification Service', type: 'FEATURE', priority: 'LOW' },
        { name: 'Security Vulnerability Patch', type: 'BUG', priority: 'URGENT' },
        { name: 'User Profile Management', type: 'FEATURE', priority: 'MEDIUM' },
        { name: 'API Documentation Update', type: 'DOCUMENTATION', priority: 'LOW' }
    ];

    for (const project of createdData.projects) {
        try {
            const managerToken = tokens.managers[users.managers.findIndex(m => m.user_id === project.manager.user_id)];
            const assignedTeam = project.assignedTeam;

            if (!managerToken || !assignedTeam || assignedTeam.members.length === 0) {
                console.log(`⚠️ Skipping tasks for project ${project.project_name} - missing manager token or team`);
                continue;
            }

            // Create 2-4 tasks per project
            const numTasks = Math.floor(Math.random() * 3) + 2;
            const projectTasks = [];

            for (let i = 0; i < numTasks; i++) {
                const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
                const assignedDev = assignedTeam.members[Math.floor(Math.random() * assignedTeam.members.length)];

                const startDate = new Date();
                const endDate = randomFutureDate(14);

                const taskData = {
                    title: `${template.name} - ${project.project_name}`,
                    description: `${template.name} implementation for the ${project.project_name} project. Priority: ${template.priority}, Type: ${template.type}`,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                };

                console.log(`   🔍 Creating task for project ID: ${project.project_id}`);
                console.log(`   🔍 Task endpoint: /tasks/project/${project.project_id}`);
                console.log(`   🔍 Manager token length: ${managerToken ? managerToken.substring(0, 20) + '...' : 'MISSING'}`);

                const taskResponse = await makeRequest('POST', `/tasks/project/${project.project_id}`, taskData, managerToken);

                if (taskResponse.success && taskResponse.data?.task_id) {
                    const taskInfo = {
                        ...taskResponse.data,
                        ...taskData,
                        assignedDeveloper: assignedDev,
                        manager: project.manager,
                        project: project
                    };

                    createdData.tasks.push(taskInfo);
                    projectTasks.push(taskInfo);

                    console.log(`   ✅ Created task: ${template.name} → ${assignedDev.email}`);
                } else {
                    console.log(`   ❌ Failed to create task: ${template.name}`);
                } await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log(`✅ Created ${projectTasks.length} tasks for project: ${project.project_name}`);

        } catch (error) {
            console.error(`❌ Error creating tasks for project ${project.project_name}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`✅ Created ${createdData.tasks.length} total tasks across all projects`);
}

/**
 * Step 5: Developers Create Subtasks
 */
async function createSubtasks() {
    console.log('📝 Developers creating subtasks...');

    const subtaskTemplates = [
        'Research and design implementation',
        'Set up project structure',
        'Implement core functionality',
        'Write unit tests',
        'Integration testing',
        'Code review and refactoring',
        'Documentation update',
        'Performance optimization'
    ];

    for (const task of createdData.tasks) {
        try {
            const devToken = tokens.developers[users.developers.findIndex(d => d.user_id === task.assignedDeveloper.user_id)];

            if (!devToken) {
                console.log(`⚠️ No token found for developer ${task.assignedDeveloper.email}`);
                continue;
            }

            // Each task gets 2-4 subtasks
            const numSubtasks = Math.floor(Math.random() * 3) + 2;
            const taskSubtasks = [];

            for (let i = 0; i < numSubtasks; i++) {
                const subtaskName = subtaskTemplates[Math.floor(Math.random() * subtaskTemplates.length)];

                const subtaskData = {
                    task_id: task.task_id,
                    subtask_name: `${subtaskName} for ${task.task_name}`,
                    description: `Detailed ${subtaskName.toLowerCase()} work for the main task.`,
                    estimated_hours: Math.floor(Math.random() * 8) + 1,
                    status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'COMPLETED']),
                    priority: task.priority,
                    due_date: randomFutureDate(7).toISOString().split('T')[0]
                };

                const subtaskResponse = await makeRequest('POST', '/subtasks', subtaskData, devToken);

                if (subtaskResponse.success && subtaskResponse.data?.subtask_id) {
                    taskSubtasks.push({
                        ...subtaskResponse.data,
                        ...subtaskData,
                        task: task,
                        developer: task.assignedDeveloper
                    });

                    console.log(`     ┗━ Created subtask: ${subtaskName} (${subtaskData.status})`);
                } else {
                    console.log(`     ❌ Failed to create subtask: ${subtaskName}`);
                } await new Promise(resolve => setTimeout(resolve, 100));
            }

            createdData.subtasks.push(...taskSubtasks);
            console.log(`   ✅ ${task.assignedDeveloper.first_name} created ${taskSubtasks.length} subtasks for: ${task.task_name}`);

        } catch (error) {
            console.error(`❌ Error creating subtasks for task ${task.task_name}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Created ${createdData.subtasks.length} total subtasks`);
}

/**
 * Step 6: Log Work on Subtasks
 */
async function logWork() {
    console.log('⏰ Developers logging work on subtasks...');

    const workDescriptions = [
        'Initial research and planning',
        'Code implementation and debugging',
        'Writing and running unit tests',
        'Code review feedback implementation',
        'Documentation and commenting',
        'Performance testing and optimization',
        'Bug fixing and edge case handling',
        'Integration with external APIs',
        'Database schema updates',
        'UI/UX improvements'
    ];

    for (const subtask of createdData.subtasks) {
        try {
            const devToken = tokens.developers[users.developers.findIndex(d => d.user_id === subtask.developer.user_id)];

            if (!devToken) continue;

            // Log 1-3 work entries per subtask
            const numWorkLogs = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numWorkLogs; i++) {
                const workData = {
                    task_id: subtask.task.task_id,
                    subtask_id: subtask.subtask_id,
                    hours_worked: parseFloat((Math.random() * 6 + 0.5).toFixed(1)),
                    work_date: randomPastDate(14).toISOString().split('T')[0],
                    description: workDescriptions[Math.floor(Math.random() * workDescriptions.length)],
                    work_type: faker.helpers.arrayElement(['DEVELOPMENT', 'TESTING', 'DOCUMENTATION', 'MEETING', 'RESEARCH']),
                    notes: `Worked on ${subtask.subtask_name}. Progress made on key components.`
                };

                const workResponse = await makeRequest('POST', '/work-logs', workData, devToken);

                if (workResponse.success && workResponse.data?.work_log_id) {
                    createdData.workLogs.push({
                        ...workResponse.data,
                        ...workData,
                        subtask: subtask,
                        developer: subtask.developer
                    });

                    console.log(`       ⏱️  ${workData.hours_worked}h logged: ${workData.description}`);
                } await new Promise(resolve => setTimeout(resolve, 50));
            }

            console.log(`   ✅ ${subtask.developer.first_name} logged work for: ${subtask.subtask_name}`);

        } catch (error) {
            console.error(`❌ Error logging work for subtask ${subtask.subtask_name}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Logged ${createdData.workLogs.length} work entries`);
}

/**
 * Step 7: Generate Reports
 */
async function generateReports() {
    console.log('📊 Managers generating comprehensive reports...');

    const reportTypes = [
        'PROJECT_PROGRESS',
        'TEAM_PERFORMANCE',
        'TIME_TRACKING',
        'RESOURCE_UTILIZATION',
        'MILESTONE_STATUS'
    ];

    for (let i = 0; i < users.managers.length; i++) {
        const manager = users.managers[i];
        const managerToken = tokens.managers[i];

        if (!managerToken) continue;

        try {
            // Generate 2-3 reports per manager
            const numReports = Math.floor(Math.random() * 2) + 2;

            for (let j = 0; j < numReports; j++) {
                const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
                const managedProject = createdData.projects.find(p => p.manager.user_id === manager.user_id);

                const reportData = {
                    report_name: `${reportType.replace('_', ' ')} Report - ${new Date().toLocaleDateString()}`,
                    report_type: reportType,
                    project_id: managedProject ? managedProject.project_id : null,
                    date_range_start: randomPastDate(30).toISOString().split('T')[0],
                    date_range_end: new Date().toISOString().split('T')[0],
                    description: `Comprehensive ${reportType.toLowerCase().replace('_', ' ')} analysis for management review`,
                    status: 'GENERATED'
                };

                const reportResponse = await makeRequest('POST', '/reports', reportData, managerToken);

                if (reportResponse.success && reportResponse.data?.report_id) {
                    createdData.reports.push({
                        ...reportResponse.data,
                        ...reportData,
                        manager: manager,
                        project: managedProject
                    });

                    console.log(`   ✅ ${manager.first_name} generated: ${reportType.replace('_', ' ')} Report`);
                } await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log(`✅ Manager ${manager.first_name} ${manager.last_name} generated reports`);

        } catch (error) {
            console.error(`❌ Error generating reports for manager ${manager.email}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`✅ Generated ${createdData.reports.length} comprehensive reports`);
}

/**
 * Main Execution Function
 */
async function main() {
    console.log('🚀 Starting Enterprise Seed Data Generation...');
    console.log('🏢 Creating comprehensive enterprise project management environment');
    console.log(`🔗 API Base URL: ${API_BASE_URL}`);
    console.log('📋 COMPLETE WORKFLOW: Users → Teams → Projects → Tasks → Subtasks → Work Logs → Reports');
    console.log('');

    try {
        // Step 0: Perform admin cleanup to prevent duplicates
        await performAdminCleanup();

        // Step 1: Create all users with OTP verification
        console.log('='.repeat(60));
        console.log('STEP 1: USER CREATION & AUTHENTICATION');
        console.log('='.repeat(60));
        await createUsers();

        // Check if we have sufficient authenticated users
        const totalAuthenticated = tokens.admins.length + tokens.managers.length + tokens.developers.length;

        if (totalAuthenticated === 0) {
            console.error('❌ No users were successfully authenticated. Cannot continue.');
            process.exit(1);
        }

        console.log(`✅ Successfully authenticated ${totalAuthenticated} users`);

        // Step 2: Create teams and assign managers
        if (tokens.admins.length > 0 && users.managers.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 2: TEAM FORMATION & MANAGEMENT');
            console.log('='.repeat(60));
            await createTeams();
        } else {
            console.log('⚠️ Skipping team creation - need at least 1 admin and 1 manager');
        }

        // Step 3: Create projects
        if (tokens.managers.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 3: PROJECT INITIALIZATION');
            console.log('='.repeat(60));
            await createProjects();
        } else {
            console.log('⚠️ Skipping project creation - need at least 1 manager');
        }

        // Step 4: Create tasks and assign to developers
        if (tokens.managers.length > 0 && createdData.projects.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 4: TASK CREATION & ASSIGNMENT');
            console.log('='.repeat(60));
            await createTasks();
        } else {
            console.log('⚠️ Skipping task creation - need managers and projects');
        }

        // Step 5: Developers create subtasks
        if (tokens.developers.length > 0 && createdData.tasks.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 5: SUBTASK BREAKDOWN BY DEVELOPERS');
            console.log('='.repeat(60));
            await createSubtasks();
        } else {
            console.log('⚠️ Skipping subtask creation - need developers and tasks');
        }

        // Step 6: Log work on subtasks
        if (tokens.developers.length > 0 && createdData.subtasks.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 6: WORK LOGGING & TIME TRACKING');
            console.log('='.repeat(60));
            await logWork();
        } else {
            console.log('⚠️ Skipping work logging - need developers and subtasks');
        }

        // Step 7: Generate reports
        if (tokens.managers.length > 0 && createdData.workLogs.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('STEP 7: REPORT GENERATION BY MANAGERS');
            console.log('='.repeat(60));
            await generateReports();
        } else {
            console.log('⚠️ Skipping report generation - need managers and work logs');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ENTERPRISE ENVIRONMENT SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log('📊 COMPREHENSIVE SUMMARY:');
        console.log(`   👥 Users Created & Authenticated:`);
        console.log(`      • Admins: ${users.admins.length}/${USER_CONFIG.admins}`);
        console.log(`      • Managers: ${users.managers.length}/${USER_CONFIG.managers}`);
        console.log(`      • Developers: ${users.developers.length}/${USER_CONFIG.developers}`);
        console.log(`   🏢 Organizational Structure:`);
        console.log(`      • Teams: ${createdData.teams.length}`);
        console.log(`      • Projects: ${createdData.projects.length}`);
        console.log(`   📋 Work Management:`);
        console.log(`      • Tasks Created: ${createdData.tasks.length}`);
        console.log(`      • Subtasks Created: ${createdData.subtasks.length}`);
        console.log(`      • Work Logs: ${createdData.workLogs.length}`);
        console.log(`      • Reports Generated: ${createdData.reports.length}`);

        // Calculate total hours logged
        const totalHours = createdData.workLogs.reduce((sum, log) => sum + (log.hours_worked || 0), 0);
        console.log(`   ⏰ Total Hours Logged: ${totalHours.toFixed(1)} hours`);

        console.log('\n🔑 SAMPLE ACCESS CREDENTIALS:');
        if (users.admins.length > 0) {
            console.log(`   • Admin: ${users.admins[0].email} / ${users.admins[0].password}`);
        }
        if (users.managers.length > 0) {
            console.log(`   • Manager: ${users.managers[0].email} / ${users.managers[0].password}`);
        }
        if (users.developers.length > 0) {
            console.log(`   • Developer: ${users.developers[0].email} / ${users.developers[0].password}`);
        }

        console.log('\n🚀 WORKFLOW COMPLETED SUCCESSFULLY!');
        console.log('   1. ✅ Managers created teams and assigned developers');
        console.log('   2. ✅ Managers created projects and assigned tasks');
        console.log('   3. ✅ Developers broke down tasks into subtasks');
        console.log('   4. ✅ Developers logged work and updated progress');
        console.log('   5. ✅ Managers generated comprehensive reports');
        console.log('');

    } catch (error) {
        console.error('❌ Enterprise seeding failed:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    });
}

module.exports = { main, users, createdData };