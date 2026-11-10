
import { supabase } from '../supabase.js';

// Check administrator access
async function checkAdmin() {

    // Get current logged-in user
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = 'admin.html';
        return;
    }

    // Check administrator profile
    const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

    // Reject users without admin access
    if (profileError || !profile || profile.role !== 'admin') {

        await supabase.auth.signOut();

        window.location.href = 'admin.html';
        return;
    }

    console.log('Administrator verified!');
}

// Run administrator check
checkAdmin();

// Logout button
const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', async function() {

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert('Logout failed: ' + error.message);
        return;
    }

    window.location.href = 'admin.html';

});
