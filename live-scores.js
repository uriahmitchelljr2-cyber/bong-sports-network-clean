
import { supabase } from './supabase.js';

const liveScoresContainer = document.getElementById('liveScoresContainer');


function formatMatchClock(match) {

    let seconds = Number(match.clock_seconds) || 0;

    if (
        match.clock_status === 'running' &&
        match.clock_started_at
    ) {
        const startedAt = new Date(match.clock_started_at).getTime();

        seconds += Math.floor((Date.now() - startedAt) / 1000);
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // FIRST HALF
    if (match.clock_period === 'First Half') {

        if (minutes >= 45) {
            const addedMinutes = Math.ceil((seconds - 2700) / 60);

            return '45+' + addedMinutes;
        }

        return minutes + ':' + String(remainingSeconds).padStart(2, '0');
    }

    // HALF-TIME
    if (match.clock_period === 'Half-Time') {
        return 'HT';
    }

    // SECOND HALF
    if (match.clock_period === 'Second Half') {

        if (minutes >= 90) {
            const addedMinutes = Math.ceil((seconds - 5400) / 60);

            return '90+' + addedMinutes;
        }

        return minutes + ':' + String(remainingSeconds).padStart(2, '0');
    }

    // FULL-TIME
    if (match.clock_period === 'Full-Time') {
        return 'FT';
    }

    return '00:00';
}
// AUTOMATIC LIVE CLOCK UPDATE

setInterval(function() {

    document.querySelectorAll('.live-match-clock').forEach(function(clock) {

        let seconds = Number(clock.dataset.seconds) || 0;

        if (
            clock.dataset.status === 'running' &&
            clock.dataset.startedAt
        ) {
            const startedAt = new Date(clock.dataset.startedAt).getTime();

            seconds += Math.floor((Date.now() - startedAt) / 1000);
        }

        const period = clock.dataset.period;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (period === 'First Half' && minutes >= 45) {

            clock.textContent = '45+' + Math.ceil((seconds - 2700) / 60);

        }

        else if (period === 'Second Half' && minutes >= 90) {

            clock.textContent = '90+' + Math.ceil((seconds - 5400) / 60);

        }

        else if (period === 'Half-Time') {

            clock.textContent = 'HT';

        }

        else if (period === 'Full-Time') {

            clock.textContent = 'FT';

        }

        else {

            clock.textContent =
                minutes + ':' +
                String(remainingSeconds).padStart(2, '0');

        }

    });

}, 1000);

async function loadLiveScores() {

    liveScoresContainer.textContent = 'Loading live scores...';

    const { data: matches, error } = await supabase
        .from('matches')
        .select(`
    id,
    competition,
    home_club_name,
    away_club_name,
    home_score,
    away_score,
    match_date,
    venue,
    status,
    clock_status,
    clock_started_at,
    clock_seconds,
    clock_period
`)
        .eq('status', 'Live')
        .order('match_date', { ascending: true });

    if (error) {
        console.error(error);
        liveScoresContainer.textContent = 'Unable to load live scores.';
        return;
    }

    // LOAD CLUB LOGOS

const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('club_name, logo_url');

if (clubsError) {
    console.error('Unable to load club logos:', clubsError);
}

const clubLogos = new Map(
    (clubs || []).map(club => [club.club_name, club.logo_url])
);

    liveScoresContainer.innerHTML = '';

    if (!matches || matches.length === 0) {
        liveScoresContainer.textContent = 'No live matches at the moment.';
        return;
    }

    // LOAD EVENTS FOR LIVE MATCHES

const matchIds = matches.map(function(match) {
    return match.id;
});

const { data: matchEvents, error: eventsError } = await supabase
    .from('match_events')
    .select('*')
    .in('match_id', matchIds)
    .order('created_at', { ascending: true });

if (eventsError) {
    console.error('Unable to load match events:', eventsError);
}

    matches.forEach(function(match) {

        const matchCard = document.createElement('div');
        matchCard.className = 'result-card';

        // DISPLAY CLUB NAMES AND LOGOS

const teams = document.createElement('div');
teams.className = 'live-teams';

function addTeam(name) {

    const team = document.createElement('div');
    team.className = 'live-team';

    const logoUrl = clubLogos.get(name);

    if (logoUrl) {
        const logo = document.createElement('img');
        logo.src = logoUrl;
        logo.alt = name + ' logo';
        logo.className = 'live-club-logo';

        team.appendChild(logo);
    }

    const teamName = document.createElement('span');
    teamName.textContent = name;

    team.appendChild(teamName);

    return team;
}

teams.appendChild(
    addTeam(match.home_club_name || 'Home Team')
);

const versus = document.createElement('span');
versus.textContent = 'vs';
teams.appendChild(versus);

teams.appendChild(
    addTeam(match.away_club_name || 'Away Team')
);
        const score = document.createElement('h2');
        score.textContent =
            (match.home_score ?? 0) +
            ' - ' +
            (match.away_score ?? 0);

        const status = document.createElement('p');

status.textContent = match.clock_period || 'LIVE';

const clock = document.createElement('h2');

clock.className = 'live-match-clock';

clock.dataset.seconds = match.clock_seconds || 0;
clock.dataset.status = match.clock_status || '';
clock.dataset.startedAt = match.clock_started_at || '';
clock.dataset.period = match.clock_period || '';

clock.textContent = formatMatchClock(match);

       matchCard.appendChild(status);
matchCard.appendChild(clock);
matchCard.appendChild(teams);
matchCard.appendChild(score);

// DISPLAY MATCH EVENTS

const eventsContainer = document.createElement('div');
eventsContainer.className = 'live-match-events';

const thisMatchEvents = (matchEvents || []).filter(function(event) {
    return event.match_id === match.id;
});

thisMatchEvents.forEach(function(event) {

    const eventItem = document.createElement('p');

    let eventIcon = '';

    if (event.event_type === 'Goal') {
        eventIcon = '⚽';
    } else if (event.event_type === 'Yellow Card') {
        eventIcon = '🟨';
    } else if (event.event_type === 'Red Card') {
        eventIcon = '🟥';
    } else if (event.event_type === 'Substitution') {
        eventIcon = '🔄';
    }

    if (event.event_type === 'Substitution') {

    eventItem.textContent =
        '🔄 ' +
        (event.event_minute ?? '') + "' - " +
        event.player_name + ' OFF | ' +
        event.related_player + ' ON (' +
        event.team_name + ')';

} else {

    eventItem.textContent =
        eventIcon + ' ' +
        (event.event_minute ?? '') + "' - " +
        event.player_name + ' (' +
        event.team_name + ')';

}

    eventsContainer.appendChild(eventItem);

});

matchCard.appendChild(eventsContainer);
        liveScoresContainer.appendChild(matchCard);

    });

}

// Load live scores when the page opens
loadLiveScores();

// Listen for match changes in Supabase
supabase
    .channel('live-scores-updates')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'matches'
        },
        function(payload) {
            console.log('Match updated:', payload);
            loadLiveScores();
        }
    )
    .subscribe();
