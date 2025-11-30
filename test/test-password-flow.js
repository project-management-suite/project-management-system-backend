const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function testCompletePasswordFlow() {
    console.log('🔐 Testing Complete Password Reset Flow...\n');

    try {
        const testEmail = 'testmanager@testapp.com';
        const originalPassword = 'testpass123';
        const tempPassword = 'temporarypassword456';

        // Step 1: Verify current login works with original password
        console.log('Step 1: Verify current login with original password...');
        const initialLogin = await axios.post(BASE_URL + '/auth/login', {
            email: testEmail,
            password: originalPassword
        });
        console.log('✅ Initial login successful');
        let token = initialLogin.data.token;

        // Step 2: Test change password (authenticated)
        console.log('\nStep 2: Testing change password to temporary...');
        const changeResponse = await axios.post(BASE_URL + '/auth/change-password', {
            currentPassword: originalPassword,
            newPassword: tempPassword
        }, {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('✅ Password changed to temporary password');

        // Step 3: Verify new temporary password works
        console.log('\nStep 3: Testing login with temporary password...');
        const tempLogin = await axios.post(BASE_URL + '/auth/login', {
            email: testEmail,
            password: tempPassword
        });
        console.log('✅ Login with temporary password successful');

        // Step 4: Test forgot password flow to reset back
        console.log('\nStep 4: Testing forgot password to reset back...');
        const forgotResponse = await axios.post(BASE_URL + '/auth/forgot-password', {
            email: testEmail
        });
        console.log('✅ Forgot password initiated');

        // Step 5: Get reset OTP
        console.log('\nStep 5: Getting reset OTP...');
        const otpResponse = await axios.get(BASE_URL + '/auth/test/last-otp?email=' + testEmail);
        const resetOTP = otpResponse.data.otp;
        console.log('✅ Got reset OTP:', resetOTP);

        // Step 6: Verify reset OTP
        console.log('\nStep 6: Verifying reset OTP...');
        const verifyResponse = await axios.post(BASE_URL + '/auth/verify-reset-otp', {
            email: testEmail,
            otp: resetOTP
        });
        console.log('✅ Reset OTP verified');
        const resetToken = verifyResponse.data.resetToken;

        // Step 7: Reset password back to ORIGINAL
        console.log('\nStep 7: Resetting password back to ORIGINAL...');
        const resetResponse = await axios.post(BASE_URL + '/auth/reset-password', {
            resetToken: resetToken,
            newPassword: originalPassword  // BACK TO ORIGINAL!
        });
        console.log('✅ Password reset to ORIGINAL complete:', resetResponse.data.message);

        // Step 8: Verify original password works again
        console.log('\nStep 8: Final verification with original password...');
        const finalLogin = await axios.post(BASE_URL + '/auth/login', {
            email: testEmail,
            password: originalPassword  // ORIGINAL PASSWORD
        });
        console.log('✅ Final login successful - original password RESTORED');

        // Step 9: Test logout
        console.log('\nStep 9: Testing logout...');
        const logoutResponse = await axios.post(BASE_URL + '/auth/logout', {}, {
            headers: { Authorization: 'Bearer ' + finalLogin.data.token }
        });
        console.log('✅ Logout successful:', logoutResponse.data.message);

        console.log('\n🎉 COMPLETE PASSWORD FLOW TESTED SUCCESSFULLY!');
        console.log('✅ All 5 new password endpoints working correctly:');
        console.log('   • POST /auth/forgot-password ✅');
        console.log('   • POST /auth/verify-reset-otp ✅');
        console.log('   • POST /auth/reset-password ✅');
        console.log('   • POST /auth/change-password ✅');
        console.log('   • POST /auth/logout ✅');
        console.log('');
        console.log('🔒 SECURITY: Original password RESTORED for testmanager@testapp.com');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('⚠️  You may need to manually reset password for testmanager@testapp.com');
    }
}

testCompletePasswordFlow();