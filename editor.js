// Storage utilities
const storage = {
    getPosts() {
        const posts = localStorage.getItem('inkwell_posts');
        return posts ? JSON.parse(posts) : [];
    },

    savePosts(posts) {
        localStorage.setItem('inkwell_posts', JSON.stringify(posts));
    },

    getPost(id) {
        const posts = this.getPosts();
        return posts.find(p => p.id === id);
    },

    addPost(post) {
        const posts = this.getPosts();
        posts.push(post);
        this.savePosts(posts);
    },

    updatePost(id, updatedPost) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updatedPost };
            this.savePosts(posts);
        }
    }
};

// Read status utilities
const readStatus = {
    _key: 'inkwell_read_status',

    getAll() {
        const data = localStorage.getItem(this._key);
        return data ? JSON.parse(data) : {};
    },

    isRead(postId) {
        const all = this.getAll();
        return all.hasOwnProperty(postId);
    },

    markRead(postId) {
        const all = this.getAll();
        all[postId] = Date.now();
        localStorage.setItem(this._key, JSON.stringify(all));
    },

    markUnread(postId) {
        const all = this.getAll();
        delete all[postId];
        localStorage.setItem(this._key, JSON.stringify(all));
    },

    toggle(postId) {
        if (this.isRead(postId)) {
            this.markUnread(postId);
            return false;
        } else {
            this.markRead(postId);
            return true;
        }
    }
};

// Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Strip YAML frontmatter from markdown content
function stripFrontmatter(content) {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

// Render markdown to the preview panel with syntax-highlighted code blocks.
// Uses marked.js for markdown parsing and Highlight.js for code highlighting.
// Falls back gracefully to plain text if either library is unavailable.
function renderPreview(markdown) {
    const preview = document.getElementById('preview');
    if (!preview) return;

    if (!markdown || !markdown.trim()) {
        preview.innerHTML = '<p class="preview-placeholder">Preview will appear here\u2026</p>';
        return;
    }

    try {
        const content = stripFrontmatter(markdown);

        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(content);
        } else {
            // Fallback: escape HTML and wrap in a pre block
            const escaped = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            preview.innerHTML = '<pre>' + escaped + '</pre>';
        }

        // Apply syntax highlighting to all fenced code blocks
        if (typeof hljs !== 'undefined') {
            preview.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    } catch (e) {
        // Last-resort fallback: render as plain text
        preview.textContent = markdown;
    }
}

// Word count stats utilities
function getEditorStats(text) {
    const body = stripFrontmatter(text);

    const chars = body.length;

    const trimmed = body.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;

    // Paragraphs: non-empty lines separated by blank lines
    const paragraphs = trimmed === '' ? 0 :
        trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    const readingMinutes = Math.max(1, Math.ceil(words / 200));
    const readTime = words === 0 ? '0 min' : readingMinutes + ' min';

    return { chars, words, paragraphs, readTime };
}

function updateStats(text) {
    const stats = getEditorStats(text);
    const statsBar = document.getElementById('statsBar');
    if (!statsBar) return;

    document.getElementById('statChars').textContent = stats.chars.toLocaleString();
    document.getElementById('statWords').textContent = stats.words.toLocaleString();
    document.getElementById('statParagraphs').textContent = stats.paragraphs;
    document.getElementById('statReadTime').textContent = stats.readTime;

    if (stats.words > 5000) {
        statsBar.classList.add('warning');
    } else {
        statsBar.classList.remove('warning');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const form = document.getElementById('postForm');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const pageTitle = document.getElementById('pageTitle');
    const saveBtn = document.getElementById('saveBtn');

    const readToggleBtn = document.getElementById('readToggleBtn');

    // Update the read toggle button label
    function updateReadToggle() {
        if (!readToggleBtn || !postId) return;
        const isRead = readStatus.isRead(postId);
        readToggleBtn.textContent = isRead ? 'Mark as Unread' : 'Mark as Read';
        readToggleBtn.title = isRead ? 'Mark this post as unread' : 'Mark this post as read';
    }

    // If editing, load the post
    if (postId) {
        const post = storage.getPost(postId);
        if (post) {
            pageTitle.textContent = 'Edit Post';
            saveBtn.textContent = 'Update Post';
            titleInput.value = post.title;
            contentInput.value = post.content;
            renderPreview(post.content);

            // Mark the post as read when opened
            readStatus.markRead(postId);

            // Show and wire up the read toggle button
            if (readToggleBtn) {
                readToggleBtn.style.display = 'inline-block';
                updateReadToggle();
                readToggleBtn.addEventListener('click', () => {
                    readStatus.toggle(postId);
                    updateReadToggle();
                });
            }
        } else {
            alert('Post not found');
            window.location.href = 'manage.html';
        }
    }

    // Live preview and stats: update on every keystroke
    contentInput.addEventListener('input', () => {
        renderPreview(contentInput.value);
        updateStats(contentInput.value);
    });

    // Initial stats update
    updateStats(contentInput.value);

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert('Please fill in all fields');
            return;
        }

        if (postId) {
            // Update existing post
            storage.updatePost(postId, {
                title,
                content,
                date: new Date().toISOString()
            });
            // Re-mark as read after saving
            readStatus.markRead(postId);
        } else {
            // Create new post
            const newId = Date.now().toString();
            const post = {
                id: newId,
                title,
                slug: generateSlug(title),
                content,
                date: new Date().toISOString()
            };
            storage.addPost(post);
            // Mark new post as read immediately
            readStatus.markRead(newId);
        }

        window.location.href = 'manage.html';
    });
});
