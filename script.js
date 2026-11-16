import { supabase } from './supabase.js';
// WEBSITE NEWS

const news = [

    {
        title: "Rainbow FC Defeats Bong Investment Academy",
        category: "Football",
        image: "images/Rainbow.jpg",
        description: "Rainbow FC secured a 3-1 victory over Bong Investment Academy."
    },

    {
        title: "Bong County Kickball Activities",
        category: "Kickball",
        image: "images/Kickball.jpg",
        description: "Local kickball teams continue to showcase their talents."
    },

    {
        title: "Basketball Development in Bong County",
        category: "Basketball",
        image: "images/Basketball.jpg",
        description: "Basketball activities continue to attract young athletes."
    },

    {
        title: "Volleyball Development",
        category: "Volleyball",
        image: "images/volleyball.jpg",
        description: "Volleyball remains an important part of local sports."
    }

];


// DISPLAY NEWS

function displayNews(newsList) {

   
const container = document.getElementById("newsContainer");

container.innerHTML = "";

newsList.forEach(item => {

    container.innerHTML += `

        <div class="news-card">

            <img 
                src="${item.image}" 
                alt="${item.title}"
                class="news-preview-image"
                onclick="openNewsPhoto('${item.image}')"
                style="cursor:pointer;"
            >

            <h3>${item.title}</h3>

            <p class="category">${item.category}</p>

            <p>${item.description}</p>

        </div>

    `;

});

}



// FILTER NEWS

function filterNews(category) {

    if (category === "All") {

        displayNews(news);

    } else {

        const filtered = news.filter(item =>
            item.category === category
        );

        displayNews(filtered);

    }

}


// SEARCH NEWS

function searchNews() {

    const search = document
        .getElementById("searchInput")
        .value.toLowerCase();

    const filtered = news.filter(item =>

        item.title.toLowerCase().includes(search) ||

        item.category.toLowerCase().includes(search) ||

        item.description.toLowerCase().includes(search)

    );

    displayNews(filtered);

}


// LOAD RECENT MATCH RESULTS FROM SUPABASE

async function displayResults() {

    const container = document.getElementById("resultsContainer");

    container.innerHTML = "<p>Loading recent results...</p>";

    const { data, error } = await supabase
        .from('matches')
        .select(`
            home_club_name,
            away_club_name,
            home_score,
            away_score,
            match_date,
            status
        `)
        .eq('status', 'Completed')
        .order('match_date', { ascending: false })
        .limit(6);

    if (error) {
        console.error('Error loading results:', error);
        container.innerHTML = "<p>Unable to load recent results.</p>";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No completed matches yet.</p>";
        return;
    }

    container.innerHTML = '';

    data.forEach(match => {

        container.innerHTML += `
            <div class="result-card">
                <div class="result-teams">
                    <h3>${match.home_club_name}</h3>
                    <h2>${match.home_score} - ${match.away_score}</h2>
                    <h3>${match.away_club_name}</h3>
                </div>
                <p>Full Time</p>
            </div>
        `;

    });

}


// LOAD UPCOMING FIXTURES FROM SUPABASE

async function displayFixtures() {

    const container = document.getElementById("fixturesContainer");

    container.innerHTML = "<p>Loading upcoming fixtures...</p>";

    const { data, error } = await supabase
        .from('matches')
        .select(`
            home_club_name,
            away_club_name,
            match_date,
            venue,
            competition
        `)
        .eq('status', 'Upcoming')
        .order('match_date', { ascending: true })
        .limit(6);

    if (error) {

        console.error('Error loading fixtures:', error);

        container.innerHTML = "<p>Unable to load upcoming fixtures.</p>";

        return;
    }

    if (!data || data.length === 0) {

        container.innerHTML = "<p>No upcoming fixtures scheduled.</p>";

        return;
    }

    container.innerHTML = '';

    data.forEach(match => {

        container.innerHTML += `
            <div class="fixture-card">

                <h3>${match.home_club_name} VS ${match.away_club_name}</h3>

                <p>${match.competition || 'Upcoming Match'}</p>

                <p>${match.match_date || 'Date to be announced'}</p>

                <p>${match.venue || 'Venue to be announced'}</p>

            </div>
        `;

    });

}


// MOBILE MENU

function toggleMenu() {

    document
        .getElementById("navigation")
        .classList.toggle("active");

}


// AUTOMATIC COPYRIGHT YEAR

document.getElementById("year").textContent =
    new Date().getFullYear();


// LOAD WEBSITE CONTENT

displayNews(news);

displayResults();

displayFixtures();


function openNewsPhoto(photoUrl) {
    const modal = document.getElementById("newsPhotoModal");
    const largePhoto = document.getElementById("newsPhotoLarge");

    largePhoto.src = photoUrl;
    modal.style.display = "flex";
}

function closeNewsPhoto() {
    const modal = document.getElementById("newsPhotoModal");
    modal.style.display = "none";
}

