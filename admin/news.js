
import { supabase } from '../supabase.js';

// 1. GET HTML ELEMENTS
const newsForm = document.getElementById('newsForm');
const newsTable = document.getElementById('newsTable');
const searchNews = document.getElementById('searchNews');

const title = document.getElementById('title');
const category = document.getElementById('category');
const summary = document.getElementById('summary');
const content = document.getElementById('content');
const imageFile = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const newsStatus = document.getElementById('newsStatus');

const newsMessage = document.getElementById('newsMessage');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEdit');

let editingNewsId = null;
let currentFeaturedImageUrl = null;

// 2. PREVIEW SELECTED PHOTO
imageFile.addEventListener('change', function() {
    const file = imageFile.files[0];

    if (!file) {
        imagePreview.style.display = 'none';
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        imageFile.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('Photo must not be larger than 5MB.');
        imageFile.value = '';
        return;
    }

    imagePreview.src = URL.createObjectURL(file);
    imagePreview.style.display = 'block';
});

// 3. CHECK ADMINISTRATOR ACCESS
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

// 4. CREATE NEWS SLUG
function createSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// 5. UPLOAD PHOTO
async function uploadFeaturedImage(file) {
    const fileName = Date.now() + '-' +
        file.name.replace(/[^a-zA-Z0-9.-]/g, '-');

    const filePath = 'news/' + fileName;

    const { error } = await supabase
        .storage
        .from('sports-gallery')
        .upload(filePath, file, {
            contentType: file.type,
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data } = supabase
        .storage
        .from('sports-gallery')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// 6. RESET NEWS FORM
function resetNewsForm() {
    newsForm.reset();

    editingNewsId = null;
    currentFeaturedImageUrl = null;

    imagePreview.src = '';
    imagePreview.style.display = 'none';

    submitButton.textContent = 'Save News';
    cancelEditButton.style.display = 'none';
    newsMessage.textContent = '';
}

// 7. SAVE OR UPDATE NEWS
newsForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    let featuredImageUrl = currentFeaturedImageUrl;
    const selectedFile = imageFile.files[0];

    if (selectedFile) {
        try {
            newsMessage.textContent = 'Uploading photo...';
            submitButton.disabled = true;

            featuredImageUrl = await uploadFeaturedImage(selectedFile);

        } catch (error) {
            newsMessage.textContent =
                'Photo upload failed: ' + error.message;
            console.error(error);
            submitButton.disabled = false;
            return;
        }
    }

    const newsData = {
        title: title.value.trim(),
        slug: createSlug(title.value) + '-' + Date.now(),
        category: category.value,
        summary: summary.value.trim(),
        content: content.value.trim(),
        featured_image_url: featuredImageUrl,
        status: newsStatus.value,
        published_at: newsStatus.value === 'Published'
            ? new Date().toISOString()
            : null
    };

    newsMessage.textContent = 'Saving news...';

    let result;

    if (editingNewsId !== null) {
        result = await supabase
            .from('news')
            .update(newsData)
            .eq('id', editingNewsId);
    } else {
        result = await supabase
            .from('news')
            .insert([newsData]);
    }

    submitButton.disabled = false;

    if (result.error) {
        newsMessage.textContent = 'Error: ' + result.error.message;
        console.error(result.error);
        return;
    }

    newsMessage.textContent = editingNewsId !== null
        ? 'News updated successfully!'
        : 'News saved successfully!';

    resetNewsForm();
    await loadNews(searchNews.value);
});

// 8. LOAD NEWS
async function loadNews(search = '') {
    newsTable.innerHTML =
        '<tr><td colspan="5">Loading news...</td></tr>';

    let query = supabase
        .from('news')
        .select(`
            id,
            title,
            slug,
            category,
            summary,
            content,
            featured_image_url,
            status,
            published_at,
            created_at
        `)
        .order('created_at', { ascending: false });

    if (search.trim() !== '') {
        query = query.ilike('title', '%' + search.trim() + '%');
    }

    const { data, error } = await query;

    if (error) {
        newsTable.innerHTML =
            '<tr><td colspan="5">Error loading news.</td></tr>';
        console.error(error.message);
        return;
    }

    newsTable.innerHTML = '';

    if (data.length === 0) {
        newsTable.innerHTML =
            '<tr><td colspan="5">No news found.</td></tr>';
        return;
    }

    data.forEach(function(news) {
        const row = document.createElement('tr');

        const titleCell = document.createElement('td');
        const categoryCell = document.createElement('td');
        const statusCell = document.createElement('td');
        const dateCell = document.createElement('td');
        const actionCell = document.createElement('td');

        titleCell.textContent = news.title;
        categoryCell.textContent = news.category || '';
        statusCell.textContent = news.status;

        dateCell.textContent = news.created_at
            ? new Date(news.created_at).toLocaleDateString()
            : '';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'action-button edit-button';

        editButton.addEventListener('click', function() {
            editNews(news);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'action-button delete-button';

        deleteButton.addEventListener('click', async function() {
            const confirmed = confirm(
                'Are you sure you want to delete this news article?'
            );

            if (!confirmed) return;

            const { error: deleteError } = await supabase
                .from('news')
                .delete()
                .eq('id', news.id);

            if (deleteError) {
                alert('Delete failed: ' + deleteError.message);
                return;
            }

            alert('News deleted successfully!');
            await loadNews(searchNews.value);
        });

        actionCell.append(editButton, deleteButton);
        row.append(titleCell, categoryCell, statusCell, dateCell, actionCell);
        newsTable.appendChild(row);
    });
}

// 9. EDIT NEWS
function editNews(news) {
    editingNewsId = news.id;

    title.value = news.title || '';
    category.value = news.category || '';
    summary.value = news.summary || '';
    content.value = news.content || '';

    currentFeaturedImageUrl = news.featured_image_url || null;

    if (currentFeaturedImageUrl) {
        imagePreview.src = currentFeaturedImageUrl;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }

    imageFile.value = '';
    newsStatus.value = news.status || 'Draft';

    submitButton.textContent = 'Save Changes';
    cancelEditButton.style.display = 'inline-block';
    newsMessage.textContent = 'Editing: ' + news.title;

    newsForm.scrollIntoView({ behavior: 'smooth' });
}

// 10. CANCEL EDITING
cancelEditButton.addEventListener('click', function() {
    resetNewsForm();
});

// 11. SEARCH NEWS
searchNews.addEventListener('input', function() {
    loadNews(searchNews.value);
});

// 12. START NEWS MANAGEMENT
async function startNewsManagement() {
    const authorized = await checkAdmin();

    if (!authorized) return;

    await loadNews();
}

startNewsManagement();
