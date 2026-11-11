
import { supabase } from '../supabase.js';

// GET THE NEWS CONTAINER
const newsContainer = document.getElementById('newsContainer');

// LOAD PUBLISHED NEWS
async function loadNews() {

    newsContainer.innerHTML = '<p>Loading sports news...</p>';

    const { data, error } = await supabase
        .from('news')
        .select('id, title, slug, summary, category, featured_image_url, published_at')
        .eq('status', 'Published')
        .order('published_at', { ascending: false });

    if (error) {
        console.error('News loading error:', error.message);
        newsContainer.innerHTML = '<p>Unable to load sports news.</p>';
        return;
    }

    if (data.length === 0) {
        newsContainer.innerHTML = '<p>No published news available yet.</p>';
        return;
    }

    newsContainer.innerHTML = '';

    data.forEach(function(article) {

        const articleCard = document.createElement('div');

        articleCard.className = 'news-card';

        const title = document.createElement('h3');
        title.textContent = article.title;

        const summary = document.createElement('p');
        summary.textContent = article.summary || '';

        const category = document.createElement('small');
        category.textContent = article.category || 'Sports';

        articleCard.append(category, title, summary);

const readMore = document.createElement('a');

readMore.href =
    'news-details.html?slug=' + encodeURIComponent(article.slug);

readMore.textContent = 'Read Full Story';

readMore.className = 'read-more';

articleCard.appendChild(readMore);

        if (article.featured_image_url) {
            const image = document.createElement('img');
            image.src = article.featured_image_url;
            image.alt = article.title;
            image.className = 'news-image';
            articleCard.prepend(image);
        }

        newsContainer.appendChild(articleCard);

    });
}

// START LOADING NEWS
loadNews();

// LOAD REGISTERED CLUBS
async function loadClubs() {

    const clubsContainer = document.getElementById('clubsContainer');

    clubsContainer.innerHTML = '<p>Loading clubs...</p>';

    const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name, county, location, logo_url')
        .order('club_name');

    if (error) {
        console.error('Clubs loading error:', error.message);
        clubsContainer.innerHTML = '<p>Unable to load clubs.</p>';
        return;
    }

    if (data.length === 0) {
        clubsContainer.innerHTML = '<p>No registered clubs available.</p>';
        return;
    }

    clubsContainer.innerHTML = '';

    data.forEach(function(club) {

        const clubCard = document.createElement('div');
        clubCard.className = 'club-card';

        const name = document.createElement('h3');
        name.textContent = club.club_name;

        const location = document.createElement('p');
        location.textContent =
            (club.location || '') + ' ' + (club.county || '');

        clubCard.append(name, location);

        if (club.logo_url) {
            const logo = document.createElement('img');
            logo.src = club.logo_url;
            logo.alt = club.club_name + ' logo';
            logo.className = 'club-logo';

            clubCard.prepend(logo);
        }

        clubsContainer.appendChild(clubCard);

    });
}

// START LOADING CLUBS
loadClubs();

// LOAD FIXTURES AND RESULTS
async function loadMatches() {

    const matchesContainer = document.getElementById('matchesContainer');

    matchesContainer.innerHTML = '<p>Loading fixtures and results...</p>';

    const { data, error } = await supabase
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

    if (error) {
        console.error('Matches loading error:', error.message);
        matchesContainer.innerHTML = '<p>Unable to load fixtures and results.</p>';
        return;
    }

    if (data.length === 0) {
        matchesContainer.innerHTML = '<p>No fixtures or results available yet.</p>';
        return;
    }

    matchesContainer.innerHTML = '';

    data.forEach(function(match) {

        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';

        const competition = document.createElement('h3');
        competition.textContent = match.competition;

        const teams = document.createElement('p');
        teams.textContent =
            (match.home_club_name || 'Home Club') +
            ' vs ' +
            (match.away_club_name || 'Away Club');

        const score = document.createElement('h2');

        if (match.home_score !== null && match.away_score !== null) {
            score.textContent =
                match.home_score + ' - ' + match.away_score;
        } else {
            score.textContent = 'VS';
        }

        const date = document.createElement('p');

        date.textContent = match.match_date
            ? new Date(match.match_date).toLocaleString()
            : 'Date not available';

        const status = document.createElement('small');
        status.textContent = match.status || 'Upcoming';

        matchCard.append(
            competition,
            teams,
            score,
            date,
            status
        );

        matchesContainer.appendChild(matchCard);

    });
}

// START LOADING MATCHES
loadMatches();


// LOAD FOOTBALLER PROFILES
async function loadPlayers() {

    const playersContainer = document.getElementById('playersContainer');

    playersContainer.innerHTML = '<p>Loading players...</p>';

    const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, club, photo_url')
        .order('full_name');

    if (error) {
        console.error('Players loading error:', error.message);
        playersContainer.innerHTML = '<p>Unable to load players.</p>';
        return;
    }

    if (data.length === 0) {
        playersContainer.innerHTML = '<p>No registered players available yet.</p>';
        return;
    }

    playersContainer.innerHTML = '';

    data.forEach(function(player) {

        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';

        const name = document.createElement('h3');
        name.textContent = player.full_name;

        const position = document.createElement('p');
        position.textContent = player.position || 'Position not available';

        const club = document.createElement('p');
        club.textContent = player.club || 'Club not available';

        playerCard.append(name, position, club);

        if (player.photo_url) {
            const photo = document.createElement('img');

            photo.src = player.photo_url;
            photo.alt = player.full_name;
            photo.className = 'player-photo';

            playerCard.prepend(photo);
        }

        // MAKE PLAYER CARD CLICKABLE
        playerCard.style.cursor = 'pointer';

        playerCard.addEventListener('click', function() {
            window.location.href =
                'player-profile.html?id=' + encodeURIComponent(player.id);
        });

        playersContainer.appendChild(playerCard);

    });
}


// START LOADING PLAYERS
loadPlayers();

// LOAD PLAYER STATISTICS
async function loadStatistics() {

    const statisticsContainer =
        document.getElementById('statisticsContainer');

    statisticsContainer.innerHTML =
        '<p>Loading player statistics...</p>';

    const { data, error } = await supabase
        .from('player_statistics')
        .select(`
            id,
            season,
            appearances,
            goals,
            assists,
            players (
                full_name,
                club
            )
        `)
        .order('goals', { ascending: false });

    if (error) {
        console.error('Statistics loading error:', error.message);
        statisticsContainer.innerHTML =
            '<p>Unable to load player statistics.</p>';
        return;
    }

    if (data.length === 0) {
        statisticsContainer.innerHTML =
            '<p>No player statistics available yet.</p>';
        return;
    }

    statisticsContainer.innerHTML = '';

    data.forEach(function(stat) {

        const card = document.createElement('div');
        card.className = 'player-card';

        const name = document.createElement('h3');
        name.textContent = stat.players
            ? stat.players.full_name
            : 'Unknown Player';

        const club = document.createElement('p');
        club.textContent = stat.players
            ? stat.players.club || 'Club not available'
            : 'Club not available';

        const season = document.createElement('p');
        season.textContent = 'Season: ' + (stat.season || 'N/A');

        const figures = document.createElement('p');
        figures.textContent =
            'Apps: ' + stat.appearances +
            ' | Goals: ' + stat.goals +
            ' | Assists: ' + stat.assists;

        card.append(name, club, season, figures);

        statisticsContainer.appendChild(card);

    });
}

// START LOADING STATISTICS
loadStatistics();
