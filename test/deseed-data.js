// deseed-data.js - Clean up sample data from database
const axios = require('axios');

// Base URL for your API
const BASE_URL = 'http://localhost:5000/api';

// Test users that should exist
const TEST_USERS = {
    admin: { email: 'testadmin@testapp.com', password: 'testpass123' },
    manager: { email: 'testmanager@testapp.com', password: 'testpass123' },
    developer: { email: 'testdeveloper@testapp.com', password: 'testpass123' }
};

let tokens = {};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
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

// Login users to get tokens
async function loginUsers() {
    console.log('\n🔐 LOGGING IN FOR CLEANUP');
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

// Delete sample projects and their tasks
async function deleteSampleProjects() {
    console.log('\n📋 CLEANING UP SAMPLE PROJECTS & TASKS');
    console.log('='.repeat(50));

    if (!tokens.manager) {
        console.log('❌ No manager token available');
        return;
    }

    // Get all projects
    const projectsResult = await apiRequest('GET', '/projects', null, tokens.manager);
    if (!projectsResult.success) {
        console.log('❌ Failed to get projects:', projectsResult.error);
        return;
    }

    const projects = projectsResult.data.projects || projectsResult.data || [];
    const sampleProjectNames = [
        'E-Commerce Platform',
        'Mobile Banking App',
        'AI Chat Assistant',
        'Inventory Management System',
        'Social Media Dashboard',
        'Test Project API',  // From previous test runs
        'Updated Test Project API'
    ];

    console.log(`📊 Found ${projects.length} total projects in database`);

    const projectsToDelete = projects.filter(project =>
        sampleProjectNames.some(name => project.project_name?.includes(name))
    );

    console.log(`🎯 Identified ${projectsToDelete.length} sample projects to delete`);

    if (projectsToDelete.length === 0) {
        console.log('ℹ️  No sample projects found to delete');
        return;
    }

    let deletedCount = 0;
    for (const project of projectsToDelete) {
        console.log(`🗑️ Deleting project: ${project.project_name}`);

        const deleteResult = await apiRequest('DELETE', `/projects/${project.project_id}`, null, tokens.manager);
        if (deleteResult.success) {
            console.log(`✅ Deleted project: ${project.project_name}`);
            deletedCount++;
        } else {
            console.log(`❌ Failed to delete project ${project.project_name}:`, deleteResult.error);
        }
    }

    console.log(`📊 Project cleanup summary: ${deletedCount}/${projectsToDelete.length} projects deleted`);
}

// Clean up sample holidays
async function deleteSampleHolidays() {
    console.log('\n📅 CLEANING UP SAMPLE HOLIDAYS');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available');
        return;
    }

    // Get all holidays
    const holidaysResult = await apiRequest('GET', '/calendar/holidays', null, tokens.admin);
    if (!holidaysResult.success) {
        console.log('❌ Failed to get holidays:', holidaysResult.error);
        return;
    }

    const holidays = holidaysResult.data.holidays || holidaysResult.data || [];
    const sampleHolidayNames = [
        'New Year\'s Day',
        'Martin Luther King Jr. Day',
        'Presidents Day',
        'Memorial Day',
        'Independence Day',
        'Labor Day',
        'Thanksgiving',
        'Christmas Day',
        'Company Annual Party',
        'Test API Holiday',  // From previous test runs
        'Updated Test API Holiday'
    ];

    console.log(`📊 Found ${holidays.length} total holidays in database`);

    const holidaysToDelete = holidays.filter(holiday =>
        sampleHolidayNames.includes(holiday.holiday_name)
    );

    console.log(`🎯 Identified ${holidaysToDelete.length} sample holidays to delete`);

    if (holidaysToDelete.length === 0) {
        console.log('ℹ️  No sample holidays found to delete');
        return;
    }

    let deletedCount = 0;
    for (const holiday of holidaysToDelete) {
        console.log(`🗑️ Deleting holiday: ${holiday.holiday_name}`);

        const deleteResult = await apiRequest('DELETE', `/calendar/holidays/${holiday.holiday_id}`, null, tokens.admin);
        if (deleteResult.success) {
            console.log(`✅ Deleted holiday: ${holiday.holiday_name}`);
            deletedCount++;
        } else {
            console.log(`❌ Failed to delete holiday ${holiday.holiday_name}:`, deleteResult.error);
        }
    }

    console.log(`📊 Holiday cleanup summary: ${deletedCount}/${holidaysToDelete.length} holidays deleted`);
}

