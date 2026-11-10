
import { supabase } from '../supabase.js';

// GET THE NEWS DETAILS CONTAINER
const newsDetails = document.getElementById('newsDetails');

// GET ARTICLE SLUG FROM THE URL
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// LOAD NEWS ARTICLE
async function loadNewsDetails() {

    if (!slug) {
        newsDetails.innerHTML = '<p>No news article was selected.</p>';
        return;
    }

    newsDetails.innerHTML = '<p>Loading article...</p>';

    const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'Published')
        .single();

    if (error || !data) {
        console.error('News details error:', error);
        newsDetails.innerHTML = '<p>News article not found.</p>';
        return;
    }

    newsDetails.innerHTML = '';

    // BACK LINK
    const backLink = document.createElement('a');
    backLink.href = '../index.html#news';
    backLink.textContent = '← Back to News';
    backLink.className = 'back-to-news';

    // ARTICLE TITLE
    const title = document.createElement('h1');
    title.textContent = data.title;

    // ARTICLE INFORMATION
    const meta = document.createElement('p');
    meta.className = 'news-meta';

    const date = data.published_at
        ? new Date(data.published_at).toLocaleDateString()
        : 'Date unavailable';

    meta.textContent =
        (data.category || 'Sports') + ' | ' + date;

    newsDetails.append(backLink, title, meta);

    // FEATURED IMAGE
    if (data.featured_image_url) {
        const image = document.createElement('img');

        image.src = data.featured_image_url;
        image.alt = data.title;
        image.className = 'news-details-image';

        newsDetails.appendChild(image);
    }

    // FULL ARTICLE CONTENT
    const content = document.createElement('div');
    content.className = 'news-content';
    content.textContent = data.content;

    newsDetails.appendChild(content);
}

// START
loadNewsDetails();
