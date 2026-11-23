
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
let matchData = {};


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
// 3. RESET MATCH FORM
// ===================================

function resetMatchForm() {

    matchForm.reset();

    editingMatchId = null;

    saveMatch.textContent = 'Schedule Match';

    matchMessage.textContent = '';
}


// ===================================
// 4. SCHEDULE OR UPDATE MATCH
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

// RECORD MATCH ACTIVITY

const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: editingMatchId !== null
                ? 'Updated Match'
                : 'Added Match',
            section: 'Matches',
            description: editingMatchId !== null
                ? 'Updated match: ' + matchData.home_club_name +
                  ' vs ' + matchData.away_club_name
                : 'Scheduled match: ' + matchData.home_club_name +
                  ' vs ' + matchData.away_club_name
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

    matchMessage.textContent = editingMatchId !== null
        ? 'Match updated successfully!'
        : 'Match scheduled successfully!';

    resetMatchForm();

    await loadMatches(searchMatch.value);

});


// ===================================
// 5. LOAD MATCHES
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
            status,
            clock_status,
            clock_started_at,
            clock_seconds,
            clock_period
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

    if (!data || data.length === 0) {

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

            if (!confirmed) return;

            const { error: deleteError } = await supabase
                .from('matches')
                .delete()
                .eq('id', match.id);

            if (deleteError) {

                alert('Delete failed: ' + deleteError.message);

                return;
            }

            // RECORD MATCH DELETION

const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: 'Deleted Match',
            section: 'Matches',
            description: 'Deleted match: ' +
                match.home_club_name + ' vs ' +
                match.away_club_name
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

            alert('Match deleted successfully!');

            await loadMatches(searchMatch.value);

        });

        actionCell.append(editButton, deleteButton);


        // MANAGE MATCH EVENTS BUTTON

        const eventsButton = document.createElement('button');

        eventsButton.textContent = 'Manage Events';
        eventsButton.className = 'action-button';

        eventsButton.addEventListener('click', function() {
            manageMatchEvents(match);
        });


        // VIEW MATCH EVENTS BUTTON

        const viewEventsButton = document.createElement('button');

        viewEventsButton.textContent = 'View Events';
        viewEventsButton.className = 'action-button';

        viewEventsButton.addEventListener('click', function() {
            viewMatchEvents(match);
        });

        actionCell.appendChild(viewEventsButton);
        actionCell.appendChild(eventsButton);


        // MATCH CLOCK CONTROLS

        if (match.status === 'Live' && match.clock_period !== 'Full-Time') {

            if (match.clock_status === 'running') {

                const halfTimeButton = document.createElement('button');

                halfTimeButton.textContent = 'Half-Time';
                halfTimeButton.className = 'action-button';

                halfTimeButton.addEventListener('click', function() {
                    controlMatchClock(match, 'halftime');
                });


                const fullTimeButton = document.createElement('button');

                fullTimeButton.textContent = 'Full-Time';
                fullTimeButton.className = 'action-button';

                fullTimeButton.addEventListener('click', function() {
                    controlMatchClock(match, 'fulltime');
                });

                actionCell.append(halfTimeButton, fullTimeButton);

            } else {

                const clockButton = document.createElement('button');

                clockButton.textContent =
                    match.clock_period === 'Half-Time'
                        ? 'Resume Second Half'
                        : 'Start First Half';

                clockButton.className = 'action-button';

                clockButton.addEventListener('click', function() {

                    controlMatchClock(
                        match,
                        match.clock_period === 'Half-Time'
                            ? 'resume'
                            : 'start'
                    );

                });

                actionCell.appendChild(clockButton);

            }

        }


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
// 6. EDIT MATCH
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
// 7. SEARCH MATCHES
// ===================================

searchMatch.addEventListener('input', function() {

    loadMatches(searchMatch.value);

});


// ===================================
// 8. START MATCH MANAGEMENT
// ===================================

async function startMatchManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

    await loadMatches();

}


// ===================================
// 9. BSN MATCH CLOCK ACTIONS
// ===================================