// Clean up profile photos (but keep current ones, just remove old versions)
async function cleanupProfilePhotos() {
    console.log('\n📷 CLEANING UP SAMPLE PROFILE PHOTOS');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available');
        return;
    }

    // First cleanup old photos
    const oldCleanupResult = await apiRequest('POST', '/profile/admin/cleanup-photos', null, tokens.admin);
    if (oldCleanupResult.success) {
        console.log('✅ Cleaned up old profile photos');
        console.log(`   Removed old photos: ${oldCleanupResult.data.removed || 0}`);
    } else {
        console.log('❌ Failed to cleanup old profile photos:', oldCleanupResult.error);
    }

    // Then cleanup ALL sample photos from storage
    const sampleCleanupResult = await apiRequest('POST', '/profile/admin/cleanup-sample-photos', null, tokens.admin);
    if (sampleCleanupResult.success) {
        console.log('✅ Cleaned up sample profile photos from storage');
        console.log(`   Removed sample photos: ${sampleCleanupResult.data.removed || 0}`);
    } else {
        console.log('❌ Failed to cleanup sample profile photos:', sampleCleanupResult.error);
    }
}

// Delete sample users created by seed script
async function deleteSampleUsers() {
    console.log('\n👥 CLEANING UP SAMPLE USERS');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available for user cleanup');
        return;
    }

    // Sample users created by seed script
    const sampleUserEmails = [
        'alice@company.com',
        'bob@company.com',
        'carol@company.com',
        'david@company.com',
        'eve@company.com'
    ];

    let deletedCount = 0;
    let notFoundCount = 0;

    for (const email of sampleUserEmails) {
        console.log(`🔍 Checking user: ${email}`);

        const deleteResult = await apiRequest('DELETE', `/admin/users/by-email/${encodeURIComponent(email)}`, null, tokens.admin);
        if (deleteResult.success) {
            console.log(`✅ Deleted user: ${email}`);
            deletedCount++;
        } else if (deleteResult.status === 404) {
            console.log(`ℹ️  User not found: ${email} (already deleted or never existed)`);
            notFoundCount++;
        } else {
            console.log(`❌ Failed to delete user ${email}:`, deleteResult.error);
        }
    }

    console.log(`📊 Sample user cleanup summary:`);
    console.log(`   ✅ Deleted: ${deletedCount} users`);
    console.log(`   ℹ️  Not found: ${notFoundCount} users`);
    console.log(`   📝 Total checked: ${sampleUserEmails.length} users`);
}

// Clean up pending registrations and OTPs
async function cleanupPendingRegistrations() {
    console.log('\n🧹 CLEANING UP PENDING REGISTRATIONS & OTPs');
    console.log('='.repeat(50));

    if (!tokens.admin) {
        console.log('❌ No admin token available for database cleanup');
        return;
    }

    // We'll need to add an admin endpoint to clean these tables
    // For now, let's try to clean them via a direct cleanup endpoint
    try {
        const cleanupResult = await apiRequest('POST', '/admin/cleanup-pending-data', null, tokens.admin);
        if (cleanupResult.success) {
            console.log('✅ Cleaned up pending registrations and OTPs');
            console.log(`   Removed pending registrations: ${cleanupResult.data.pending_registrations || 0}`);
            console.log(`   Removed expired OTPs: ${cleanupResult.data.expired_otps || 0}`);
        } else {
            console.log('⚠️  Admin cleanup endpoint not available');
            console.log('   You may need to manually clean up:');
            console.log('   - email_otps table');
            console.log('   - pending_registrations table');
        }
    } catch (error) {
        console.log('⚠️  Could not clean up database tables automatically');
        console.log('💡 Manual cleanup needed in Supabase for:');
        console.log('   - email_otps table (DELETE FROM email_otps)');
        console.log('   - pending_registrations table (DELETE FROM pending_registrations)');
    }
}// Main cleanup function
async function cleanupDatabase() {
    console.log('🧹 CLEANING UP DATABASE - REMOVING SAMPLE DATA');
    console.log('='.repeat(60));
    console.log(`Target API: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        await loginUsers();
        await deleteSampleProjects();
        await deleteSampleHolidays();
        await deleteSampleUsers();
        await cleanupProfilePhotos();
        await cleanupPendingRegistrations();

        console.log('\n🎯 CLEANUP COMPLETED!');
        console.log('='.repeat(60));
        console.log('✅ Sample projects and tasks removed');
        console.log('✅ Sample holidays removed');
        console.log('✅ Sample users removed');
        console.log('✅ Sample profile photos removed from storage');
        console.log('✅ Database cleanup completed');
        console.log('\n🏁 Database and storage are now clean and ready for fresh seeding!');

    } catch (error) {
        console.error('\n💥 ERROR DURING CLEANUP:', error.message);
    }
}

// Run the cleanup script
if (require.main === module) {
    cleanupDatabase();
}

module.exports = { cleanupDatabase };