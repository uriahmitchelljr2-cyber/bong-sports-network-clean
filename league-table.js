
import { supabase } from './supabase.js';

const tableBody = document.getElementById('leagueTableBody');
const tableMessage = document.getElementById('tableMessage');

async function loadLeagueTable() {

    tableMessage.textContent = 'Loading league standings...';

    // 1. Load Bong County clubs
    const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('club_name, county')
        .ilike('county', '%Bong%');

    if (clubsError) {
        tableMessage.textContent = 'Unable to load clubs.';
        console.error(clubsError);
        return;
    }

    if (!clubs || clubs.length === 0) {
        tableMessage.textContent = 'No Bong County clubs found.';
        return;
    }

    // 2. Load completed matches for this competition
    const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
            competition,
            home_club_name,
            away_club_name,
            home_score,
            away_score,
            status
        `)
        .eq('competition', 'LFA Bong Sub-Association 3rd Division League')
        .eq('status', 'Completed');

    if (matchesError) {
        tableMessage.textContent = 'Unable to load match results.';
        console.error(matchesError);
        return;
    }

    // 3. Create statistics for every club
    const standings = clubs.map(function(club) {

        return {
            club: club.club_name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        };

    });

    // 4. Calculate statistics from completed matches
    matches.forEach(function(match) {

        if (
            match.home_score === null ||
            match.away_score === null
        ) {
            return;
        }

        const home = standings.find(
            team => team.club === match.home_club_name
        );

        const away = standings.find(
            team => team.club === match.away_club_name
        );

        if (!home || !away) {
            console.warn('Club not found:', match);
            return;
        }

        const homeGoals = Number(match.home_score);
        const awayGoals = Number(match.away_score);

        home.played++;
        away.played++;

        home.goalsFor += homeGoals;
        home.goalsAgainst += awayGoals;

        away.goalsFor += awayGoals;
        away.goalsAgainst += homeGoals;

        if (homeGoals > awayGoals) {

            home.won++;
            home.points += 3;
            away.lost++;

        } else if (homeGoals < awayGoals) {

            away.won++;
            away.points += 3;
            home.lost++;

        } else {

            home.drawn++;
            away.drawn++;

            home.points++;
            away.points++;

        }

    });

    // 5. Calculate goal difference
    standings.forEach(function(team) {

        team.goalDifference =
            team.goalsFor - team.goalsAgainst;

    });

    // 6. Sort the league table
    standings.sort(function(a, b) {

        if (b.points !== a.points) {
            return b.points - a.points;
        }

        if (b.goalDifference !== a.goalDifference) {
            return b.goalDifference - a.goalDifference;
        }

        return b.goalsFor - a.goalsFor;

    });

    // 7. Display the standings
    tableBody.innerHTML = '';

    standings.forEach(function(team, index) {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.club}</td>
            <td>${team.played}</td>
            <td>${team.won}</td>
            <td>${team.drawn}</td>
            <td>${team.lost}</td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td>${team.goalDifference}</td>
            <td><strong>${team.points}</strong></td>
        `;

        tableBody.appendChild(row);

    });

    tableMessage.textContent =
        'League standings updated successfully.';

}

loadLeagueTable();
