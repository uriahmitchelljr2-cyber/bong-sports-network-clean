
import { supabase } from '../supabase.js';

// GET HTML ELEMENTS
const clubForm = document.getElementById('clubForm');
const clubName = document.getElementById('clubName');
const county = document.getElementById('county');
const locationInput = document.getElementById('location');
const clubLogo = document.getElementById('clubLogo');
const logoPreview = document.getElementById('logoPreview');
const saveClub = document.getElementById('saveClub');
const clubMessage = document.getElementById('clubMessage');
const searchClub = document.getElementById('searchClub');
const clubsTable = document.getElementById('clubsTable');

let editingClubId = null;
let previewObjectUrl = null;


// CHECK ADMINISTRATOR ACCESS
async function checkAdmin() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = 'admin.html';
        return false;
    }

    const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        window.location.href = 'admin.html';
        return false;
    }

    return true;
}


// SHOW LOGO PREVIEW
clubLogo.addEventListener('change', function() {

    const file = clubLogo.files[0];

    if (!file) {
        return;
    }

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
        clubMessage.textContent =
            'Please select a JPG, PNG, or WEBP image.';
        clubLogo.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        clubMessage.textContent =
            'Image must not exceed 5 MB.';
        clubLogo.value = '';
        return;
    }

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);

    logoPreview.src = previewObjectUrl;
    logoPreview.onload = function() {
    console.log('Club logo preview loaded successfully.');
};

logoPreview.onerror = function() {
    console.error('Club logo preview failed to load.');
};
    logoPreview.style.display = 'block';

    clubMessage.textContent = 'Logo selected successfully.';
});


// UPLOAD CLUB LOGO
async function uploadClubLogo(file) {

    const extension = file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';

    const filePath =
        Date.now() + '-' +
        Math.random().toString(36).slice(2) +
        '.' + extension;

    const { error } = await supabase.storage
        .from('club-logos')
        .upload(filePath, file, {
            contentType: file.type,
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from('club-logos')
        .getPublicUrl(filePath);

    return data.publicUrl;
}


// RESET FORM
function resetClubForm() {

    clubForm.reset();

    editingClubId = null;

    saveClub.textContent = 'Register Club';

    clubMessage.textContent = '';

    logoPreview.src = '';
    logoPreview.style.display = 'none';

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}


// REGISTER OR UPDATE CLUB
clubForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    saveClub.disabled = true;

    const clubData = {
        club_name: clubName.value.trim(),
        county: county.value.trim(),
        location: locationInput.value.trim()
    };

    clubMessage.textContent = 'Saving club...';

    try {

        const selectedFile = clubLogo.files[0];

        let uploadedLogoUrl = null;

        // Upload logo if a new image was selected
        if (selectedFile) {

            clubMessage.textContent = 'Uploading club logo...';

            uploadedLogoUrl =
                await uploadClubLogo(selectedFile);
        }

        if (editingClubId !== null) {

            // Only replace logo when a new one is selected
            if (uploadedLogoUrl) {
                clubData.logo_url = uploadedLogoUrl;
            }

        } else {

            clubData.logo_url = uploadedLogoUrl;
        }

        let result;

        if (editingClubId !== null) {

            result = await supabase
                .from('clubs')
                .update(clubData)
                .eq('id', editingClubId);

        } else {

            result = await supabase
                .from('clubs')
                .insert([clubData]);
        }

        if (result.error) {
            throw result.error;
        }

        clubMessage.textContent = editingClubId !== null
            ? 'Club updated successfully!'
            : 'Club registered successfully!';

        resetClubForm();

        await loadClubs(searchClub.value);

    } catch (error) {

        clubMessage.textContent =
            'Error: ' + error.message;

        console.error(error);

    } finally {

        saveClub.disabled = false;
    }
});


// LOAD CLUBS
async function loadClubs(search = '') {

    clubsTable.innerHTML =
        '<tr><td colspan="4">Loading clubs...</td></tr>';

    let query = supabase
        .from('clubs')
        .select('id, club_name, county, location, logo_url')
        .order('club_name');

    if (search.trim() !== '') {

        query = query.ilike(
            'club_name',
            '%' + search.trim() + '%'
        );
    }

    const { data, error } = await query;

    if (error) {

        clubsTable.innerHTML =
            '<tr><td colspan="4">Error loading clubs.</td></tr>';

        console.error(error.message);
        return;
    }

    clubsTable.innerHTML = '';

    if (data.length === 0) {

        clubsTable.innerHTML =
            '<tr><td colspan="4">No clubs found.</td></tr>';

        return;
    }

    data.forEach(function(club) {

        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        const countyCell = document.createElement('td');
        const locationCell = document.createElement('td');
        const actionCell = document.createElement('td');

        nameCell.textContent = club.club_name;
        countyCell.textContent = club.county || '';
        locationCell.textContent = club.location || '';

        // EDIT BUTTON
        const editButton = document.createElement('button');

        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';

        editButton.addEventListener('click', function() {
            editClub(club);
        });

        // DELETE BUTTON
        const deleteButton = document.createElement('button');

        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';

        deleteButton.addEventListener('click', async function() {

            const confirmed = confirm(
                'Are you sure you want to delete ' +
                club.club_name + '?'
            );

            if (!confirmed) {
                return;
            }

            const { error: deleteError } = await supabase
                .from('clubs')
                .delete()
                .eq('id', club.id);

            if (deleteError) {
                alert('Delete failed: ' + deleteError.message);
                return;
            }

            alert('Club deleted successfully!');

            await loadClubs(searchClub.value);
        });

        actionCell.append(editButton, deleteButton);

        row.append(
            nameCell,
            countyCell,
            locationCell,
            actionCell
        );

        clubsTable.appendChild(row);
    });
}


// EDIT CLUB
function editClub(club) {

    editingClubId = club.id;

    clubName.value = club.club_name || '';
    county.value = club.county || '';
    locationInput.value = club.location || '';

    clubLogo.value = '';

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    if (club.logo_url) {
        logoPreview.src = club.logo_url;
        logoPreview.style.display = 'block';
    } else {
        logoPreview.src = '';
        logoPreview.style.display = 'none';
    }

    saveClub.textContent = 'Save Changes';

    clubMessage.textContent =
        'Editing: ' + club.club_name;

    clubForm.scrollIntoView({
        behavior: 'smooth'
    });
}


// SEARCH CLUBS
searchClub.addEventListener('input', function() {
    loadClubs(searchClub.value);
});


// START CLUB MANAGEMENT
async function startClubManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

    await loadClubs();
}

startClubManagement();
