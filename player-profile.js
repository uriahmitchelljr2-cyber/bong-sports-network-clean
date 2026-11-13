
import { supabase } from './supabase.js';

// GET THE PLAYER ID FROM THE WEBSITE URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id');

const profileContainer = document.getElementById('playerProfile');

async function loadPlayerProfile() {

    if (!playerId) {
        profileContainer.innerHTML = '<p>Player ID not found.</p>';
        return;
    }

    profileContainer.innerHTML = '<p>Loading player profile...</p>';

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    if (error) {
        console.error('Player profile error:', error.message);
        profileContainer.innerHTML = '<p>Unable to load player profile.</p>';
        return;
    }

    profileContainer.innerHTML = `
        <div class="full-player-profile">

            ${data.photo_url ? `
                <img src="${data.photo_url}" 
                     alt="${data.full_name}" 
                     class="profile-photo">
            ` : ''}

            <h2>${data.full_name || 'Player Name'}</h2>

            <p><strong>Club:</strong> ${data.club || 'Not provided'}</p>

            <p><strong>Position:</strong> ${data.position || 'Not provided'}</p>

            <p><strong>Age:</strong> ${data.age ?? 'Not provided'}</p>

            <p><strong>Preferred Foot:</strong> ${data.preferred_foot || 'Not provided'}</p>

            <p><strong>Jersey Number:</strong> ${data.jersey_number ?? 'Not provided'}</p>

            <h3>Player Biography</h3>

<p style="white-space: pre-line; text-align: left; line-height: 1.8;">
    ${data.biography || 'Player biography has not been added yet.'}
</p>

        </div>
    `;
}

loadPlayerProfile();
