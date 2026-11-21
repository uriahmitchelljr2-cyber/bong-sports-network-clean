
import { supabase } from '../supabase.js';

const matchSelect = document.getElementById('matchId');
const reportForm = document.getElementById('matchReportForm');
const reportMessage = document.getElementById('reportMessage');

// LOAD EXISTING MATCHES
async function loadMatches() {

    matchSelect.innerHTML = '<option value="">Loading matches...</option>';

    const { data: matches, error } = await supabase
        .from('matches')
        .select(`
            id,
            home_club_name,
            away_club_name,
            home_score,
            away_score,
            match_date
        `)
        .order('match_date', { ascending: false });

    if (error) {
        console.error('Match loading error:', error.message);
        matchSelect.innerHTML =
            '<option value="">Unable to load matches</option>';
        return;
    }

    matchSelect.innerHTML =
        '<option value="">Select a match</option>';

    if (!matches || matches.length === 0) {
        matchSelect.innerHTML =
            '<option value="">No matches available</option>';
        return;
    }

    matches.forEach(function(match) {

        const option = document.createElement('option');

        option.value = match.id;

        option.textContent =
            match.home_club_name + ' ' +
            match.home_score + ' - ' +
            match.away_score + ' ' +
            match.away_club_name;

        matchSelect.appendChild(option);

    });
}


// PUBLISH MATCH REPORT
reportForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    reportMessage.textContent = 'Publishing report...';

    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        reportMessage.textContent =
            'Please log in as an administrator.';
        return;
    }

    const matchId = matchSelect.value;
    const headline = document.getElementById('matchTitle').value.trim();
    const report = document.getElementById('matchSummary').value.trim();

    const { error } = await supabase
        .from('match_reports')
        .insert({
            match_id: matchId,
            headline: headline,
            report: report,
            author: userData.user.email || 'BSN Admin'
        });

    if (error) {
        console.error('Report publishing error:', error.message);
        reportMessage.textContent =
            'Unable to publish report. Check administrator permissions.';
        return;
    }

    reportMessage.textContent = 'Match report published successfully!';

    reportForm.reset();

});


// START
loadMatches();
