
import { supabase } from '../supabase.js';

const container = document.getElementById('adminCommentsContainer');

// LOAD ALL PLAYER COMMENTS
async function loadComments() {

    container.textContent = 'Loading comments...';

    // Check whether an admin is logged in
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
        container.textContent = 'Please log in as an administrator to manage comments.';
        return;
    }

    const { data: comments, error } = await supabase
        .from('player_comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.textContent = 'Unable to load comments. Check your admin access.';
        console.error(error.message);
        return;
    }

    container.innerHTML = '';

    if (!comments || comments.length === 0) {
        container.textContent = 'No comments found.';
        return;
    }

    // Get player names
    const playerIds = [...new Set(comments.map(item => item.player_id))];

    const { data: players } = await supabase
        .from('players')
        .select('id, full_name')
        .in('id', playerIds);

    const playerNames = {};

    (players || []).forEach(player => {
        playerNames[player.id] = player.full_name;
    });

    comments.forEach(item => {

        const card = document.createElement('div');
        card.className = 'admin-comment-card';

        const name = document.createElement('h3');
        name.textContent = item.commenter_name;

        const player = document.createElement('p');
        player.textContent = 'Player: ' + (playerNames[item.player_id] || 'Unknown');

        const comment = document.createElement('p');
        comment.textContent = item.comment;

        const status = document.createElement('p');
        status.textContent = 'Status: ' + item.status.toUpperCase();

        const date = document.createElement('small');
        date.textContent = new Date(item.created_at).toLocaleString();

        const actions = document.createElement('div');
        actions.className = 'comment-actions';

        const approve = document.createElement('button');
        approve.textContent = 'Approve';
        approve.className = 'approve-btn';
        approve.onclick = () => updateComment(item.id, 'approved');

        const reject = document.createElement('button');
        reject.textContent = 'Reject';
        reject.className = 'reject-btn';
        reject.onclick = () => updateComment(item.id, 'rejected');

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => deleteComment(item.id);

        actions.append(approve, reject, deleteButton);

        card.append(name, player, comment, status, date, actions);

        container.appendChild(card);
    });
}


// APPROVE OR REJECT COMMENT
async function updateComment(id, newStatus) {

    const { error } = await supabase
        .from('player_comments')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        alert('Unable to update comment. Check administrator permissions.');
        console.error(error.message);
        return;
    }

    loadComments();
}


// DELETE COMMENT
async function deleteComment(id) {

    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    const { error } = await supabase
        .from('player_comments')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Unable to delete comment.');
        console.error(error.message);
        return;
    }

    loadComments();
}


// START
loadComments();
