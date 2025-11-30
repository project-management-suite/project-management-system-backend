// src/models/otp.model.js
const { supabase } = require('../config/supabase');

class OTPModel {
    // Store OTP for verification
    static async storeOTP(email, otp) {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // First, delete any existing OTP for this email
        await supabase
            .from('email_otps')
            .delete()
            .eq('email', email);

        // Insert new OTP
        const { data, error } = await supabase
            .from('email_otps')
            .insert([{
                email,
                otp,
                expires_at: expiresAt.toISOString(),
                used: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Store pending user data
    static async storePendingUser(email, userData) {
        const { error } = await supabase
            .from('pending_registrations')
            .upsert([{
                email,
                user_data: userData,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;
    }

    // Get pending user data
    static async getPendingUser(email) {
        const { data, error } = await supabase
            .from('pending_registrations')
            .select('user_data')
            .eq('email', email)
            .single();

        if (error || !data) return null;
        return data.user_data;
    }

    // Delete pending user data
    static async deletePendingUser(email) {
        const { error } = await supabase
            .from('pending_registrations')
            .delete()
            .eq('email', email);

        if (error) throw error;
    }

    // Get OTP for testing purposes (development only)
    static async getOTP(email) {
        const { data, error } = await supabase
            .from('email_otps')
            .select('*')
            .eq('email', email)
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        // Check if OTP is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);

        if (now > expiresAt) {
            return null; // Expired
        }

        return {
            otp: data.otp,
            created_at: data.created_at,
            expires_at: data.expires_at,
            email: data.email
        };
    }

    // Verify OTP
    static async verifyOTP(email, otp) {
        const { data, error } = await supabase
            .from('email_otps')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .eq('used', false)
            .single();

        if (error || !data) {
            return { valid: false, message: 'Invalid OTP' };
        }

        // Check if OTP is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);

        if (now > expiresAt) {
            return { valid: false, message: 'OTP has expired' };
        }

        // Mark OTP as used
        await supabase
            .from('email_otps')
            .update({ used: true })
            .eq('email', email)
            .eq('otp', otp);

        return { valid: true, message: 'OTP verified successfully' };
    }

    // Clean up expired OTPs (for cleanup jobs)
    static async cleanupExpiredOTPs() {
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('email_otps')
            .delete()
            .lt('expires_at', now);

        if (error) throw error;
    }
}

module.exports = OTPModel;