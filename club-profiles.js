import { supabase } from './supabase.js';
const clubsContainer = document.getElementById('publicClubsContainer');

async function loadPublicClubs() {

    clubsContainer.textContent = 'Loading clubs...';

    const { data: clubs, error } = await supabase
        .from('clubs')
        .select('id, club_name, county, location, logo_url')
        .order('club_name', { ascending: true });

    if (error) {
        console.error('Error loading clubs:', error);
        clubsContainer.textContent = 'Unable to load clubs.';
        return;
    }

    clubsContainer.innerHTML = '';

    if (clubs.length === 0) {
        clubsContainer.textContent = 'No clubs have been registered yet.';
        return;
    }

    clubs.forEach(function(club) {

        const card = document.createElement('div');
        card.className = 'public-club-card';

        if (club.logo_url) {
            const logo = document.createElement('img');
            logo.src = club.logo_url;
            logo.alt = club.club_name + ' logo';
            card.appendChild(logo);
        }

        const name = document.createElement('h3');
        name.textContent = club.club_name;

        const county = document.createElement('p');
        county.textContent = 'County: ' + (club.county || 'Not provided');

        const location = document.createElement('p');
        location.textContent = 'Location: ' + (club.location || 'Not provided');

        card.append(name, county, location);

        clubsContainer.appendChild(card);

    });
}

loadPublicClubs();