
import { supabase } from './supabase.js';

const liveScoresContainer = document.getElementById('liveScoresContainer');

// FORMAT MATCH CLOCK

function formatMatchClock(match) {

    let seconds = match.clock_seconds || 0;

    if (
        match.clock_status === 'running' &&
        match.clock_started_at
    ) {
        const startedAt = new Date(match.clock_started_at).getTime();

        seconds += Math.floor((Date.now() - startedAt) / 1000);
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(remainingSeconds).padStart(2, '0')
    );
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

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        clock.textContent =
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(remainingSeconds).padStart(2, '0');

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
        .eq('competition', 'LFA Bong Sub-Association 3rd Division League')
        .eq('status', 'Live')
        .order('match_date', { ascending: true });

    if (error) {
        console.error(error);
        liveScoresContainer.textContent = 'Unable to load live scores.';
        return;
    }

    liveScoresContainer.innerHTML = '';

    if (!matches || matches.length === 0) {
        liveScoresContainer.textContent = 'No live matches at the moment.';
        return;
    }

    matches.forEach(function(match) {

        const matchCard = document.createElement('div');
        matchCard.className = 'result-card';

        const teams = document.createElement('h3');
        teams.textContent =
            (match.home_club_name || 'Home Team') +
            ' vs ' +
            (match.away_club_name || 'Away Team');

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

clock.textContent = formatMatchClock(match);

       matchCard.appendChild(status);
matchCard.appendChild(clock);
matchCard.appendChild(teams);
matchCard.appendChild(score);

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
