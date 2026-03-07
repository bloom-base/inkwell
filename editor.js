// Import keyboard shortcuts functionality
import { setupKeyboardShortcuts, wrapSelection, insertLink } from './editor-shortcuts.js';

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

// Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
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
    
    // If editing, load the post
    if (postId) {
        const post = storage.getPost(postId);
        if (post) {
            pageTitle.textContent = 'Edit Post';
            saveBtn.textContent = 'Update Post';
            titleInput.value = post.title;
            contentInput.value = post.content;
        } else {
            alert('Post not found');
            window.location.href = 'manage.html';
        }
    }
    
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
        } else {
            // Create new post
            const post = {
                id: Date.now().toString(),
                title,
                slug: generateSlug(title),
                content,
                date: new Date().toISOString()
            };
            storage.addPost(post);
        }
        
        window.location.href = 'manage.html';
    });
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts(contentInput, form);
    
    // Toolbar button handlers
    document.getElementById('boldBtn').addEventListener('click', () => {
        const start = contentInput.selectionStart;
        const end = contentInput.selectionEnd;
        const result = wrapSelection(contentInput.value, start, end, '**', '**');
        contentInput.value = result.text;
        contentInput.setSelectionRange(result.selectionStart, result.selectionEnd);
        contentInput.focus();
    });
    
    document.getElementById('italicBtn').addEventListener('click', () => {
        const start = contentInput.selectionStart;
        const end = contentInput.selectionEnd;
        const result = wrapSelection(contentInput.value, start, end, '*', '*');
        contentInput.value = result.text;
        contentInput.setSelectionRange(result.selectionStart, result.selectionEnd);
        contentInput.focus();
    });
    
    document.getElementById('linkBtn').addEventListener('click', () => {
        const start = contentInput.selectionStart;
        const end = contentInput.selectionEnd;
        const url = prompt('Enter URL:');
        if (url) {
            const result = insertLink(contentInput.value, start, end, url);
            contentInput.value = result.text;
            contentInput.setSelectionRange(result.selectionStart, result.selectionEnd);
            contentInput.focus();
        }
    });
    
    document.getElementById('helpBtn').addEventListener('click', () => {
        let panel = document.getElementById('helpPanel');
        if (!panel) {
            panel = createHelpPanel();
            document.body.appendChild(panel);
        }
        panel.style.display = panel.style.display === 'none' || !panel.style.display ? 'block' : 'none';
    });
});

// Helper to create help panel (also used by shortcuts)
function createHelpPanel() {
    const panel = document.createElement('div');
    panel.id = 'helpPanel';
    panel.className = 'help-panel';
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '⌘' : 'Ctrl';
    
    panel.innerHTML = `
        <div class="help-panel-content">
            <div class="help-panel-header">
                <h3>Keyboard Shortcuts</h3>
                <button class="help-close" onclick="document.getElementById('helpPanel').style.display='none'">×</button>
            </div>
            <div class="help-shortcuts">
                <div class="help-shortcut">
                    <span class="help-key">${mod}+S</span>
                    <span class="help-desc">Save post</span>
                </div>
                <div class="help-shortcut">
                    <span class="help-key">${mod}+B</span>
                    <span class="help-desc">Bold</span>
                </div>
                <div class="help-shortcut">
                    <span class="help-key">${mod}+I</span>
                    <span class="help-desc">Italic</span>
                </div>
                <div class="help-shortcut">
                    <span class="help-key">${mod}+K</span>
                    <span class="help-desc">Insert link</span>
                </div>
                <div class="help-shortcut">
                    <span class="help-key">Esc</span>
                    <span class="help-desc">Close dialog</span>
                </div>
                <div class="help-shortcut">
                    <span class="help-key">?</span>
                    <span class="help-desc">Toggle this help</span>
                </div>
            </div>
        </div>
    `;
    return panel;
}

// Export for potential reuse
export { createHelpPanel };
