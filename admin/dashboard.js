
import { supabase } from '../supabase.js';

// Check administrator access
async function checkAdmin() {

    // Get current logged-in user
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = 'admin.html';
        return;
    }

    // Check administrator profile
    const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

    // Reject users without admin access
    if (profileError || !profile || profile.role !== 'admin') {

        await supabase.auth.signOut();

        window.location.href = 'admin.html';
        return;
    }

    console.log('Administrator verified!');
}

// Run administrator check
checkAdmin();

// Logout button
const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', async function() {

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert('Logout failed: ' + error.message);
        return;
    }

    window.location.href = 'admin.html';

});


// LOAD PENDING COMMENTS COUNT
async function loadPendingCommentsCount() {

    const counter = document.getElementById('pendingCommentsCount');

    if (!counter) return;

    counter.textContent = 'Loading...';

    const { count, error } = await supabase
        .from('player_comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    if (error) {
        console.error('Pending comments error:', error.message);
        counter.textContent = 'Unable to load count';
        return;
    }

    counter.textContent = count + ' comments awaiting approval';
}

// LOAD DASHBOARD TOTALS
async function loadDashboardTotals() {

    const tables = [
        { table: 'players', element: 'totalPlayers' },
        { table: 'clubs', element: 'totalClubs' },
        { table: 'matches', element: 'totalMatches' },
        { table: 'news', element: 'totalNews' },
        { table: 'player_statistics', element: 'totalStatistics' },
        { table: 'match_reports', element: 'totalReports' }
    ];

    for (const item of tables) {

        const { count, error } = await supabase
            .from(item.table)
            .select('*', { count: 'exact', head: true });

        const counter = document.getElementById(item.element);

        if (error) {
            console.error(item.table + ' count error:', error.message);
            counter.textContent = 'Error';
        } else {
            counter.textContent = count;
        }
    }
}

// START DASHBOARD TOTALS
loadDashboardTotals();

// LOAD RECENT WEBSITE ACTIVITY
async function loadRecentActivity() {

    const activityContainer = document.getElementById('recentActivity');

    if (!activityContainer) return;

    activityContainer.innerHTML = '<p>Loading recent activity...</p>';

    // Get recent published news
    const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('title, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);

    // Get recent match reports
    const { data: reportsData, error: reportsError } = await supabase
        .from('match_reports')
        .select('headline, author, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    // Get recent matches
    const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('home_club_name, away_club_name, home_score, away_score, match_date, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (newsError || reportsError || matchesError) {
        console.error('Activity loading error:', newsError || reportsError || matchesError);
        activityContainer.innerHTML = '<p>Unable to load recent activity.</p>';
        return;
    }

        // Combine all activities
    let activities = [];

    newsData.forEach(item => {
        activities.push({
            title: 'News Published: ' + item.title,
            date: item.published_at || item.created_at
        });
    });

    reportsData.forEach(item => {
        activities.push({
            title: 'Match Report: ' + item.headline,
            date: item.created_at
        });
    });

    matchesData.forEach(item => {
        activities.push({
            title: 'Match Added: ' + item.home_club_name + ' vs ' + item.away_club_name,
            date: item.created_at
        });
    });

    // Sort activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display the latest 10 activities
    activityContainer.innerHTML = '';

    if (activities.length === 0) {
        activityContainer.textContent = 'No recent activity found.';
        return;
    }

    activities.slice(0, 10).forEach(item => {

        const activity = document.createElement('p');

        const activityDate = item.date
            ? new Date(item.date).toLocaleString()
            : 'Date unavailable';

        activity.textContent = item.title + ' — ' + activityDate;

        activityContainer.appendChild(activity);
    });
}

// START RECENT ACTIVITY
loadRecentActivity();

// START COUNTER
loadPendingCommentsCount();
