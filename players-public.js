
import { supabase } from './supabase.js';

const playersContainer = document.getElementById('playersContainer');

async function loadPlayers() {
    playersContainer.innerHTML = '<p>Loading players...</p>';

    const { data, error } = await supabase
        .from('players')
        .select('id, full_name, age, position, preferred_foot, club, jersey_number, biography')
        .order('full_name');

    if (error) {
        playersContainer.innerHTML = '<p>Unable to load players.</p>';
        console.error('Error loading players:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        playersContainer.innerHTML = '<p>No registered players yet.</p>';
        return;
    }

   card.innerHTML = `
    ${player.photo_url ? `
        <img src="${player.photo_url}"
             alt="${player.full_name || 'Player'}"
             class="player-photo">
    ` : ''}

    <h3>${player.full_name || 'Unknown Player'}</h3>
    <p><strong>Age:</strong> ${player.age ?? 'Not provided'}</p>
    <p><strong>Position:</strong> ${player.position || 'Not provided'}</p>
    <p><strong>Preferred Foot:</strong> ${player.preferred_foot || 'Not provided'}</p>
    <p><strong>Club:</strong> ${player.club || 'Not assigned'}</p>
    <p><strong>Jersey Number:</strong> ${player.jersey_number ?? 'Not provided'}</p>
    <p>${player.biography || ''}</p>
`;
loadPlayers();
