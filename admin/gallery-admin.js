
import { supabase } from '../supabase.js';

const galleryForm = document.getElementById('galleryForm');
const galleryMessage = document.getElementById('galleryMessage');
const adminGalleryContainer = document.getElementById('adminGalleryContainer');

// Check administrator access
async function checkAdmin() {

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
        window.location.href = 'admin.html';
        return false;
    }

    const { data: profile, error } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', sessionData.session.user.id)
        .single();

    if (error || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        window.location.href = 'admin.html';
        return false;
    }

    return true;
}

// Load uploaded photographs
async function loadAdminGallery() {

    const { data: images, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        adminGalleryContainer.textContent = 'Unable to load photographs.';
        return;
    }

    adminGalleryContainer.innerHTML = '';

    if (images.length === 0) {
        adminGalleryContainer.textContent = 'No photographs uploaded yet.';
        return;
    }

    images.forEach(function(image) {

        const card = document.createElement('div');
        card.className = 'admin-gallery-card';

        const photo = document.createElement('img');
        photo.src = image.image_url;
        photo.alt = image.title;

        const title = document.createElement('h4');
        title.textContent = image.title;

        const caption = document.createElement('p');
        caption.textContent = image.caption || '';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Photograph';
        deleteButton.className = 'delete-gallery-button';

        deleteButton.addEventListener('click', async function() {

            const confirmDelete = confirm(
                'Are you sure you want to delete this photograph?'
            );

            if (!confirmDelete) return;

            const { error: storageError } = await supabase.storage
                .from('sports-gallery')
                .remove([image.storage_path]);

            if (storageError) {
                alert('Unable to delete photograph: ' + storageError.message);
                return;
            }

            const { error: databaseError } = await supabase
                .from('gallery_images')
                .delete()
                .eq('id', image.id);

            if (databaseError) {
                alert('Photograph file deleted, but its database record could not be deleted.');
                return;
            }

            alert('Photograph deleted successfully!');

            loadAdminGallery();

        });

        card.append(photo, title, caption, deleteButton);

        adminGalleryContainer.appendChild(card);

    });
}

// Upload photographs
galleryForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    const title = document.getElementById('title').value.trim();
    const caption = document.getElementById('caption').value.trim();
    const category = document.getElementById('category').value;
    const photo = document.getElementById('photo').files[0];

    if (!photo) {
        galleryMessage.textContent = 'Please select a photograph.';
        return;
    }

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(photo.type)) {
        galleryMessage.textContent = 'Only JPG, PNG and WebP images are allowed.';
        return;
    }

    if (photo.size > 5 * 1024 * 1024) {
        galleryMessage.textContent = 'Photograph must not exceed 5 MB.';
        return;
    }

    galleryMessage.textContent = 'Uploading photograph...';

    const fileName = Date.now() + '-' + photo.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sports-gallery')
        .upload(fileName, photo);

    if (uploadError) {
        galleryMessage.textContent = uploadError.message;
        return;
    }

    const { data: publicUrlData } = supabase.storage
        .from('sports-gallery')
        .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    const { error: databaseError } = await supabase
        .from('gallery_images')
        .insert([{
            title: title,
            caption: caption,
            category: category,
            image_url: imageUrl,
            storage_path: uploadData.path
        }]);

    if (databaseError) {
        await supabase.storage
            .from('sports-gallery')
            .remove([uploadData.path]);

        galleryMessage.textContent = databaseError.message;
        return;
    }

    galleryMessage.textContent = 'Photograph uploaded successfully!';

    galleryForm.reset();

    await loadAdminGallery();

});

// Start the page
async function startGallery() {

    const authorized = await checkAdmin();

    if (authorized) {
        await loadAdminGallery();
    }

}

startGallery();

