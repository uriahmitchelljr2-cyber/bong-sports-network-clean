
import { supabase } from './supabase.js';

// GET THE PLAYER ID FROM THE WEBSITE URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id');

const profileContainer = document.getElementById('playerProfile');

async function loadPlayerProfile() {

    if (!playerId) {
        profileContainer.innerHTML = '<p>Player ID not found.</p>';
        return;
    }

    profileContainer.innerHTML = '<p>Loading player profile...</p>';

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

    if (error) {
        console.error('Player profile error:', error.message);
        profileContainer.innerHTML = '<p>Unable to load player profile.</p>';
        return;
    }

    profileContainer.innerHTML = `
        <div class="full-player-profile">

            ${data.photo_url ? `
                <img src="${data.photo_url}" 
                     alt="${data.full_name}" 
                     class="profile-photo">
            ` : ''}

            <h2>${data.full_name || 'Player Name'}</h2>

            <p><strong>Club:</strong> ${data.club || 'Not provided'}</p>

            <p><strong>Position:</strong> ${data.position || 'Not provided'}</p>

            <p><strong>Age:</strong> ${data.age ?? 'Not provided'}</p>

            <p><strong>Preferred Foot:</strong> ${data.preferred_foot || 'Not provided'}</p>

            <p><strong>Jersey Number:</strong> ${data.jersey_number ?? 'Not provided'}</p>

            <h3>Player Biography</h3>

<p style="white-space: pre-line; text-align: left; line-height: 1.8;">
    ${data.biography || 'Player biography has not been added yet.'}
</p>

        </div>
    `;
}

loadPlayerProfile();

// LOAD APPROVED PLAYER COMMENTS
async function loadPlayerComments() {

    const commentsContainer = document.getElementById('commentsContainer');

    commentsContainer.textContent = 'Loading comments...';

    const { data, error } = await supabase
        .from('player_comments')
        .select('*')
        .eq('player_id', playerId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        commentsContainer.textContent = 'Unable to load comments.';
        console.error(error.message);
        return;
    }

    commentsContainer.innerHTML = '';

    if (!data || data.length === 0) {
        commentsContainer.textContent = 'No approved comments yet.';
        return;
    }

    data.forEach(function(item) {

        const commentCard = document.createElement('div');
        commentCard.className = 'comment-card';

        const name = document.createElement('h4');
        name.textContent = item.commenter_name;

        const comment = document.createElement('p');
        comment.textContent = item.comment;

        const date = document.createElement('small');
        date.textContent = new Date(item.created_at).toLocaleDateString();

        commentCard.append(name, comment, date);

        commentsContainer.appendChild(commentCard);
    });
}


// SUBMIT PLAYER COMMENT
const commentForm = document.getElementById('commentForm');

commentForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    const commenterName = document.getElementById('commenterName').value.trim();
    const playerComment = document.getElementById('playerComment').value.trim();
    const commentMessage = document.getElementById('commentMessage');

    if (!commenterName || !playerComment) {
        commentMessage.textContent = 'Please complete all fields.';
        return;
    }

    const { error } = await supabase
        .from('player_comments')
        .insert({
            player_id: playerId,
            commenter_name: commenterName,
            comment: playerComment
        });

    if (error) {
        commentMessage.textContent = 'Unable to submit comment. Please try again.';
        console.error(error.message);
        return;
    }

    commentMessage.textContent = 'Your comment was submitted and is awaiting approval.';

    commentForm.reset();
});


// LOAD COMMENTS
loadPlayerComments();