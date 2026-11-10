
import { supabase } from '../supabase.js';

// ===================================
// 1. GET HTML ELEMENTS
// ===================================

const statisticsForm = document.getElementById('statisticsForm');
const statisticsTable = document.getElementById('statisticsTable');
const searchStatistics = document.getElementById('searchStatistics');

const playerSelect = document.getElementById('player');
const season = document.getElementById('season');
const appearances = document.getElementById('appearances');
const goals = document.getElementById('goals');
const assists = document.getElementById('assists');
const yellowCards = document.getElementById('yellowCards');
const redCards = document.getElementById('redCards');

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
// 3. LOAD PLAYERS INTO DROPDOWN
// ===================================

async function loadPlayers() {

    const { data, error } = await supabase
        .from('players')
        .select('id, full_name')
        .order('full_name');

    if (error) {
        console.error('Error loading players:', error.message);
        statisticsMessage.textContent = 'Unable to load players.';
        return;
    }

    playerSelect.innerHTML =
        '<option value="">Select Player</option>';

    data.forEach(function(player) {

        const option = document.createElement('option');

        option.value = player.id;

        option.textContent = player.full_name;

        playerSelect.appendChild(option);

    });
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

    if (!playerSelect.value) {
        statisticsMessage.textContent = 'Please select a player.';
        return;
    }

    const statisticsData = {

        player_id: Number(playerSelect.value),

        season: season.value.trim(),

        appearances: Number(appearances.value),

        goals: Number(goals.value),

        assists: Number(assists.value),

        yellow_cards: Number(yellowCards.value),

        red_cards: Number(redCards.value)

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
        '<tr><td colspan="8">Loading statistics...</td></tr>';

    let query = supabase
        .from('player_statistics')
        .select(`
            id,
            player_id,
            season,
            appearances,
            goals,
            assists,
            yellow_cards,
            red_cards,
            players (
                full_name
            )
        `)
        .order('season', { ascending: false });

    const { data, error } = await query;

    if (error) {

        statisticsTable.innerHTML =
            '<tr><td colspan="8">Error loading statistics.</td></tr>';

        console.error(error.message);

        return;
    }

    statisticsTable.innerHTML = '';

    const filteredData = data.filter(function(stat) {

        const playerName = stat.players
            ? stat.players.full_name.toLowerCase()
            : '';

        return playerName.includes(search.trim().toLowerCase());

    });

    if (filteredData.length === 0) {

        statisticsTable.innerHTML =
            '<tr><td colspan="8">No statistics found.</td></tr>';

        return;
    }

    filteredData.forEach(function(stat) {

        const row = document.createElement('tr');

        const values = [
            stat.players ? stat.players.full_name : 'Unknown Player',
            stat.season || '',
            stat.appearances ?? 0,
            stat.goals ?? 0,
            stat.assists ?? 0,
            stat.yellow_cards ?? 0,
            stat.red_cards ?? 0
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

            if (!confirmed) {
                return;
            }

            const { error: deleteError } = await supabase
                .from('player_statistics')
                .delete()
                .eq('id', stat.id);

            if (deleteError) {

                alert('Delete failed: ' + deleteError.message);

                return;
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

    playerSelect.value = String(stat.player_id);

    season.value = stat.season || '';

    appearances.value = stat.appearances ?? 0;

    goals.value = stat.goals ?? 0;

    assists.value = stat.assists ?? 0;

    yellowCards.value = stat.yellow_cards ?? 0;

    redCards.value = stat.red_cards ?? 0;

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
// 10. START STATISTICS MANAGEMENT
// ===================================

async function startStatisticsManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

    await loadPlayers();

    await loadStatistics();

}

startStatisticsManagement();
