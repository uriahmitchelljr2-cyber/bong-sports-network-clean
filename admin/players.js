
import { supabase } from '../supabase.js';

// ===================================
// 1. GET HTML ELEMENTS
// ===================================

const playerForm = document.getElementById('playerForm');
const playersTable = document.getElementById('playersTable');
const searchPlayer = document.getElementById('searchPlayer');

const fullName = document.getElementById('fullName');
const age = document.getElementById('age');
const position = document.getElementById('position');
const preferredFoot = document.getElementById('preferredFoot');
const clubSelect = document.getElementById('club');
const jerseyNumber = document.getElementById('jerseyNumber');
const biography = document.getElementById('biography');

const playerPhoto = document.getElementById('playerPhoto');
const photoPreview = document.getElementById('photoPreview');

const formMessage = document.getElementById('formMessage');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEdit');

let selectedPhoto = null;
let editingPlayerId = null;


// ===================================
// 2. UPLOAD PLAYER PHOTO
// ===================================

async function uploadPlayerPhoto() {

    if (!selectedPhoto) {
        return null;
    }

    const fileExtension = selectedPhoto.name.split('.').pop();

    const fileName = Date.now() + '-' +
        Math.random().toString(36).substring(2) +
        '.' + fileExtension;

    const { error: uploadError } = await supabase.storage
        .from('sports-gallery')
        .upload(fileName, selectedPhoto);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('sports-gallery')
        .getPublicUrl(fileName);

    return data.publicUrl;
}


// ===================================
// 3. PLAYER PHOTO PREVIEW
// ===================================

playerPhoto.addEventListener('change', function() {

    const file = playerPhoto.files[0];

    if (!file) {
        selectedPhoto = null;
        photoPreview.src = '';
        photoPreview.style.display = 'none';
        return;
    }

    if (!file.type.startsWith('image/')) {

        alert('Please select an image file.');

        playerPhoto.value = '';
        selectedPhoto = null;
        photoPreview.src = '';
        photoPreview.style.display = 'none';

        return;
    }

    selectedPhoto = file;

    photoPreview.src = URL.createObjectURL(file);
    photoPreview.style.display = 'block';

});


// ===================================
// 4. CHECK ADMIN ACCESS
// ===================================

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


// ===================================
// 5. LOAD CLUBS
// ===================================

async function loadClubs() {

    const { data, error } = await supabase
        .from('clubs')
        .select('id, club_name')
        .order('club_name');

    if (error) {

        console.error('Error loading clubs:', error.message);

        return;
    }

    clubSelect.innerHTML = '<option value="">Select Club</option>';

    data.forEach(function(club) {

        const option = document.createElement('option');

        option.value = club.id;
        option.textContent = club.club_name;

        clubSelect.appendChild(option);

    });

}


// ===================================
// 6. RESET PLAYER FORM
// ===================================

function resetPlayerForm() {

    playerForm.reset();

    selectedPhoto = null;

    photoPreview.src = '';
    photoPreview.style.display = 'none';

    editingPlayerId = null;

    submitButton.textContent = 'Register Player';

    cancelEditButton.style.display = 'none';

}


// ===================================
// 7. REGISTER OR UPDATE PLAYER
// ===================================

playerForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    const selectedClub = clubSelect.options[clubSelect.selectedIndex];

    const playerData = {

        full_name: fullName.value.trim(),

        age: age.value ? Number(age.value) : null,

        position: position.value,

        preferred_foot: preferredFoot.value,

        club: selectedClub && selectedClub.value
            ? selectedClub.textContent
            : null,

        club_id: clubSelect.value
            ? Number(clubSelect.value)
            : null,

        jersey_number: jerseyNumber.value
            ? Number(jerseyNumber.value)
            : null,

        biography: biography.value.trim()

    };

    const isEditing = editingPlayerId !== null;

    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    formMessage.textContent = 'Saving player...';

    try {

        // Upload the new photo first, if one was selected.

        if (selectedPhoto) {

            const photoUrl = await uploadPlayerPhoto();

            playerData.photo_url = photoUrl;

        }

        let result;

        // UPDATE EXISTING PLAYER

        if (isEditing) {

            result = await supabase
                .from('players')
                .update(playerData)
                .eq('id', editingPlayerId);

        }

        // REGISTER NEW PLAYER

        else {

            result = await supabase
                .from('players')
                .insert([playerData]);

        }

        if (result.error) {
            throw result.error;
        }

        // RESET FORM

        resetPlayerForm();

        // RELOAD PLAYER LIST

        await loadPlayers(searchPlayer.value);

        formMessage.textContent = isEditing
            ? 'Player updated successfully!'
            : 'Player registered successfully!';

    }

    catch (error) {

        formMessage.textContent = 'Error: ' + error.message;

        console.error('Player save error:', error);

    }

    finally {

        submitButton.disabled = false;

        submitButton.textContent = editingPlayerId !== null
            ? 'Save Changes'
            : 'Register Player';

    }

});


