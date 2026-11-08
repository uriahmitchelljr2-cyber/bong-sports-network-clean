// Import the Supabase connection
import { supabase } from './supabase.js';

// Get the status paragraph
const status = document.getElementById('connectionStatus');

// Test the connection
async function testConnection() {

    console.log('JavaScript is running!');

    status.textContent = 'Connecting to Supabase...';

    const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name')
        .limit(5);

    if (error) {
        status.textContent = 'Error: ' + error.message;
        console.error('Supabase error:', error);
        return;
    }

    status.textContent = 'Successfully connected to Supabase!';

    console.log('Clubs retrieved:', data);
}

// Run the test
testConnection();