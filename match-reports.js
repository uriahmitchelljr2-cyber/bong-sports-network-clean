
import { supabase } from './supabase.js';

const container = document.getElementById('matchReportsContainer');

// LOAD PUBLISHED MATCH REPORTS
async function loadMatchReports() {

    container.innerHTML = '<p>Loading match reports...</p>';

    const { data: reports, error } = await supabase
        .from('match_reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Match reports error:', error.message);
        container.textContent = 'Unable to load match reports.';
        return;
    }

    container.innerHTML = '';

    if (!reports || reports.length === 0) {
        container.textContent = 'No match reports available yet.';
        return;
    }

    // GET MATCH DETAILS
    const matchIds = [...new Set(reports.map(item => item.match_id))];

    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .in('id', matchIds);

    if (matchError) {
        console.error('Match details error:', matchError.message);
    }

    const matchDetails = {};

    (matches || []).forEach(match => {
        matchDetails[match.id] = match;
    });

    // DISPLAY REPORTS
    reports.forEach(function(item) {

        const match = matchDetails[item.match_id];

        const card = document.createElement('div');
        card.className = 'news-card';

        const headline = document.createElement('h3');

const headlineLink = document.createElement('a');

headlineLink.textContent = item.headline;

headlineLink.href =
    'match-report-details.html?id=' + item.id;

headline.appendChild(headlineLink);

        const teams = document.createElement('p');

        if (match) {
            teams.textContent =
                match.home_club_name + ' ' +
                match.home_score + ' - ' +
                match.away_score + ' ' +
                match.away_club_name;
        } else {
            teams.textContent = 'Match details unavailable';
        }

        const report = document.createElement('p');
        report.textContent = item.report;

        const author = document.createElement('small');
        author.textContent = 'By ' + (item.author || 'BSN Admin');

        const date = document.createElement('small');
        date.textContent =
            new Date(item.created_at).toLocaleDateString();

        card.append(headline, teams, report, author, date);

        container.appendChild(card);

    });

}

// START
loadMatchReports();