// ===================================
// 8. LOAD PLAYERS FROM DATABASE
// ===================================

async function loadPlayers(search = '') {

    playersTable.innerHTML =
        '<tr><td colspan="5">Loading players...</td></tr>';

    let query = supabase
        .from('players')
        .select(`
            id,
            full_name,
            age,
            position,
            preferred_foot,
            club,
            club_id,
            jersey_number,
            biography,
            photo_url
        `)
        .order('full_name');

    if (search.trim() !== '') {

        query = query.ilike(
            'full_name',
            '%' + search.trim() + '%'
        );

    }

    const { data, error } = await query;

    if (error) {

        playersTable.innerHTML =
            '<tr><td colspan="5">Error loading players.</td></tr>';

        console.error('Error loading players:', error.message);

        return;
    }

    playersTable.innerHTML = '';

    if (data.length === 0) {

        playersTable.innerHTML =
            '<tr><td colspan="5">No players found.</td></tr>';

        return;
    }

    data.forEach(function(player) {

        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        const ageCell = document.createElement('td');
        const positionCell = document.createElement('td');
        const clubCell = document.createElement('td');
        const actionCell = document.createElement('td');

        nameCell.textContent = player.full_name;
        ageCell.textContent = player.age ?? '';
        positionCell.textContent = player.position || '';
        clubCell.textContent = player.club || '';

        // EDIT BUTTON

        const editButton = document.createElement('button');

        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';

        editButton.addEventListener('click', function() {

            editPlayer(player);

        });

        // DELETE BUTTON

        const deleteButton = document.createElement('button');

        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';

        deleteButton.addEventListener('click', async function() {

            const confirmed = confirm(
                'Are you sure you want to delete ' +
                player.full_name + '?'
            );

            if (!confirmed) {
                return;
            }

            const { error: deleteError } = await supabase
                .from('players')
                .delete()
                .eq('id', player.id);

            if (deleteError) {

                alert('Delete failed: ' + deleteError.message);

                return;
            }

            alert('Player deleted successfully!');

            await loadPlayers(searchPlayer.value);

        });

        actionCell.append(editButton, deleteButton);

        row.append(
            nameCell,
            ageCell,
            positionCell,
            clubCell,
            actionCell
        );

        playersTable.appendChild(row);

    });

}


// ===================================
// 9. EDIT PLAYER
// ===================================

function editPlayer(player) {

    editingPlayerId = player.id;

    fullName.value = player.full_name || '';

    age.value = player.age ?? '';

    position.value = player.position || '';

    preferredFoot.value = player.preferred_foot || '';

    clubSelect.value = player.club_id
        ? String(player.club_id)
        : '';

    jerseyNumber.value = player.jersey_number ?? '';

    biography.value = player.biography || '';

    // Show the existing photo, if available.

    if (player.photo_url) {

        photoPreview.src = player.photo_url;
        photoPreview.style.display = 'block';

    } else {

        photoPreview.src = '';
        photoPreview.style.display = 'none';

    }

    selectedPhoto = null;

    submitButton.textContent = 'Save Changes';

    cancelEditButton.style.display = 'inline-block';

    formMessage.textContent = 'Editing: ' + player.full_name;

    playerForm.scrollIntoView({
        behavior: 'smooth'
    });

}


// ===================================
// 10. CANCEL EDITING
// ===================================

cancelEditButton.addEventListener('click', function() {

    resetPlayerForm();

});


// ===================================
// 11. SEARCH PLAYERS
// ===================================

searchPlayer.addEventListener('input', function() {

    loadPlayers(searchPlayer.value);

});


// ===================================
// 12. START PLAYER MANAGEMENT
// ===================================

async function startPlayerManagement() {

    const authorized = await checkAdmin();

    if (!authorized) {
        return;
    }

    await loadClubs();

    await loadPlayers();

}

startPlayerManagement();
