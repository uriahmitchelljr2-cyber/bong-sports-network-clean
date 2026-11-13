
import { supabase } from './supabase.js';

const liveScoresContainer = document.getElementById('liveScoresContainer');

async function loadLiveScores() {

    liveScoresContainer.textContent = 'Loading live scores...';

    const { data: matches, error } = await supabase
        .from('matches')
        .select(`
            competition,
            home_club_name,
            away_club_name,
            home_score,
            away_score,
            match_date,
            venue,
            status
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
        status.textContent = 'LIVE';

        matchCard.appendChild(status);
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
