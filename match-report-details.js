
import { supabase } from './supabase.js';

// GET REPORT ID FROM WEBSITE URL
const urlParams = new URLSearchParams(window.location.search);
const reportId = urlParams.get('id');

const container = document.getElementById('matchReportDetails');

// LOAD MATCH REPORT DETAILS
async function loadMatchReportDetails() {

    if (!reportId) {
        container.textContent = 'Match report ID not found.';
        return;
    }

    container.innerHTML = '<p>Loading match report...</p>';

    // GET REPORT
    const { data: report, error } = await supabase
        .from('match_reports')
        .select('*')
        .eq('id', reportId)
        .single();

    if (error) {
        console.error('Report loading error:', error.message);
        container.textContent = 'Unable to load match report.';
        return;
    }

    // GET MATCH DETAILS
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', report.match_id)
        .single();

    if (matchError) {
        console.error('Match details error:', matchError.message);
    }

    container.innerHTML = '';

    const headline = document.createElement('h2');
    headline.textContent = report.headline;

    const teams = document.createElement('h3');

    if (match) {
        teams.textContent =
            match.home_club_name + ' ' +
            match.home_score + ' - ' +
            match.away_score + ' ' +
            match.away_club_name;
    } else {
        teams.textContent = 'Match details unavailable';
    }

    const story = document.createElement('p');
    story.textContent = report.report;
    story.style.whiteSpace = 'pre-line';
    story.style.lineHeight = '1.9';

    const author = document.createElement('p');
    author.textContent = 'By ' + (report.author || 'BSN Admin');

    const date = document.createElement('small');
    date.textContent =
        'Published: ' +
        new Date(report.created_at).toLocaleDateString();

    container.append(headline, teams, author, date, story);
}

// START
loadMatchReportDetails();
