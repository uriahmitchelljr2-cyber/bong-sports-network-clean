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


// MATCH RESULTS

const results = [

    {
        home: "Rainbow FC",
        away: "Bong Investment Academy",
        score: "3 - 1"
    },

    {
        home: "Bong County",
        away: "Nimba County",
        score: "2 - 1"
    }

];


function displayResults() {

    const container = document.getElementById("resultsContainer");

    container.innerHTML = "";

    results.forEach(match => {

        container.innerHTML += `

            <div class="result-card">

                <h3>${match.home}</h3>

                <h2>${match.score}</h2>

                <h3>${match.away}</h3>

                <p>Full Time</p>

            </div>

        `;

    });

}


// NATIONAL COUNTY SPORTS MEET UPCOMING FIXTURES

const fixtures = [

    {
        home: "Bong County",
        away: "Grand Cape Mount County",
        date: "Upcoming Match-National County Sports Meet"
    },

    {
        home: "Bong County",
        away: "Maryland County",
        date: "Upcoming Match-National County Sports Meet"
    }

];


function displayFixtures() {

    const container = document.getElementById("fixturesContainer");

    container.innerHTML = "";

    fixtures.forEach(match => {

        container.innerHTML += `

            <div class="fixture-card">

                <h3>${match.home} VS ${match.away}</h3>

                <p>${match.date}</p>

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

