
import { supabase } from '../supabase.js';

// ===================================
// 1. GET HTML ELEMENTS
// ===================================

const statisticsForm = document.getElementById('statisticsForm');
const statisticsTable = document.getElementById('statisticsTable');
const searchStatistics = document.getElementById('searchStatistics');

const playerSelect = document.getElementById('player');
const clubSelect = document.getElementById('club');
const season = document.getElementById('season');
const appearances = document.getElementById('appearances');
const goals = document.getElementById('goals');

const statisticsMessage = document.getElementById('statisticsMessage');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEdit');

let editingStatisticsId = null;


// ===================================
// 2. CHECK ADMINISTRATOR ACCESS
// ===================================

async function checkAdmin() {

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = 'admin.html';
        return false;
    }

    const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        window.location.href = 'admin.html';
        return false;
    }

    return true;
}

// ===================================
// 4. RESET STATISTICS FORM
// ===================================

function resetStatisticsForm() {

    statisticsForm.reset();

    editingStatisticsId = null;

    submitButton.textContent = 'Save Statistics';

    cancelEditButton.style.display = 'none';

    statisticsMessage.textContent = '';
}


// ===================================
// 5. SAVE OR UPDATE STATISTICS
// ===================================

statisticsForm.addEventListener('submit', async function(event) {

    event.preventDefault();
const playerName = playerSelect.value.trim();

if (!playerName) {
    statisticsMessage.textContent = 'Please enter a player name.';
    return;
}

   const statisticsData = {

    player_name: playerName,

    club_id: Number(clubSelect.value),

    season: season.value.trim(),

    appearances: Number(appearances.value),

    goals: Number(goals.value)

};

    statisticsMessage.textContent = 'Saving statistics...';

    let result;

    if (editingStatisticsId !== null) {

        result = await supabase
            .from('player_statistics')
            .update(statisticsData)
            .eq('id', editingStatisticsId);

    } else {

        result = await supabase
            .from('player_statistics')
            .insert([statisticsData]);

    }

    if (result.error) {

        statisticsMessage.textContent =
            'Error: ' + result.error.message;

        console.error(result.error);

        return;
    }

// RECORD STATISTICS ACTIVITY
const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: editingStatisticsId !== null
                ? 'Updated Statistics'
                : 'Added Statistics',
            section: 'Statistics',
            description: editingStatisticsId !== null
                ? 'Updated player statistics'
                : 'Added new player statistics'
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

    statisticsMessage.textContent =
        editingStatisticsId !== null
            ? 'Statistics updated successfully!'
            : 'Statistics saved successfully!';

    resetStatisticsForm();

    await loadStatistics(searchStatistics.value);

});


// ===================================
// 6. LOAD STATISTICS
// ===================================

async function loadStatistics(search = '') {

    statisticsTable.innerHTML =
        '<tr><td colspan="7">Loading statistics...</td></tr>';

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

        statisticsTable.innerHTML =
            '<tr><td colspan="7">Error loading statistics.</td></tr>';

        console.error(error.message);
        return;
    }

    statisticsTable.innerHTML = '';

    const filteredData = data.filter(function(stat) {

        const playerName = (stat.player_name || '').toLowerCase();
        const clubName = (stat.clubs?.club_name || '').toLowerCase();
        const searchText = search.trim().toLowerCase();

        return playerName.includes(searchText) ||
               clubName.includes(searchText);

    });

    if (filteredData.length === 0) {

        statisticsTable.innerHTML =
            '<tr><td colspan="7">No statistics found.</td></tr>';

        return;
    }

    filteredData.forEach(function(stat) {

        const row = document.createElement('tr');

        // Player name
        const playerCell = document.createElement('td');
        playerCell.textContent = stat.player_name || 'Unknown Player';
        row.appendChild(playerCell);

        // Club name
        const clubCell = document.createElement('td');
        clubCell.textContent = stat.clubs?.club_name || 'No Club';
        row.appendChild(clubCell);

        // Club logo
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

        row.appendChild(logoCell);

        // Remaining statistics
        const values = [
            stat.season || '',
            stat.appearances ?? 0,
            stat.goals ?? 0
        ];

        values.forEach(function(value) {

            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);

        });

        const actionCell = document.createElement('td');

        // EDIT BUTTON
        const editButton = document.createElement('button');

        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';

        editButton.addEventListener('click', function() {
            editStatistics(stat);
        });

        // DELETE BUTTON
        const deleteButton = document.createElement('button');

        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';

        deleteButton.addEventListener('click', async function() {

            const confirmed = confirm(
                'Are you sure you want to delete these statistics?'
            );

            if (!confirmed) return;

            const { error: deleteError } = await supabase
                .from('player_statistics')
                .delete()
                .eq('id', stat.id);

            if (deleteError) {
                alert('Delete failed: ' + deleteError.message);
                return;
            }

            // RECORD STATISTICS DELETION
const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: 'Deleted Statistics',
            section: 'Statistics',
            description: 'Deleted statistics for player: ' +
                (stat.player_name || 'Unknown Player')
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

            alert('Statistics deleted successfully!');

            await loadStatistics(searchStatistics.value);

        });

        actionCell.append(editButton, deleteButton);
        row.appendChild(actionCell);

        statisticsTable.appendChild(row);

    });

}

// ===================================
// 7. EDIT STATISTICS
// ===================================

function editStatistics(stat) {

    editingStatisticsId = stat.id;

    playerSelect.value = stat.player_name || '';

    clubSelect.value = stat.club_id || '';

    season.value = stat.season || '';

    appearances.value = stat.appearances ?? 0;

    goals.value = stat.goals ?? 0;

    submitButton.textContent = 'Save Changes';

    cancelEditButton.style.display = 'inline-block';

    statisticsMessage.textContent = 'Editing player statistics.';

    statisticsForm.scrollIntoView({
        behavior: 'smooth'
    });

}

// ===================================
// 8. CANCEL EDITING
// ===================================

cancelEditButton.addEventListener('click', function() {

    resetStatisticsForm();

});


// ===================================
// 9. SEARCH STATISTICS
// ===================================

searchStatistics.addEventListener('input', function() {

    loadStatistics(searchStatistics.value);

});

// ===================================
// LOAD REGISTERED CLUBS
// ===================================

async function loadClubs() {

    const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name, logo_url')
        .order('club_name', { ascending: true });

    if (error) {
        console.error('Error loading clubs:', error.message);
        return;
    }

    clubSelect.innerHTML = '<option value="">Select Club</option>';

    data.forEach(function(club) {

        const option = document.createElement('option');

        option.value = club.id;
        option.textContent = club.club_name;

        clubSelect.appendChild(option);

    });

}

// ===================================
// 10. START STATISTICS MANAGEMENT
// ===================================

async function startStatisticsManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

    await loadClubs();
await loadStatistics();

}

startStatisticsManagement();
