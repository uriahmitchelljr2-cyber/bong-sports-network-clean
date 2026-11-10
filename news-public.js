
import { supabase } from './supabase.js';

// STORE PUBLISHED NEWS
let news = [];


// DISPLAY NEWS
function displayNews(newsList) {
    const container = document.getElementById("newsContainer");

    container.innerHTML = "";

    if (newsList.length === 0) {
        container.innerHTML = "<p>No news articles found.</p>";
        return;
    }

    newsList.forEach(item => {
        const card = document.createElement("div");
        card.className = "news-card";

        if (item.featured_image_url) {
            const image = document.createElement("img");
            image.src = item.featured_image_url;
            image.alt = item.title;
            image.style.cursor = "pointer";

            image.addEventListener("click", function () {
                const modal = document.getElementById("newsPhotoModal");
                const preview = document.getElementById("newsPhotoLarge");

                preview.src = item.featured_image_url;
                modal.style.display = "flex";
            });

            card.appendChild(image);
        }

        const title = document.createElement("h3");
        title.textContent = item.title;

        const category = document.createElement("p");
        category.className = "category";
        category.textContent = item.category || "Sports";

        const description = document.createElement("p");
        description.textContent = item.summary || "";

        const link = document.createElement("a");
        link.href = "admin/news-details.html?slug=" +
            encodeURIComponent(item.slug);
        link.textContent = "Read Full Story";
        link.className = "read-more";

        card.append(title, category, description, link);
        container.appendChild(card);
    });
}

// LOAD PUBLISHED NEWS FROM SUPABASE
async function loadNews() {
    const container = document.getElementById("newsContainer");

    container.innerHTML = "<p>Loading news...</p>";

    const { data, error } = await supabase
        .from("news")
        .select("title, slug, category, summary, featured_image_url")
        .eq("status", "Published")
        .order("published_at", { ascending: false });

    if (error) {
        console.error("News loading error:", error);
        container.innerHTML = "<p>Unable to load news.</p>";
        return;
    }

    news = data || [];
    displayNews(news);
}

// FILTER NEWS
window.filterNews = function(category) {
    if (category === "All") {
        displayNews(news);
    } else {
        const filtered = news.filter(item =>
            item.category === category
        );

        displayNews(filtered);
    }
};

// SEARCH NEWS
window.searchNews = function() {
    const search = document
        .getElementById("searchInput")
        .value.toLowerCase();

    const filtered = news.filter(item =>
        (item.title || "").toLowerCase().includes(search) ||
        (item.category || "").toLowerCase().includes(search) ||
        (item.summary || "").toLowerCase().includes(search)
    );

    displayNews(filtered);
};

// START
loadNews();
