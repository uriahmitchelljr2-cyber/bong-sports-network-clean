
import { supabase } from './supabase.js';

const galleryContainer = document.getElementById('galleryContainer');

let allImages = [];

async function loadGallery() {

    galleryContainer.textContent = 'Loading photographs...';

    const { data: images, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Gallery error:', error);
        galleryContainer.textContent = 'Unable to load photographs.';
        return;
    }

    allImages = images;

    if (allImages.length === 0) {
        galleryContainer.textContent = 'No photographs have been uploaded yet.';
        return;
    }

    displayGallery('All');
}

// Display photographs by category
function displayGallery(category) {

    galleryContainer.innerHTML = '';

    const filteredImages = category === 'All'
        ? allImages
        : allImages.filter(image => image.category === category);

    if (filteredImages.length === 0) {
        galleryContainer.textContent = 'No photographs in this category yet.';
        return;
    }

    filteredImages.forEach(function(image) {

        const card = document.createElement('div');
        card.className = 'gallery-card';

        const photo = document.createElement('img');
photo.src = image.image_url;
photo.alt = image.title;
photo.loading = 'lazy';

// Open photograph in full-size viewer
photo.addEventListener('click', function() {

    const viewer = document.getElementById('photoViewer');
    const fullSizePhoto = document.getElementById('fullSizePhoto');
    const photoTitle = document.getElementById('photoTitle');

    fullSizePhoto.src = image.image_url;
    photoTitle.textContent = image.title;

    viewer.style.display = 'flex';

});
        const title = document.createElement('h3');
        title.textContent = image.title;

        const caption = document.createElement('p');
        caption.textContent = image.caption || '';

        card.append(photo, title, caption);

        galleryContainer.appendChild(card);

    });
}

// Handle category button clicks
const filterButtons = document.querySelectorAll('.filter-button');

filterButtons.forEach(function(button) {

    button.addEventListener('click', function() {

        filterButtons.forEach(function(item) {
            item.classList.remove('active');
        });

        button.classList.add('active');

        displayGallery(button.dataset.category);

    });

});
// Close the full-size photo viewer
const photoViewer = document.getElementById('photoViewer');
const closeViewer = document.getElementById('closeViewer');

closeViewer.addEventListener('click', function() {
    photoViewer.style.display = 'none';
});

// Close viewer when clicking the dark background
photoViewer.addEventListener('click', function(event) {

    if (event.target === photoViewer) {
        photoViewer.style.display = 'none';
    }

});
loadGallery();