async function controlMatchClock(match, action) {

    let updates = {};

    if (action === 'start') {

        updates = {
            clock_status: 'running',
            clock_started_at: new Date().toISOString(),
            clock_seconds: 0,
            clock_period: 'First Half'
        };

    }

    else if (action === 'halftime') {

        const elapsed = Math.floor(
            (Date.now() - new Date(match.clock_started_at).getTime()) / 1000
        );

        updates = {
            clock_status: 'paused',
            clock_seconds: (match.clock_seconds || 0) + elapsed,
            clock_started_at: null,
            clock_period: 'Half-Time'
        };

    }

    else if (action === 'resume') {

        updates = {
            clock_status: 'running',
            clock_started_at: new Date().toISOString(),
            clock_seconds: 2700,
            clock_period: 'Second Half'
        };

    }

    else if (action === 'fulltime') {

        const elapsed = Math.floor(
            (Date.now() - new Date(match.clock_started_at).getTime()) / 1000
        );

        updates = {
            clock_status: 'finished',
            clock_seconds: (match.clock_seconds || 0) + elapsed,
            clock_started_at: null,
            clock_period: 'Full-Time',
            status: 'Completed'
        };

    }

    const success = await updateMatchClock(match.id, updates);

    if (success) {
        alert('Match clock updated successfully!');
    }

}


async function updateMatchClock(matchId, updates) {

    const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

    if (error) {

        alert('Clock update failed: ' + error.message);

        console.error(error);

        return false;
    }

    await loadMatches(searchMatch.value);

    return true;

}


// ===================================
// 10. MANAGE MATCH EVENTS
// ===================================

async function manageMatchEvents(match) {

    const eventChoice = prompt(
        'Select event type:\n' +
        '1. Goal\n' +
        '2. Yellow Card\n' +
        '3. Red Card\n' +
        '4. Substitution'
    );

    const eventTypes = {
        '1': 'Goal',
        '2': 'Yellow Card',
        '3': 'Red Card',
        '4': 'Substitution'
    };

    const eventType = eventTypes[eventChoice];

    if (!eventType) {
        alert('Invalid event type selected.');
        return;
    }

    let playerName = '';
    let relatedPlayer = '';

    if (eventType === 'Substitution') {

        playerName = prompt('Enter the name of the player coming OFF:');

        if (!playerName) return;

        relatedPlayer = prompt('Enter the name of the player coming ON:');

        if (!relatedPlayer) return;

    } else {

        playerName = prompt('Enter player name:');

        if (!playerName) return;

    }

    const eventMinute = prompt('Enter match minute (e.g. 23):');

    if (eventMinute === null || eventMinute.trim() === '' || isNaN(eventMinute)) {
        alert('Invalid match minute.');
        return;
    }

    const teamChoice = prompt(
        'Select team:\n' +
        '1. ' + match.home_club_name + '\n' +
        '2. ' + match.away_club_name
    );

    let teamName;

    if (teamChoice === '1') {

        teamName = match.home_club_name;

    } else if (teamChoice === '2') {

        teamName = match.away_club_name;

    } else {

        alert('Invalid team selected.');
        return;

    }

    const { error } = await supabase.rpc(
        'record_match_event',
        {
            p_match_id: match.id,
            p_event_type: eventType,
            p_player_name: playerName,
            p_related_player: relatedPlayer,
            p_event_minute: Number(eventMinute),
            p_team_name: teamName
        }
    );

    if (error) {

        alert('Failed to save event: ' + error.message);

        console.error(error);

        return;
    }

    // RECORD MATCH EVENT ACTIVITY

const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: 'Added Match Event',
            section: 'Match Events',
            description: eventType + ' recorded for ' +
                playerName + ' (' + teamName + ')' +
                ' at minute ' + eventMinute
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

    alert('Match event saved successfully!');

    await loadMatches(searchMatch.value);

}


// ===================================
// 11. VIEW, EDIT AND DELETE MATCH EVENTS
// ===================================

