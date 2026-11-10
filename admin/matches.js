
import { supabase } from '../supabase.js';

// ===================================
// 1. GET HTML ELEMENTS
// ===================================

const matchForm = document.getElementById('matchForm');

const competition = document.getElementById('competition');
const homeClub = document.getElementById('homeClub');
const awayClub = document.getElementById('awayClub');
const matchDate = document.getElementById('matchDate');
const venue = document.getElementById('venue');
const homeScore = document.getElementById('homeScore');
const awayScore = document.getElementById('awayScore');
const matchStatus = document.getElementById('matchStatus');

const saveMatch = document.getElementById('saveMatch');
const matchMessage = document.getElementById('matchMessage');
const searchMatch = document.getElementById('searchMatch');
const matchesTable = document.getElementById('matchesTable');

let editingMatchId = null;


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
// 3. LOAD CLUBS INTO DROPDOWNS
// ===================================

let matchData = {

    competition: competition.value.trim(),

    home_club_name: homeClub.value.trim(),

    away_club_name: awayClub.value.trim(),

    match_date: matchDate.value,

    venue: venue.value.trim(),

    home_score: homeScore.value === ''
        ? null
        : Number(homeScore.value),

    away_score: awayScore.value === ''
        ? null
        : Number(awayScore.value),

    status: matchStatus.value

};

// ===================================
// 4. RESET MATCH FORM
// ===================================

function resetMatchForm() {

    matchForm.reset();

    editingMatchId = null;

    saveMatch.textContent = 'Schedule Match';

    matchMessage.textContent = '';
}


// ===================================
// 5. SCHEDULE OR UPDATE MATCH
// ===================================

matchForm.addEventListener('submit', async function(event) {

    event.preventDefault();
if (!matchDate.value || isNaN(new Date(matchDate.value).getTime())) {
    matchMessage.textContent =
        'Please select a valid match date and time.';
    return;
}
    if (homeClub.value === awayClub.value) {
        matchMessage.textContent =
            'Home club and away club must be different.';
        return;
    }

    matchData = {

    competition: competition.value.trim(),

    home_club_name: homeClub.value.trim(),

    away_club_name: awayClub.value.trim(),

    match_date: new Date(matchDate.value).toISOString(),

    venue: venue.value.trim(),

    home_score: homeScore.value === ''
        ? null
        : Number(homeScore.value),

    away_score: awayScore.value === ''
        ? null
        : Number(awayScore.value),

    status: matchStatus.value

};

    matchMessage.textContent = 'Saving match...';

    let result;

    if (editingMatchId !== null) {

        result = await supabase
            .from('matches')
            .update(matchData)
            .eq('id', editingMatchId);

    } else {

        result = await supabase
            .from('matches')
            .insert([matchData]);

    }

    if (result.error) {

        matchMessage.textContent =
            'Error: ' + result.error.message;

        console.error(result.error);

        return;
    }

    matchMessage.textContent = editingMatchId !== null
        ? 'Match updated successfully!'
        : 'Match scheduled successfully!';

    resetMatchForm();

    await loadMatches(searchMatch.value);

});


// ===================================
// 6. LOAD MATCHES
// ===================================

async function loadMatches(search = '') {

    matchesTable.innerHTML =
        '<tr><td colspan="7">Loading matches...</td></tr>';

    let query = supabase
    .from('matches')
    .select(`
        id,
        competition,
        home_club_name,
        away_club_name,
        match_date,
        venue,
        home_score,
        away_score,
        status
    `)
    .order('match_date', { ascending: false });

    if (search.trim() !== '') {

        query = query.ilike(
            'competition',
            '%' + search.trim() + '%'
        );

    }

    const { data, error } = await query;

    if (error) {

        matchesTable.innerHTML =
            '<tr><td colspan="7">Error loading matches.</td></tr>';

        console.error('Error loading matches:', error.message);

        return;
    }

    matchesTable.innerHTML = '';

    if (data.length === 0) {

        matchesTable.innerHTML =
            '<tr><td colspan="7">No matches found.</td></tr>';

        return;
    }

    data.forEach(function(match) {

        const row = document.createElement('tr');

        const competitionCell = document.createElement('td');
        const homeCell = document.createElement('td');
        const awayCell = document.createElement('td');
        const dateCell = document.createElement('td');
        const scoreCell = document.createElement('td');
        const statusCell = document.createElement('td');
        const actionCell = document.createElement('td');

        competitionCell.textContent = match.competition;
homeCell.textContent = match.home_club_name || '';

awayCell.textContent = match.away_club_name || '';

        dateCell.textContent = match.match_date
            ? new Date(match.match_date).toLocaleString()
            : '';

        scoreCell.textContent =
            match.home_score !== null &&
            match.away_score !== null
                ? match.home_score + ' - ' + match.away_score
                : 'Not played';

        statusCell.textContent = match.status || '';

        // EDIT BUTTON

        const editButton = document.createElement('button');

        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';

        editButton.addEventListener('click', function() {
            editMatch(match);
        });

        // DELETE BUTTON

        const deleteButton = document.createElement('button');

        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';

        deleteButton.addEventListener('click', async function() {

            const confirmed = confirm(
                'Are you sure you want to delete this match?'
            );

            if (!confirmed) {
                return;
            }

            const { error: deleteError } = await supabase
                .from('matches')
                .delete()
                .eq('id', match.id);

            if (deleteError) {

                alert('Delete failed: ' + deleteError.message);

                return;
            }

            alert('Match deleted successfully!');

            await loadMatches(searchMatch.value);

        });

        actionCell.append(editButton, deleteButton);

        row.append(
            competitionCell,
            homeCell,
            awayCell,
            dateCell,
            scoreCell,
            statusCell,
            actionCell
        );

        matchesTable.appendChild(row);

    });

}


// ===================================
// 7. EDIT MATCH
// ===================================

function editMatch(match) {

    editingMatchId = match.id;

    competition.value = match.competition || '';

    homeClub.value = match.home_club_name || '';

awayClub.value = match.away_club_name || '';
    if (match.match_date) {

        const date = new Date(match.match_date);

        const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 16);

        matchDate.value = localDate;

    }

    venue.value = match.venue || '';

    homeScore.value = match.home_score ?? '';

    awayScore.value = match.away_score ?? '';

    matchStatus.value = match.status || 'Upcoming';

    saveMatch.textContent = 'Save Changes';

    matchMessage.textContent =
        'Editing: ' + match.competition;

    matchForm.scrollIntoView({
        behavior: 'smooth'
    });

}


// ===================================
// 8. SEARCH MATCHES
// ===================================

searchMatch.addEventListener('input', function() {

    loadMatches(searchMatch.value);

});


// ===================================
// 9. START MATCH MANAGEMENT
// ===================================

async function startMatchManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

   await loadMatches();

}

startMatchManagement();
