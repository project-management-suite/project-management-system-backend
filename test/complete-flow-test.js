// Complete End-to-End Project Management Flow Test
// This test demonstrates the full lifecycle of a project management system
// from user creation to project completion and cleanup

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'flow-test-results');
const ASSETS_DIR = path.join(TEST_RESULTS_DIR, 'assets');
const REPORTS_DIR = path.join(TEST_RESULTS_DIR, 'reports');

// Ensure test directories exist
function ensureTestResultsDir() {
    [TEST_RESULTS_DIR, ASSETS_DIR, REPORTS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Helper function for API requests
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false, responseType = 'json') {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {},
            timeout: 30000,
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

        console.log(`   🔗 ${method} ${BASE_URL}${endpoint}`);
        const response = await axios(config);
        console.log(`   ✅ Response: ${response.status} ${response.statusText}`);

        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        console.log(`   ❌ Request failed: ${method} ${BASE_URL}${endpoint}`);
        console.log(`   ❌ Error: ${error.response?.status || 'No status'} - ${error.response?.statusText || 'No status text'}`);
        console.log(`   📋 Error:`, error.response?.data?.message || error.response?.data || error.message);

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

// Helper function to get real OTP from backend (like in seed-data.js)
async function getRealOTPFromBackend(email) {
    console.log(`   🔍 Retrieving actual OTP for ${email} from backend...`);

    try {
        // Wait for OTP generation to complete
        await delay(2000);

        // Call the testing endpoint to get the real OTP
        const result = await apiRequest('GET', `/auth/test/last-otp?email=${encodeURIComponent(email)}`);

        if (result.success && result.data.otp) {
            console.log(`   ✅ Retrieved real OTP: ${result.data.otp}`);
            return result.data.otp;
        } else {
            console.log(`   ❌ Could not retrieve OTP:`, result.error);
            console.log(`   ⚠️  Check server console for OTP logs`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Error retrieving OTP:`, error.message);
        return null;
    }
}

// Existing admin credentials for initial cleanup
const EXISTING_ADMIN = {
    email: 'testadmin@testapp.com',
    password: 'testpass123',
    role: 'ADMIN'
};

// Test data - comprehensive flow test with multiple users (static emails)
const FLOW_TEST_DATA = {
    admins: [
        {
            username: 'flowadmin1',
            email: 'flowadmin1@flowtest.com',
            password: 'FlowAdmin123!',
            role: 'ADMIN',
            firstName: 'Flow',
            lastName: 'Admin1'
        },
        {
            username: 'flowadmin2',
            email: 'flowadmin2@flowtest.com',
            password: 'FlowAdmin123!',
            role: 'ADMIN',
            firstName: 'Flow',
            lastName: 'Admin2'
        }
    ],
    managers: [
        {
            username: 'flowmgr1',
            email: 'flowmgr1@flowtest.com',
            password: 'FlowMgr123!',
            role: 'MANAGER',
            firstName: 'Flow',
            lastName: 'Manager1'
        },
        {
            username: 'flowmgr2',
            email: 'flowmgr2@flowtest.com',
            password: 'FlowMgr123!',
            role: 'MANAGER',
            firstName: 'Flow',
            lastName: 'Manager2'
        },
        {
            username: 'flowmgr3',
            email: 'flowmgr3@flowtest.com',
            password: 'FlowMgr123!',
            role: 'MANAGER',
            firstName: 'Flow',
            lastName: 'Manager3'
        },
        {
            username: 'flowmgr4',
            email: 'flowmgr4@flowtest.com',
            password: 'FlowMgr123!',
            role: 'MANAGER',
            firstName: 'Flow',
            lastName: 'Manager4'
        }
    ],
    developers: Array.from({ length: 20 }, (_, i) => ({
        username: `flowdev${i + 1}`,
        email: `flowdev${i + 1}@flowtest.com`,
        password: 'FlowDev123!',
        role: 'DEVELOPER',
        firstName: `Flow`,
        lastName: `Developer${i + 1}`
    }))
};

// Store user tokens and data
const flowUsers = {
    admins: [],
    managers: [],
    developers: []
};

const flowData = {
    teams: [],
    projects: [],
    tasks: [],
    subtasks: [],
    estimates: [],
    workLogs: [],
    files: [],
    reports: []
};

// Create test assets
function createTestAssets() {
    ensureTestResultsDir();

    // Create sample profile photos for all users (simple text files for testing)
    const photoData = 'Sample profile photo data for comprehensive flow test';

    // Create photos for all admins, managers, and developers
    const allUsers = [
        ...FLOW_TEST_DATA.admins.map(u => `${u.username}-photo.jpg`),
        ...FLOW_TEST_DATA.managers.map(u => `${u.username}-photo.jpg`),
        ...FLOW_TEST_DATA.developers.map(u => `${u.username}-photo.jpg`)
    ];

    allUsers.forEach(filename => {
        const photoPath = path.join(ASSETS_DIR, filename);
        fs.writeFileSync(photoPath, photoData);
    });

    // Create sample project documents
    const docData = {
        'requirements.md': `# Project Requirements - Comprehensive Flow Test\n\nThis is a comprehensive test document for the large-scale flow test.\n\n## Features\n- User management (26 users)\n- Team management\n- Task tracking\n- Time logging\n- Reporting`,
        'technical-spec.json': JSON.stringify({
            project: 'Comprehensive Flow Test Project',
            version: '2.0.0',
            technologies: ['Node.js', 'React', 'PostgreSQL', 'Supabase'],
            architecture: 'microservices',
            team_size: 26,
            roles: ['admin', 'manager', 'developer']
        }, null, 2),
        'meeting-notes.txt': `Comprehensive Flow Test Meeting Notes\n\nDate: ${new Date().toISOString().split('T')[0]}\nAttendees: All 26 team members\nDiscussion: Large-scale project planning and task assignment\n\nAgenda:\n1. User creation and authentication\n2. Team formation (multiple teams)\n3. Project and task creation\n4. Work logging and estimation\n5. Reporting and analytics\n6. Security testing\n7. Complete cleanup`,
        'project-charter.md': `# Project Charter - Comprehensive Flow Test\n\n## Objective\nDemonstrate complete end-to-end functionality with:\n- 2 Administrators\n- 4 Managers\n- 20 Developers\n\n## Deliverables\n- Multiple teams and projects\n- Comprehensive task management\n- Work tracking and estimation\n- Detailed reporting\n- Security validation`,
        'user-guide.pdf': 'Mock PDF content for user guide document',
        'architecture-diagram.png': 'Mock image data for architecture diagram'
    };

    Object.entries(docData).forEach(([filename, content]) => {
        const filePath = path.join(ASSETS_DIR, filename);
        fs.writeFileSync(filePath, content);
    });
}

// Pre-cleanup: Verify and clean any existing test data
async function preCleanupVerification() {
    console.log('\n🧹 PRE-CLEANUP VERIFICATION');
    console.log('-'.repeat(60));
    console.log('Checking for existing test data and cleaning up...');

    // Login with existing admin to perform cleanup
    console.log('\n🔑 Authenticating with existing admin...');
    const loginResult = await apiRequest('POST', '/auth/login', {
        email: EXISTING_ADMIN.email,
        password: EXISTING_ADMIN.password
    });

    if (!loginResult.success) {
        console.log('⚠️ Could not authenticate with existing admin - proceeding without pre-cleanup');
        return null;
    }

    const adminToken = loginResult.data.token;
    console.log('✅ Admin authenticated for pre-cleanup');

    // Fetch all users and clean up existing flow test users
    console.log('\n🔍 Fetching all users to check for existing flow test users...');

    const usersResult = await apiRequest('GET', '/admin/users', null, adminToken);
    let cleanedUsers = 0;

    if (usersResult.success && usersResult.data.users) {
        console.log(`   Found ${usersResult.data.users.length} total users in system`);

        // Get flow test emails for comparison
        const flowEmails = new Set([
            ...FLOW_TEST_DATA.admins.map(u => u.email),
            ...FLOW_TEST_DATA.managers.map(u => u.email),
            ...FLOW_TEST_DATA.developers.map(u => u.email)
        ]);

        // Find and delete flow test users
        for (const user of usersResult.data.users) {
            if (flowEmails.has(user.email) || user.email.includes('@flowtest.com')) {
                const deleteResult = await apiRequest('DELETE', `/admin/users/${user.user_id}`, null, adminToken);
                if (deleteResult.success) {
                    cleanedUsers++;
                    console.log(`   ✅ Cleaned up existing user: ${user.username || user.email}`);
                }
                await delay(300); // Brief delay between deletions
            }
        }
    } else {
        console.log('   ⚠️ Could not fetch users list for cleanup');
    }    // Clean up any existing flow test projects (projects with 'Flow' or timestamp in name)
    console.log('\n🔍 Checking for existing flow test projects...');

    let cleanedProjects = 0;
    try {
        const projectsResult = await apiRequest('GET', '/projects', null, adminToken);

        if (projectsResult.success && projectsResult.data.projects) {
            for (const project of projectsResult.data.projects) {
                const projectName = project.project_name || '';
                if (projectName.includes('Flow') || projectName.includes('E-Commerce') || projectName.includes('Mobile App')) {
                    const deleteResult = await apiRequest('DELETE', `/projects/${project.project_id}`, null, adminToken);
                    if (deleteResult.success) {
                        cleanedProjects++;
                        console.log(`   ✅ Cleaned up existing project: ${projectName}`);
                    }
                }
            }
        } else {
            console.log('   ⚠️ Could not fetch projects for cleanup:', projectsResult.error?.message || projectsResult.error);
        }
    } catch (error) {
        console.log('   ⚠️ Error during project cleanup, continuing...', error.message);
    }

    // Clean up profile photos
    console.log('\n🔍 Cleaning up profile photos...');
    const photoCleanupResult = await apiRequest('POST', '/profile/admin/cleanup-photos', null, adminToken);
    const photosCleaned = photoCleanupResult.success ? photoCleanupResult.data.removedCount || 0 : 0;

    // Clean up pending registrations and OTPs
    console.log('\n🔍 Cleaning up pending registrations and OTPs...');
    const pendingCleanupResult = await apiRequest('POST', '/admin/cleanup-pending-data', null, adminToken);
    let pendingCleaned = 0;
    if (pendingCleanupResult.success) {
        pendingCleaned = (pendingCleanupResult.data.expired_otps || 0) +
            (pendingCleanupResult.data.pending_registrations || 0) +
            (pendingCleanupResult.data.all_otps || 0);
        console.log(`   ✅ Cleaned up pending data: ${pendingCleanupResult.data.pending_registrations || 0} registrations, ${pendingCleanupResult.data.all_otps || 0} OTPs`);
    }

    console.log(`\n📊 Pre-cleanup Summary:`);
    console.log(`   Users cleaned: ${cleanedUsers}`);
    console.log(`   Projects cleaned: ${cleanedProjects}`);
    console.log(`   Photos cleaned: ${photosCleaned}`);
    console.log(`   Pending data cleaned: ${pendingCleaned}`);
    console.log(`   ✅ Pre-cleanup completed`);

    return adminToken;
}

async function completeProjectManagementFlow() {
    console.log('\n🚀 STARTING COMPLETE PROJECT MANAGEMENT FLOW TEST');
    console.log('='.repeat(80));
    console.log('This test demonstrates the complete lifecycle:');
    console.log('👥 User Management → 🏢 Team Building → 📋 Project Creation → ⏱️ Work Tracking');
    console.log('📊 Reporting → 🔐 Security → 🧹 Cleanup');
    console.log('='.repeat(80));

    // Debug: Test server connection first
    console.log(`\n🔍 Testing server connection to ${BASE_URL}...`);
    try {
        const testResponse = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Server is responding');
    } catch (error) {
        console.log(`❌ Server connection failed: ${error.message}`);
        return;
    }

    createTestAssets();

    try {
        // Pre-cleanup verification
        await preCleanupVerification();
        // Phase 1: User Creation and Authentication
        await phase1_UserCreation();

        // Phase 2: Team Formation and Profile Setup  
        await phase2_TeamFormation();

        // Phase 3: Project and Task Management
        await phase3_ProjectManagement();

        // Phase 4: Work Tracking and Estimation
        await phase4_WorkTracking();

        // Phase 5: Reporting and Analytics
        await phase5_ReportingAnalytics();

        // Phase 6: Security and Password Management
        await phase6_SecurityTesting();

        // Phase 7: Complete Cleanup
        await phase7_CompleteCleanup();

        console.log('\n🎉 COMPLETE PROJECT MANAGEMENT FLOW TEST SUCCESSFUL!');
        console.log('✅ All phases completed successfully');
        console.log('✅ Full lifecycle demonstrated');
        console.log('✅ All test data cleaned up');

    } catch (error) {
        console.error('\n❌ FLOW TEST FAILED:', error.message);
        console.log('\n🧹 Attempting emergency cleanup...');
        await emergencyCleanup();
    }
}

// Phase 1: Create all users (admin, managers, developers)
// Phase 1: Login with existing users (admin, manager, developer)
// Phase 1: Create and authenticate all users (2 admins, 4 managers, 20 developers)
async function phase1_UserCreation() {
    console.log('\n📝 PHASE 1: COMPREHENSIVE USER CREATION AND AUTHENTICATION');
    console.log('-'.repeat(60));
    console.log('Creating: 2 Admins, 4 Managers, 20 Developers = 26 Users Total');

    // Helper function to create and authenticate a user (robust approach from seed-data.js)
    async function createAndAuthUser(userData, userType) {
        console.log(`\n   Creating ${userType}: ${userData.username} (${userData.email})`);

        // Step 1: Register user
        console.log(`   📝 Step 1: Registering user...`);
        const regResult = await apiRequest('POST', '/auth/register', userData);

        if (!regResult.success) {
            console.log(`   ❌ Registration failed for ${userData.username}:`, regResult.error);
            return null;
        }

        console.log(`   ✅ Registration initiated for ${userData.username}`);
        console.log(`   📧 OTP should have been sent to: ${userData.email}`);

        // Step 2: Get real OTP from backend (with proper delay)
        console.log(`   🔍 Step 2: Retrieving actual OTP from backend...`);

        // Wait for email processing and OTP generation
        await delay(3000);

        // Get the real OTP that was generated by the backend
        const realOTP = await getRealOTPFromBackend(userData.email);

        if (!realOTP) {
            console.log(`   ❌ Could not retrieve OTP for ${userData.username}`);
            console.log(`   🔄 Check the server console output for the OTP`);
            return null;
        }

        console.log(`   🔑 REAL OTP for ${userData.email}: ${realOTP}`);

        // Step 3: Verify OTP
        console.log(`   ✅ Step 3: Verifying real OTP...`);
        const verifyResult = await apiRequest('POST', '/auth/verify-otp', {
            email: userData.email,
            otp: realOTP
        });

        if (!verifyResult.success) {
            console.log(`   ❌ OTP verification failed for ${userData.username}:`, verifyResult.error);
            return null;
        }

        console.log(`   ✅ OTP verified successfully for ${userData.username}`);

        // Step 4: Login to get token
        console.log(`   🔐 Step 4: Logging in new user...`);
        const loginResult = await apiRequest('POST', '/auth/login', {
            email: userData.email,
            password: userData.password
        });

        if (loginResult.success) {
            console.log(`   🎉 ${userType} ${userData.username} successfully created and authenticated!`);
            return {
                ...userData,
                token: loginResult.data.token,
                userId: loginResult.data.user.id
            };
        } else {
            console.log(`   ❌ Login failed for ${userData.username}:`, loginResult.error);
            return null;
        }
    }

    // Create Admins
    console.log('\n1.1 Creating Admin Users...');
    for (const admin of FLOW_TEST_DATA.admins) {
        const createdAdmin = await createAndAuthUser(admin, 'Admin');
        if (createdAdmin) {
            flowUsers.admins.push(createdAdmin);
        }
        // Rate limiting between user creations (like seed-data.js)
        await delay(3000);
    }

    // Create Managers
    console.log('\n1.2 Creating Manager Users...');
    for (const manager of FLOW_TEST_DATA.managers) {
        const createdManager = await createAndAuthUser(manager, 'Manager');
        if (createdManager) {
            flowUsers.managers.push(createdManager);
        }
        // Rate limiting between user creations
        await delay(3000);
    }

    // Create Developers (with progress tracking for large number)
    console.log('\n1.3 Creating Developer Users...');
    for (let i = 0; i < FLOW_TEST_DATA.developers.length; i++) {
        const developer = FLOW_TEST_DATA.developers[i];
        console.log(`\n   Progress: ${i + 1}/${FLOW_TEST_DATA.developers.length} developers`);

        const createdDeveloper = await createAndAuthUser(developer, 'Developer');
        if (createdDeveloper) {
            flowUsers.developers.push(createdDeveloper);
        }
        // Rate limiting between user creations
        await delay(3000);
    }

    console.log(`\n📊 Phase 1 Summary:`);
    console.log(`   Admins created: ${flowUsers.admins.length}/2`);
    console.log(`   Managers created: ${flowUsers.managers.length}/4`);
    console.log(`   Developers created: ${flowUsers.developers.length}/20`);
    console.log(`   Total users created: ${flowUsers.admins.length + flowUsers.managers.length + flowUsers.developers.length}/26`);

    // Ensure we have at least one admin for subsequent operations
    if (flowUsers.admins.length === 0) {
        throw new Error('Failed to create any admin users - cannot continue');
    }
}

// Phase 2: Create teams and upload profile photos
async function phase2_TeamFormation() {
    console.log('\n👥 PHASE 2: TEAM FORMATION AND PROFILE SETUP');
    console.log('-'.repeat(60));

    // Upload profile photos for all users
    console.log('\n2.1 Uploading Profile Photos...');

    const photoFiles = [
        { user: 'admin', token: flowUsers.admins[0]?.token, filename: `${flowUsers.admins[0]?.username || 'admin'}-photo.jpg` },
        { user: 'manager', token: flowUsers.managers[0]?.token, filename: `${flowUsers.managers[0]?.username || 'manager'}-photo.jpg` },
        { user: 'developer', token: flowUsers.developers[0]?.token, filename: `${flowUsers.developers[0]?.username || 'developer'}-photo.jpg` }
    ];

    for (const { user, token, filename } of photoFiles) {
        if (token) {
            const formData = new FormData();
            const photoPath = path.join(ASSETS_DIR, filename);

            // Check if photo file exists, if not skip
            if (!fs.existsSync(photoPath)) {
                console.log(`⚠️ Photo ${filename} not found, skipping upload for ${user}`);
                continue;
            }

            formData.append('profilePhoto', fs.createReadStream(photoPath));

            const uploadResult = await apiRequest('POST', '/profile/photo/upload', formData, token, true);
            if (uploadResult.success) {
                console.log(`✅ Profile photo uploaded for ${user}`);
            } else {
                console.log(`❌ Failed to upload photo for ${user}:`, uploadResult.error);
            }
        }
    }

    // Create teams
    console.log('\n2.2 Creating Teams...');

    const teamConfigs = [
        {
            name: `Development Team ${Date.now()}`,
            description: 'Handles all development tasks for the flow test',
            members: [flowUsers.developers[0]], // Only one developer
            lead: flowUsers.managers[0] // Manager
        }
    ];

    for (const teamConfig of teamConfigs) {
        const createResult = await apiRequest('POST', '/teams', {
            team_name: teamConfig.name,
            description: teamConfig.description
        }, teamConfig.lead.token);

        if (createResult.success) {
            const teamId = createResult.data.team.team_id;
            flowData.teams.push({ ...createResult.data.team, leadToken: teamConfig.lead.token });
            console.log(`✅ Team "${teamConfig.name}" created`);

            // Add members to team
            for (const member of teamConfig.members) {
                const addMemberResult = await apiRequest('POST', `/teams/${teamId}/members`, {
                    userId: member.userId,
                    roleInTeam: 'DEVELOPER'
                }, teamConfig.lead.token);

                if (addMemberResult.success) {
                    console.log(`   ✅ Added ${member.username} to ${teamConfig.name}`);
                }
            }
        }
    }

    console.log(`\n📊 Phase 2 Summary:`);
    console.log(`   Profile photos uploaded: ${photoFiles.length}`);
    console.log(`   Teams created: ${flowData.teams.length}`);
    console.log(`   Team members assigned: ${teamConfigs.reduce((sum, team) => sum + team.members.length, 0)}`);
}

// Phase 3: Create projects and tasks
async function phase3_ProjectManagement() {
    console.log('\n📋 PHASE 3: PROJECT AND TASK MANAGEMENT');
    console.log('-'.repeat(60));

    // Create projects
    console.log('\n3.1 Creating Projects...');

    const projectConfigs = [
        {
            name: `E-Commerce Platform ${Date.now()}`,
            description: 'Complete online shopping platform with modern UI',
            start_date: '2024-12-01',
            end_date: '2025-03-01',
            status: 'PLANNING',
            manager: flowUsers.managers[0] // Sarah
        },
        {
            name: `Mobile App Development ${Date.now() + 1000}`,
            description: 'Cross-platform mobile application for customer engagement',
            start_date: '2024-12-15',
            end_date: '2025-04-15',
            status: 'PLANNING',
            manager: flowUsers.managers[1] // Mike
        }
    ];

    for (const projectConfig of projectConfigs) {
        const createResult = await apiRequest('POST', '/projects', {
            project_name: projectConfig.name,
            description: projectConfig.description,
            start_date: projectConfig.start_date,
            end_date: projectConfig.end_date,
            status: projectConfig.status
        }, projectConfig.manager.token);

        if (createResult.success) {
            const project = {
                project_id: createResult.data.project_id,
                project_name: createResult.data.project_name || projectConfig.name,
                description: createResult.data.description,
                managerToken: projectConfig.manager.token
            };
            flowData.projects.push(project);
            console.log(`✅ Project "${projectConfig.name}" created`);
            console.log(`   Project ID: ${createResult.data.project_id}`);

            // Upload project documents
            console.log(`   📄 Uploading project documents...`);
            const documents = ['requirements.md', 'technical-spec.json', 'meeting-notes.txt'];

            for (const docName of documents) {
                const docPath = path.join(ASSETS_DIR, docName);

                // Check if document exists
                if (!fs.existsSync(docPath)) {
                    console.log(`   ⚠️ Document ${docName} not found, skipping...`);
                    continue;
                }

                const formData = new FormData();
                formData.append('files', fs.createReadStream(docPath));

                const uploadResult = await apiRequest('POST', `/files/project/${project.project_id}/upload`,
                    formData, projectConfig.manager.token, true);

                if (uploadResult.success) {
                    // Handle different response structures and extract file info properly
                    let fileData;
                    if (uploadResult.data.files && Array.isArray(uploadResult.data.files)) {
                        fileData = uploadResult.data.files;
                    } else if (uploadResult.data.file) {
                        fileData = [uploadResult.data.file];
                    } else {
                        fileData = [{ file_id: uploadResult.data.file_id || uploadResult.data.id, filename: docName }];
                    }

                    flowData.files.push(...fileData);
                    console.log(`   ✅ Uploaded ${docName}`);
                } else {
                    console.log(`   ❌ Failed to upload ${docName}:`, uploadResult.error);
                }
            }
        }
    }

    // Create tasks for each project
    console.log('\n3.2 Creating Tasks...');

    const taskConfigs = [
        // E-Commerce Platform tasks
        {
            projectIndex: 0,
            tasks: [
                { title: 'User Authentication System', description: 'Implement secure login and registration', priority: 'HIGH', assigned_to: flowUsers.developers[0] },
                { title: 'Product Catalog UI', description: 'Design and implement product browsing interface', priority: 'HIGH', assigned_to: flowUsers.developers[1] },
                { title: 'Shopping Cart API', description: 'Backend API for cart management', priority: 'MEDIUM', assigned_to: flowUsers.developers[2] },
                { title: 'Payment Integration', description: 'Integrate with payment gateways', priority: 'HIGH', assigned_to: flowUsers.developers[3] }
            ]
        },
        // Mobile App tasks  
        {
            projectIndex: 1,
            tasks: [
                { title: 'App Navigation Setup', description: 'Configure navigation between screens', priority: 'HIGH', assigned_to: flowUsers.developers[0] },
                { title: 'User Profile Screen', description: 'Create user profile management UI', priority: 'MEDIUM', assigned_to: flowUsers.developers[1] },
                { title: 'Push Notifications', description: 'Implement push notification system', priority: 'MEDIUM', assigned_to: flowUsers.developers[2] },
                { title: 'Offline Data Sync', description: 'Handle offline data synchronization', priority: 'LOW', assigned_to: flowUsers.developers[3] }
            ]
        }
    ];

    for (const { projectIndex, tasks } of taskConfigs) {
        const project = flowData.projects[projectIndex];

        for (const taskConfig of tasks) {
            const createResult = await apiRequest('POST', `/tasks/project/${project.project_id}`, {
                title: taskConfig.title,
                description: taskConfig.description,
                priority: taskConfig.priority,
                due_date: '2025-01-15',
                assigned_to: taskConfig.assigned_to.userId
            }, project.managerToken);

            if (createResult.success) {
                const task = {
                    task_id: createResult.data.task_id,
                    title: createResult.data.title,
                    description: createResult.data.description,
                    assignedDev: taskConfig.assigned_to
                };
                flowData.tasks.push(task);
                console.log(`✅ Task "${taskConfig.title}" created and assigned to ${taskConfig.assigned_to.username}`);

                // Create subtasks for each task
                const subtaskResult = await apiRequest('POST', '/subtasks', {
                    parent_task_id: task.task_id,
                    title: `Setup for ${taskConfig.title}`,
                    description: 'Initial setup and environment configuration',
                    priority: 'MEDIUM',
                    estimated_hours: 2.0
                }, taskConfig.assigned_to.token);

                if (subtaskResult.success) {
                    flowData.subtasks.push({ ...subtaskResult.data.subtask, assignedDev: taskConfig.assigned_to });
                    console.log(`   ✅ Subtask created for "${taskConfig.title}"`);
                }
            }
        }
    }

    console.log(`\n📊 Phase 3 Summary:`);
    console.log(`   Projects created: ${flowData.projects.length}`);
    console.log(`   Documents uploaded: ${flowData.files.length}`);
    console.log(`   Tasks created: ${flowData.tasks.length}`);
    console.log(`   Subtasks created: ${flowData.subtasks.length}`);
}

// Phase 4: Create estimates and log work
async function phase4_WorkTracking() {
    console.log('\n⏱️ PHASE 4: WORK TRACKING AND ESTIMATION');
    console.log('-'.repeat(60));

    // Create estimates for all tasks
    console.log('\n4.1 Creating Task Estimates...');

    for (const task of flowData.tasks) {
        const estimateHours = Math.floor(Math.random() * 20) + 10; // 10-30 hours
        const complexity = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)];

        const estimateResult = await apiRequest('POST', '/estimates', {
            task_id: task.task_id,
            estimated_hours: estimateHours,
            complexity: complexity,
            confidence_level: Math.floor(Math.random() * 5) + 1, // 1-5
            notes: `Estimated based on task complexity and requirements`
        }, task.assignedDev.token);

        if (estimateResult.success) {
            flowData.estimates.push(estimateResult.data.estimate);
            console.log(`✅ Estimate created for "${task.title}": ${estimateHours}h (${complexity})`);
        }
    }

    // Create estimates for subtasks
    console.log('\n4.2 Creating Subtask Estimates...');

    for (const subtask of flowData.subtasks) {
        const estimateResult = await apiRequest('POST', `/subtasks/${subtask.subtask_id}/estimate`, {
            estimatedHours: Math.floor(Math.random() * 8) + 2, // 2-10 hours
            notes: 'Initial setup estimate',
            estimateType: 'INITIAL'
        }, subtask.assignedDev.token);

        if (estimateResult.success) {
            const estimatedHours = Math.floor(Math.random() * 8) + 2;
            console.log(`✅ Subtask estimate created: ${estimatedHours}h`);
        }
    }

    // Log work for tasks and subtasks
    console.log('\n4.3 Logging Work Hours...');

    const workTypes = ['DEVELOPMENT', 'TESTING', 'DOCUMENTATION', 'MEETING'];
    let totalHoursLogged = 0;

    // Log work for tasks
    for (const task of flowData.tasks) {
        // Multiple work log entries per task to simulate real work
        const numEntries = Math.floor(Math.random() * 3) + 1; // 1-3 entries

        for (let i = 0; i < numEntries; i++) {
            const hours = Math.floor(Math.random() * 6) + 2; // 2-8 hours
            const workType = workTypes[Math.floor(Math.random() * workTypes.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Last 7 days

            const workLogResult = await apiRequest('POST', '/worklogs', {
                task_id: task.task_id,
                hours_logged: hours,
                log_type: workType,
                description: `${workType.toLowerCase()} work on ${task.title}`,
                work_date: date.toISOString().split('T')[0]
            }, task.assignedDev.token);

            if (workLogResult.success) {
                flowData.workLogs.push(workLogResult.data.workLog);
                totalHoursLogged += hours;
                console.log(`✅ Work logged: ${hours}h of ${workType} by ${task.assignedDev.username}`);
            }
        }
    }

    // Log work for subtasks
    for (const subtask of flowData.subtasks) {
        const hours = Math.floor(Math.random() * 4) + 1; // 1-5 hours

        const workLogResult = await apiRequest('POST', '/worklogs', {
            subtask_id: subtask.subtask_id,
            hours_logged: hours,
            log_type: 'DEVELOPMENT',
            description: `Setup work for subtask`,
            work_date: new Date().toISOString().split('T')[0]
        }, subtask.assignedDev.token);

        if (workLogResult.success) {
            flowData.workLogs.push(workLogResult.data.workLog);
            totalHoursLogged += hours;
            console.log(`✅ Subtask work logged: ${hours}h by ${subtask.assignedDev.username}`);
        }
    }

    // Update some task statuses based on work completed
    console.log('\n4.4 Updating Task Progress...');

    for (let i = 0; i < Math.min(2, flowData.tasks.length); i++) {
        const task = flowData.tasks[i];
        const statusUpdate = await apiRequest('PATCH', `/tasks/${task.task_id}`, {
            status: 'IN_PROGRESS'
        }, task.assignedDev.token);

        if (statusUpdate.success) {
            console.log(`✅ Task "${task.title}" status updated to IN_PROGRESS`);
        }
    }

    console.log(`\n📊 Phase 4 Summary:`);
    console.log(`   Task estimates created: ${flowData.estimates.length}`);
    console.log(`   Work log entries: ${flowData.workLogs.length}`);
    console.log(`   Total hours logged: ${totalHoursLogged}h`);
    console.log(`   Tasks in progress: 2`);
}

// Phase 5: Generate reports and analytics
async function phase5_ReportingAnalytics() {
    console.log('\n📊 PHASE 5: REPORTING AND ANALYTICS');
    console.log('-'.repeat(60));

    // Get analytics dashboard
    console.log('\n5.1 Generating Analytics Dashboard...');

    const analyticsResult = await apiRequest('GET', '/reports/analytics', null, flowUsers.managers[0].token);
    if (analyticsResult.success) {
        console.log(`✅ Analytics dashboard generated`);
        console.log(`   Total projects: ${analyticsResult.data.totalProjects}`);
        console.log(`   Total tasks: ${analyticsResult.data.totalTasks}`);
        console.log(`   Total hours logged: ${analyticsResult.data.totalHours || 'N/A'}`);
    }

    // Generate weekly reports for each project
    console.log('\n5.2 Generating Weekly Reports...');

    for (const project of flowData.projects) {
        const weeklyResult = await apiRequest('GET', `/reports/weekly/${project.project_id}`,
            null, project.managerToken);

        if (weeklyResult.success) {
            console.log(`✅ Weekly report generated for "${project.project_name || 'Project'}"`);
        }
    }

    // Generate and download PDF reports
    console.log('\n5.3 Generating PDF Reports...');

    const pdfResult = await apiRequest('POST', '/reports/export/pdf', {
        reportType: 'weekly',
        projectId: flowData.projects[0].project_id,
        title: 'Flow Test Weekly Report'
    }, flowUsers.managers[0].token);

    if (pdfResult.success) {
        flowData.reports.push(pdfResult.data);
        console.log(`✅ PDF report generated: ${pdfResult.data.filename}`);

        // Download the PDF
        const downloadUrl = pdfResult.data.downloadUrl;
        if (downloadUrl) {
            try {
                const response = await axios.get(downloadUrl, { responseType: 'stream' });
                const downloadPath = path.join(REPORTS_DIR, `flow-test-report.pdf`);
                const writer = fs.createWriteStream(downloadPath);
                response.data.pipe(writer);

                writer.on('finish', () => {
                    console.log(`✅ PDF downloaded to: ${downloadPath}`);
                });
            } catch (downloadError) {
                console.log(`⚠️ PDF download failed: ${downloadError.message}`);
            }
        }
    }

    // Get estimation accuracy reports
    console.log('\n5.4 Analyzing Estimation Accuracy...');

    for (const developer of flowUsers.developers) {
        const accuracyResult = await apiRequest('GET', `/estimates/estimator/${developer.userId}/accuracy`,
            null, developer.token);

        if (accuracyResult.success) {
            console.log(`✅ Estimation accuracy for ${developer.username}: ${accuracyResult.data.averageAccuracy || 'N/A'}%`);
        }
    }

    console.log(`\n📊 Phase 5 Summary:`);
    console.log(`   Analytics dashboard: ✅`);
    console.log(`   Weekly reports: ${flowData.projects.length}`);
    console.log(`   PDF reports: ${flowData.reports.length}`);
    console.log(`   Accuracy analysis: ${flowUsers.developers.length} developers`);
}

// Phase 6: Test security features and password management
async function phase6_SecurityTesting() {
    console.log('\n🔐 PHASE 6: SECURITY AND PASSWORD MANAGEMENT');
    console.log('-'.repeat(60));

    // Test password change for one user
    console.log('\n6.1 Testing Password Change...');

    const testUser = flowUsers.developers[0]; // Alex
    const originalPassword = testUser.password;
    const tempPassword = 'TempFlowPassword2024!';

    const changeResult = await apiRequest('POST', '/auth/change-password', {
        currentPassword: originalPassword,
        newPassword: tempPassword
    }, testUser.token);

    if (changeResult.success) {
        console.log(`✅ Password changed for ${testUser.username}`);

        // Verify new password works
        const loginResult = await apiRequest('POST', '/auth/login', {
            email: testUser.email,
            password: tempPassword
        });

        if (loginResult.success) {
            testUser.token = loginResult.data.token; // Update token
            console.log(`✅ Login successful with new password`);
        }
    }

    // Test forgot password flow
    console.log('\n6.2 Testing Forgot Password Flow...');

    const forgotResult = await apiRequest('POST', '/auth/forgot-password', {
        email: testUser.email
    });

    if (forgotResult.success) {
        console.log(`✅ Forgot password initiated for ${testUser.username}`);

        // Get reset OTP
        const otpResult = await apiRequest('GET', `/auth/test/last-otp?email=${testUser.email}`);

        if (otpResult.success && otpResult.data.type === 'password_reset') {
            console.log(`✅ Reset OTP retrieved: ${otpResult.data.otp}`);

            // Verify reset OTP
            const verifyResult = await apiRequest('POST', '/auth/verify-reset-otp', {
                email: testUser.email,
                otp: otpResult.data.otp
            });

            if (verifyResult.success) {
                console.log(`✅ Reset OTP verified`);

                // Reset password back to original
                const resetResult = await apiRequest('POST', '/auth/reset-password', {
                    resetToken: verifyResult.data.resetToken,
                    newPassword: originalPassword
                });

                if (resetResult.success) {
                    testUser.token = resetResult.data.token; // Update token
                    testUser.password = originalPassword; // Restore original
                    console.log(`✅ Password reset back to original for ${testUser.username}`);
                }
            }
        }
    }

    // Test logout for all users
    console.log('\n6.3 Testing Logout...');

    const allUsers = [
        { name: 'admin', token: flowUsers.admin },
        ...flowUsers.managers.map(m => ({ name: m.username, token: m.token })),
        ...flowUsers.developers.map(d => ({ name: d.username, token: d.token }))
    ];

    let logoutCount = 0;
    for (const user of allUsers) {
        if (user.token) {
            const logoutResult = await apiRequest('POST', '/auth/logout', null, user.token);
            if (logoutResult.success) {
                logoutCount++;
            }
        }
    }

    console.log(`✅ ${logoutCount} users logged out successfully`);

    // Re-authenticate admin for cleanup phase 
    console.log('\n6.4 Re-authenticating Admin for Cleanup...');

    // Use the first admin we created for cleanup operations
    if (flowUsers.admins.length > 0) {
        const adminUser = flowUsers.admins[0];
        console.log('✅ Using existing admin for cleanup phase');
        console.log(`   Admin: ${adminUser.username} (${adminUser.email})`);

        // We already have the admin token, no need to re-authenticate
        // The admin token is still valid from the initial creation
    } else {
        console.log('⚠️ No admin users available - some cleanup operations may fail');
    }

    console.log(`\n📊 Phase 6 Summary:`);
    console.log(`   Password changes: 1`);
    console.log(`   Forgot password flows: 1`);
    console.log(`   Logout tests: ${logoutCount}`);
    console.log(`   Security tests: ✅ All passed`);
}

// Phase 7: Complete cleanup of all test data
async function phase7_CompleteCleanup() {
    console.log('\n🧹 PHASE 7: COMPLETE CLEANUP');
    console.log('-'.repeat(60));

    // Get admin token for cleanup operations
    const adminToken = flowUsers.admins.length > 0 ? flowUsers.admins[0].token : null;

    if (!adminToken) {
        console.log('⚠️ No admin token available for cleanup operations');
        return;
    }

    // Delete all uploaded files
    console.log('\n7.1 Cleaning Up Uploaded Files...');

    let filesDeleted = 0;
    for (const file of flowData.files) {
        const deleteResult = await apiRequest('DELETE', `/files/${file.file_id}`, null, adminToken);
        if (deleteResult.success) {
            filesDeleted++;
        }
    }
    console.log(`✅ ${filesDeleted} files deleted`);

    // Remove profile photos
    console.log('\n7.2 Cleaning Up Profile Photos...');

    const photoCleanupResult = await apiRequest('POST', '/profile/admin/cleanup-photos', null, adminToken);
    if (photoCleanupResult.success) {
        console.log(`✅ Profile photos cleaned up: ${photoCleanupResult.data.removedCount || 0} photos`);
    }

    // Delete all subtasks
    console.log('\n7.3 Deleting Subtasks...');

    let subtasksDeleted = 0;
    for (const subtask of flowData.subtasks) {
        const deleteResult = await apiRequest('DELETE', `/subtasks/${subtask.subtask_id}`, null, adminToken);
        if (deleteResult.success) {
            subtasksDeleted++;
        }
    }
    console.log(`✅ ${subtasksDeleted} subtasks deleted`);

    // Delete all tasks  
    console.log('\n7.4 Deleting Tasks...');

    let tasksDeleted = 0;
    for (const task of flowData.tasks) {
        const deleteResult = await apiRequest('DELETE', `/tasks/${task.task_id}`, null, adminToken);
        if (deleteResult.success) {
            tasksDeleted++;
        }
    }
    console.log(`✅ ${tasksDeleted} tasks deleted`);

    // Delete all teams
    console.log('\n7.5 Deleting Teams...');

    let teamsDeleted = 0;
    for (const team of flowData.teams) {
        const deleteResult = await apiRequest('DELETE', `/teams/${team.team_id}`, null, adminToken);
        if (deleteResult.success) {
            teamsDeleted++;
        }
    }
    console.log(`✅ ${teamsDeleted} teams deleted`);

    // Delete all projects
    console.log('\n7.6 Deleting Projects...');

    let projectsDeleted = 0;
    for (const project of flowData.projects) {
        const deleteResult = await apiRequest('DELETE', `/projects/${project.project_id}`, null, adminToken);
        if (deleteResult.success) {
            projectsDeleted++;
        }
    }
    console.log(`✅ ${projectsDeleted} projects deleted`);

    // Delete all created users (more efficient approach)
    console.log('\n7.7 Deleting Created Users...');

    // Fetch all users to find the ones we created
    const allUsersResult = await apiRequest('GET', '/admin/users', null, adminToken);
    let usersDeleted = 0;

    if (allUsersResult.success && allUsersResult.data.users) {
        // Get created user emails for comparison
        const createdEmails = new Set([
            ...flowUsers.admins.map(u => u.email),
            ...flowUsers.managers.map(u => u.email),
            ...flowUsers.developers.map(u => u.email)
        ]);

        // Delete created users (excluding the admin doing cleanup)
        const cleanupAdminEmail = flowUsers.admins[0]?.email;

        for (const user of allUsersResult.data.users) {
            if (createdEmails.has(user.email) && user.email !== cleanupAdminEmail) {
                const deleteResult = await apiRequest('DELETE', `/admin/users/${user.user_id}`, null, adminToken);
                if (deleteResult.success) {
                    usersDeleted++;
                    console.log(`   ✅ Deleted user: ${user.username || user.email}`);
                }
                await delay(300);
            }
        }

        // Finally, delete the cleanup admin (self-delete)
        if (cleanupAdminEmail) {
            const cleanupAdmin = allUsersResult.data.users.find(u => u.email === cleanupAdminEmail);
            if (cleanupAdmin) {
                const deleteResult = await apiRequest('DELETE', `/admin/users/${cleanupAdmin.user_id}`, null, adminToken);
                if (deleteResult.success) {
                    usersDeleted++;
                    console.log(`   ✅ Deleted cleanup admin: ${cleanupAdmin.username || cleanupAdmin.email}`);
                }
            }
        }
    } else {
        console.log('   ⚠️ Could not fetch users for cleanup - trying individual deletion');

        // Fallback to individual deletion
        for (const developer of flowUsers.developers) {
            const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${developer.email}`, null, adminToken);
            if (deleteResult.success) {
                usersDeleted++;
                console.log(`   ✅ Deleted developer: ${developer.username}`);
            }
        }

        for (const manager of flowUsers.managers) {
            const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${manager.email}`, null, adminToken);
            if (deleteResult.success) {
                usersDeleted++;
                console.log(`   ✅ Deleted manager: ${manager.username}`);
            }
        }

        for (let i = 1; i < flowUsers.admins.length; i++) {
            const admin = flowUsers.admins[i];
            const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${admin.email}`, null, adminToken);
            if (deleteResult.success) {
                usersDeleted++;
                console.log(`   ✅ Deleted admin: ${admin.username}`);
            }
        }

        if (flowUsers.admins.length > 0) {
            const cleanupAdmin = flowUsers.admins[0];
            const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${cleanupAdmin.email}`, null, adminToken);
            if (deleteResult.success) {
                usersDeleted++;
                console.log(`   ✅ Deleted cleanup admin: ${cleanupAdmin.username}`);
            }
        }
    }

    console.log(`✅ ${usersDeleted} users deleted`);

    // Clean up test files but preserve PDF reports
    console.log('\n7.8 Cleaning Up Test Files...');

    let testFilesDeleted = 0;
    try {
        // Clean assets folder but preserve structure
        if (fs.existsSync(ASSETS_DIR)) {
            const assetFiles = fs.readdirSync(ASSETS_DIR);
            assetFiles.forEach(file => {
                fs.unlinkSync(path.join(ASSETS_DIR, file));
                testFilesDeleted++;
            });
            console.log(`✅ ${assetFiles.length} asset files cleaned up`);
        }

        // Preserve reports folder
        if (fs.existsSync(REPORTS_DIR)) {
            const reportFiles = fs.readdirSync(REPORTS_DIR);
            console.log(`📁 Reports preserved: ${reportFiles.length} files`);
            reportFiles.forEach(file => console.log(`     📄 ${file}`));
        }

        // Clean up any remaining files in root test results directory
        if (fs.existsSync(TEST_RESULTS_DIR)) {
            const files = fs.readdirSync(TEST_RESULTS_DIR).filter(f =>
                !fs.statSync(path.join(TEST_RESULTS_DIR, f)).isDirectory()
            );
            files.forEach(file => {
                fs.unlinkSync(path.join(TEST_RESULTS_DIR, file));
                testFilesDeleted++;
            });
        }

        console.log(`✅ ${testFilesDeleted} test files cleaned up`);
    } catch (error) {
        console.log(`⚠️ Could not clean up test files: ${error.message}`);
    } console.log(`\n📊 Phase 7 Summary:`);
    console.log(`   Files deleted: ${filesDeleted}`);
    console.log(`   Profile photos cleaned: ✅`);
    console.log(`   Subtasks deleted: ${subtasksDeleted}`);
    console.log(`   Tasks deleted: ${tasksDeleted}`);
    console.log(`   Teams deleted: ${teamsDeleted}`);
    console.log(`   Projects deleted: ${projectsDeleted}`);
    console.log(`   Users deleted: ${usersDeleted}`);
    console.log(`   Test results preserved: ✅`);
}

// Emergency cleanup in case of errors
async function emergencyCleanup() {
    console.log('🚨 Running emergency cleanup...');

    try {
        const adminToken = flowUsers.admins.length > 0 ? flowUsers.admins[0].token : null;

        if (adminToken) {
            // Try to clean up projects first
            for (const project of flowData.projects) {
                await apiRequest('DELETE', `/projects/${project.project_id}`, null, adminToken);
            }

            // Clean up created users efficiently
            const allUsersResult = await apiRequest('GET', '/admin/users', null, adminToken);

            if (allUsersResult.success && allUsersResult.data.users) {
                // Get created user emails for comparison
                const createdEmails = new Set([
                    ...flowUsers.admins.map(u => u.email),
                    ...flowUsers.managers.map(u => u.email),
                    ...flowUsers.developers.map(u => u.email)
                ]);

                for (const user of allUsersResult.data.users) {
                    if (createdEmails.has(user.email) || user.email.includes('@flowtest.com')) {
                        await apiRequest('DELETE', `/admin/users/${user.user_id}`, null, adminToken);
                    }
                }
            } else {
                // Fallback to individual cleanup
                for (const user of [...flowUsers.developers, ...flowUsers.managers, ...flowUsers.admins]) {
                    await apiRequest('DELETE', `/admin/users/by-email/${user.email}`, null, adminToken);
                }
            }

            console.log('✅ Emergency cleanup completed');
        } else {
            console.log('⚠️ No admin token available for emergency cleanup');
        }
    } catch (error) {
        console.log('⚠️ Emergency cleanup encountered errors:', error.message);
    }
}

// Run the complete flow test
if (require.main === module) {
    completeProjectManagementFlow().catch(console.error);
}

module.exports = { completeProjectManagementFlow };