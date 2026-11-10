// Import the reusable Supabase connection
import { supabase } from '../supabase.js';

// Get the login form
const loginForm = document.getElementById('loginForm');

// Handle administrator login
loginForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    // Get email and password
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Get message area
    const message = document.getElementById('message');

    message.textContent = 'Logging in...';

    // Authenticate administrator
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    // Check login error
    if (error) {
        message.textContent = error.message;
        return;
    }

    // Check administrator profile
    const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

    // Verify administrator role
    if (profileError || !profile || profile.role !== 'admin') {

        await supabase.auth.signOut();

        message.textContent = 'Administrator access denied.';
        return;
    }

    // Login successful
    message.textContent = 'Login successful!';

    window.location.href = 'dashboard.html';

});