async function viewMatchEvents(match) {

    const { data: events, error } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', match.id)
        .order('event_minute', { ascending: true });

    if (error) {
        alert('Unable to load match events: ' + error.message);
        return;
    }

    if (!events || events.length === 0) {
        alert('No events recorded for this match.');
        return;
    }

    let eventList = '';

    events.forEach(function(event, index) {
        eventList +=
            (index + 1) + '. ' +
            event.event_type + ' - ' +
            event.player_name + ' (' +
            event.team_name + ') - ' +
            event.event_minute + "'\n";
    });

    const eventChoice = prompt(
        'MATCH EVENTS\n\n' +
        eventList +
        '\nEnter the event number to manage:'
    );

    if (eventChoice === null) {
        return;
    }

    const selectedIndex = Number(eventChoice) - 1;

    if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= events.length
    ) {
        alert('Invalid event number.');
        return;
    }

    const selectedEvent = events[selectedIndex];

    const action = prompt(
        'Choose an action:\n\n' +
        '1. Edit Event\n' +
        '2. Delete Event'
    );

    if (action === null) {
        return;
    }

    // DELETE EVENT
    if (action === '2') {

        const confirmDelete = confirm(
            'Are you sure you want to delete this event?'
        );

        if (!confirmDelete) {
            return;
        }

        const { error: deleteError } = await supabase.rpc(
            'delete_match_event',
            {
                p_event_id: selectedEvent.id,
                p_match_id: match.id
            }
        );

        if (deleteError) {
            alert('Unable to delete event: ' + deleteError.message);
            return;
        }

        alert('Event deleted successfully.');

        await loadMatches(searchMatch.value);

        return;
    }

    // EDIT EVENT
    if (action === '1') {

        const eventTypeChoice = prompt(
            'Select event type:\n\n' +
            '1. Goal\n' +
            '2. Yellow Card\n' +
            '3. Red Card\n' +
            '4. Substitution',
            selectedEvent.event_type
        );

        if (eventTypeChoice === null) {
            return;
        }

        const eventTypes = {
            '1': 'Goal',
            '2': 'Yellow Card',
            '3': 'Red Card',
            '4': 'Substitution'
        };

        const eventType = eventTypes[eventTypeChoice];

        if (!eventType) {
            alert('Invalid event type.');
            return;
        }

        const playerName = prompt(
            'Enter player name:',
            selectedEvent.player_name || ''
        );

        if (playerName === null || playerName.trim() === '') {
            return;
        }

        const eventMinute = prompt(
            'Enter event minute:',
            selectedEvent.event_minute
        );

        if (eventMinute === null) {
            return;
        }

        if (
            eventMinute.trim() === '' ||
            !Number.isInteger(Number(eventMinute)) ||
            Number(eventMinute) < 0
        ) {
            alert('Enter a valid event minute.');
            return;
        }

        const teamName = prompt(
            'Enter team name:',
            selectedEvent.team_name || ''
        );

        if (teamName === null || teamName.trim() === '') {
            return;
        }

        const { error: updateError } = await supabase.rpc(
            'update_match_event',
            {
                p_event_id: selectedEvent.id,
                p_match_id: match.id,
                p_event_type: eventType,
                p_player_name: playerName.trim(),
                p_event_minute: Number(eventMinute),
                p_team_name: teamName.trim()
            }
        );

        if (updateError) {
            alert('Unable to update event: ' + updateError.message);
            return;
        }

// RECORD MATCH EVENT DELETION

const { data: userData } = await supabase.auth.getUser();

if (userData.user) {

    const { error: logError } = await supabase
        .from('admin_activity_logs')
        .insert({
            admin_email: userData.user.email,
            action: 'Deleted Match Event',
            section: 'Match Events',
            description: 'Deleted ' +
                selectedEvent.event_type + ' event for ' +
                selectedEvent.player_name
        });

    if (logError) {
        console.error('Activity log error:', logError.message);
    }
}

        alert('Event updated successfully.');

        await loadMatches(searchMatch.value);

        return;
    }

    alert('Invalid action selected.');
}
// ===================================
// 12. START MATCH MANAGEMENT
// ===================================

startMatchManagement();