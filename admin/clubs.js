
import { supabase } from '../supabase.js';

// GET HTML ELEMENTS
const clubForm = document.getElementById('clubForm');
const clubName = document.getElementById('clubName');
const county = document.getElementById('county');
const locationInput = document.getElementById('location');
const saveClub = document.getElementById('saveClub');
const clubMessage = document.getElementById('clubMessage');
const searchClub = document.getElementById('searchClub');
const clubsTable = document.getElementById('clubsTable');

let editingClubId = null;


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


// RESET FORM
function resetClubForm() {
    clubForm.reset();
    editingClubId = null;
    saveClub.textContent = 'Register Club';
    clubMessage.textContent = '';
}


// REGISTER OR UPDATE CLUB
clubForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const clubData = {
        club_name: clubName.value.trim(),
        county: county.value.trim(),
        location: locationInput.value.trim()
    };

    clubMessage.textContent = 'Saving club...';

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
        clubMessage.textContent = 'Error: ' + result.error.message;
        console.error(result.error);
        return;
    }

    clubMessage.textContent = editingClubId !== null
        ? 'Club updated successfully!'
        : 'Club registered successfully!';

    resetClubForm();

    await loadClubs(searchClub.value);
});


// LOAD CLUBS
async function loadClubs(search = '') {

    clubsTable.innerHTML =
        '<tr><td colspan="4">Loading clubs...</td></tr>';

    let query = supabase
        .from('clubs')
        .select('id, club_name, county, location')
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
