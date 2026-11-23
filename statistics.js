
import { supabase } from './supabase.js';

const statisticsTable = document.getElementById('statisticsTable');
const searchStatistics = document.getElementById('searchStatistics');

// LOAD PUBLIC PLAYER STATISTICS
async function loadStatistics(search = '') {

    statisticsTable.innerHTML =
        '<tr><td colspan="6">Loading statistics...</td></tr>';

    const { data, error } = await supabase
        .from('player_statistics')
        .select(`
            id,
            player_name,
            club_id,
            season,
            appearances,
            goals,
            clubs (
                club_name,
                logo_url
            )
        `)
        .order('season', { ascending: false });

    if (error) {
        console.error('Statistics error:', error.message);

        statisticsTable.innerHTML =
            '<tr><td colspan="6">Unable to load statistics.</td></tr>';

        return;
    }

    console.log('Statistics data:', data);

    const searchText = search.trim().toLowerCase();

    const filteredData = data.filter(function(stat) {
        const playerName = (stat.player_name || '').toLowerCase();
        const clubName = (stat.clubs?.club_name || '').toLowerCase();

        return playerName.includes(searchText) ||
               clubName.includes(searchText);
    });

    displayStatistics(filteredData);
}

// DISPLAY STATISTICS
function displayStatistics(data) {

    statisticsTable.innerHTML = '';

    if (!data || data.length === 0) {
        statisticsTable.innerHTML =
            '<tr><td colspan="6">No statistics found.</td></tr>';
        return;
    }

    data.forEach(function(stat) {

        const row = document.createElement('tr');

       const playerCell = document.createElement('td');
playerCell.textContent = stat.player_name || 'Unknown Player';
        const clubCell = document.createElement('td');
        clubCell.textContent = stat.clubs?.club_name || 'Unknown Club';

        const logoCell = document.createElement('td');

        if (stat.clubs?.logo_url) {
            const logo = document.createElement('img');
            logo.src = stat.clubs.logo_url;
            logo.alt = 'Club Logo';
            logo.style.width = '45px';
            logo.style.height = '45px';
            logo.style.objectFit = 'contain';
            logoCell.appendChild(logo);
        } else {
            logoCell.textContent = 'No Logo';
        }

        const seasonCell = document.createElement('td');
        seasonCell.textContent = stat.season || '';

        const appearancesCell = document.createElement('td');
        appearancesCell.textContent = stat.appearances ?? 0;

        const goalsCell = document.createElement('td');
        goalsCell.textContent = stat.goals ?? 0;

        row.append(
            playerCell,
            clubCell,
            logoCell,
            seasonCell,
            appearancesCell,
            goalsCell
        );

        statisticsTable.appendChild(row);

    });
}

// SEARCH STATISTICS
searchStatistics.addEventListener('input', function() {
    loadStatistics(searchStatistics.value);
});

// START PUBLIC STATISTICS
loadStatistics();
