
import { supabase } from './supabase.js';
console.log('Public statistics JavaScript is running');

const statisticsTable = document.getElementById('statisticsTable');
const searchStatistics = document.getElementById('searchStatistics');
const statisticsCount = document.getElementById('statisticsCount');
const totalPlayerRecords = document.getElementById('totalPlayerRecords');
const totalAppearances = document.getElementById('totalAppearances');
const totalGoals = document.getElementById('totalGoals');
const downloadStatistics = document.getElementById('downloadStatistics');
let allStatisticsData = [];

// LOAD PUBLIC PLAYER STATISTICS

async function loadStatistics(search = '') {
console.log('Loading statistics function started');

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
    allStatisticsData = data;
console.log('Number of statistics:', data?.length);

// UPDATE STATISTICS SUMMARY CARDS
const totalApps = data.reduce(function(total, stat) {
    return total + Number(stat.appearances || 0);
}, 0);

const goalsScored = data.reduce(function(total, stat) {
    return total + Number(stat.goals || 0);
}, 0);

totalPlayerRecords.textContent = data.length;
totalAppearances.textContent = totalApps.toLocaleString();
totalGoals.textContent = goalsScored.toLocaleString();

    const searchText = search.trim().toLowerCase();
    const filteredData = data.filter(function(stat) {
        const playerName = (stat.player_name || '').toLowerCase();
        const clubName = (stat.clubs?.club_name || '').toLowerCase();
        return playerName.includes(searchText) ||
               clubName.includes(searchText);
    });

    statisticsCount.textContent =
    filteredData.length + ' Player Records';

    displayStatistics(filteredData);
}


// DISPLAY STATISTICS
function displayStatistics(data) {

    statisticsTable.innerHTML = '';

    if (!data || data.length === 0) {
        statisticsTable.innerHTML =
            '<tr><td colspan="5">No statistics found.</td></tr>';
        return;
    }

    data.forEach(function(stat) {

        const row = document.createElement('tr');

        const playerCell = document.createElement('td');
        playerCell.textContent = stat.player_name || 'Unknown Player';

        const clubCell = document.createElement('td');

        const clubContainer = document.createElement('div');

        clubContainer.style.display = 'flex';
        clubContainer.style.alignItems = 'center';
        clubContainer.style.gap = '10px';

        if (stat.clubs?.logo_url) {

            const logo = document.createElement('img');

            logo.src = stat.clubs.logo_url;
            logo.alt = 'Club Logo';

            clubContainer.appendChild(logo);
        }

        const clubName = document.createElement('span');

        clubName.textContent = stat.clubs?.club_name || 'Unknown Club';

        clubContainer.appendChild(clubName);
        clubCell.appendChild(clubContainer);

        const seasonCell = document.createElement('td');
        seasonCell.textContent = stat.season || '';

        const appearancesCell = document.createElement('td');
        appearancesCell.textContent = stat.appearances ?? 0;

        const goalsCell = document.createElement('td');
        goalsCell.textContent = stat.goals ?? 0;

        row.append(
            playerCell,
            clubCell,
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

// DOWNLOAD STATISTICS AS CSV
downloadStatistics.addEventListener('click', function() {

    if (allStatisticsData.length === 0) {
        alert('No statistics available to download.');
        return;
    }

    const headers = [
        'Player',
        'Club',
        'Season',
        'Appearances',
        'Goals'
    ];

    const rows = allStatisticsData.map(function(stat) {
        return [
            stat.player_name || 'Unknown Player',
            stat.clubs?.club_name || 'Unknown Club',
            stat.season || '',
            stat.appearances ?? 0,
            stat.goals ?? 0
        ];
    });

    const csvContent = [headers, ...rows]
        .map(row => row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(','))
        .join('\n');

    const blob = new Blob(
        ['\uFEFF' + csvContent],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'BSN-Player-Statistics.csv';
    link.click();

    URL.revokeObjectURL(url);
});

// START PUBLIC STATISTICS
console.log('About to call loadStatistics');
loadStatistics();

