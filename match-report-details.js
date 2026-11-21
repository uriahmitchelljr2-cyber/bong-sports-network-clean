
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

    // LOAD MATCH REPORT PHOTOS

const { data: photos, error: photosError } = await supabase
    .from('match_report_photos')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

if (photosError) {
    console.error('Photo loading error:', photosError.message);
}

if (photos && photos.length > 0) {

    const galleryTitle = document.createElement('h3');
    galleryTitle.textContent = 'Match Photos';

    const gallery = document.createElement('div');
    gallery.className = 'match-report-gallery';

    photos.forEach(function(photo, index) {

    const image = document.createElement('img');

    image.src = photo.image_url;
    image.alt = photo.caption || 'Match action photo';
let currentIndex = index;

    // OPEN PHOTO LIGHTBOX
    image.addEventListener('click', function() {

        const lightbox = document.createElement('div');
        lightbox.className = 'photo-lightbox';

        const largeImage = document.createElement('img');
        largeImage.src = photo.image_url;
        largeImage.alt = image.alt;

        function showPhoto() {
    largeImage.src = photos[currentIndex].image_url;
    largeImage.alt = photos[currentIndex].caption || 'Match action photo';
}
const previousButton = document.createElement('button');
previousButton.textContent = '❮';
previousButton.className = 'lightbox-previous';

const nextButton = document.createElement('button');
nextButton.textContent = '❯';
nextButton.className = 'lightbox-next';

previousButton.addEventListener('click', function(event) {
    event.stopPropagation();

    currentIndex = (currentIndex - 1 + photos.length) % photos.length;

    showPhoto();
});

nextButton.addEventListener('click', function(event) {
    event.stopPropagation();

    currentIndex = (currentIndex + 1) % photos.length;

    showPhoto();
});
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'lightbox-close';

        closeButton.addEventListener('click', function() {
            lightbox.remove();
        });

        lightbox.append(
    largeImage,
    previousButton,
    nextButton,
    closeButton
);

        document.body.appendChild(lightbox);

        lightbox.addEventListener('click', function(event) {
            if (event.target === lightbox) {
                lightbox.remove();
            }
        });

    });

    gallery.appendChild(image);

});

    container.append(galleryTitle, gallery);
}
}

// START
loadMatchReportDetails();
