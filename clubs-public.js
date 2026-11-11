
import { supabase } from './supabase.js';

const clubsContainer = document.getElementById('clubsContainer');

async function loadClubs() {
    clubsContainer.innerHTML = '<p>Loading registered clubs...</p>';

    const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name')
        .order('club_name');

    if (error) {
        clubsContainer.innerHTML = '<p>Unable to load clubs.</p>';
        console.error('Error loading clubs:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        clubsContainer.innerHTML = '<p>No registered clubs yet.</p>';
        return;
    }

    clubsContainer.innerHTML = '';

    data.forEach(function(club) {
        const card = document.createElement('div');
        card.className = 'club-card';

        const name = document.createElement('h3');
        name.textContent = club.club_name || 'Unnamed Club';

        card.appendChild(name);
        clubsContainer.appendChild(card);
    });
}

loadClubs();
