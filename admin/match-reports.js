
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

   const { data: savedReport, error } = await supabase
    .from('match_reports')
    .insert({
        match_id: matchId,
        headline: headline,
        report: report,
        author: userData.user.email || 'BSN Admin'
    })
    .select('id')
    .single();

    if (error) {
        console.error('Report publishing error:', error.message);
        reportMessage.textContent =
            'Unable to publish report. Check administrator permissions.';
        return;
    }

// RECORD MATCH REPORT ACTIVITY

const { error: logError } = await supabase
    .from('admin_activity_logs')
    .insert({
        admin_email: userData.user.email,
        action: 'Published Match Report',
        section: 'Match Reports',
        description: 'Published match report: ' + headline
    });

if (logError) {
    console.error('Activity log error:', logError.message);
}

    // UPLOAD MATCH REPORT PHOTOS
const photoInput = document.getElementById('reportPhotos');
const selectedPhotos = photoInput.files;

for (const photo of selectedPhotos) {

    const fileName =
        Date.now() + '-' + photo.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    const { error: uploadError } = await supabase
        .storage
        .from('match-report-photos')
        .upload(fileName, photo);

    if (uploadError) {
        console.error('Photo upload error:', uploadError.message);
        reportMessage.textContent =
            'Report saved, but a photo could not be uploaded.';
        return;
    }

    const { data: publicUrlData } = supabase
        .storage
        .from('match-report-photos')
        .getPublicUrl(fileName);

    const { error: photoError } = await supabase
        .from('match_report_photos')
        .insert({
            report_id: savedReport.id,
            image_url: publicUrlData.publicUrl
        });

    if (photoError) {
        console.error('Photo record error:', photoError.message);
        reportMessage.textContent =
            'Report saved, but a photo record could not be saved.';
        return;
    }
}

    reportMessage.textContent = 'Match report published successfully!';

    reportForm.reset();

});


// START
loadMatches();
