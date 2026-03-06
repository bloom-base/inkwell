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
    
    deletePost(id) {
        const posts = this.getPosts();
        const filtered = posts.filter(p => p.id !== id);
        this.savePosts(filtered);
    }
};

// Extract tags from markdown frontmatter
function extractTags(content) {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return [];
    
    const frontmatter = frontmatterMatch[1];
    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
    
    if (tagsMatch) {
        return tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
    }
    
    return [];
}

// Generate excerpt from content
function generateExcerpt(content, maxLength = 150) {
    // Remove frontmatter
    const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    // Remove markdown syntax
    const plainText = withoutFrontmatter
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
}

// Highlight matching text
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// State
let allPosts = [];
let filteredPosts = [];
let activeTag = null;
let searchQuery = '';

// Render posts
function renderPosts() {
    const postList = document.getElementById('postList');
    const emptyState = document.getElementById('emptyState');
    const filterInfo = document.getElementById('filterInfo');
    
    if (allPosts.length === 0) {
        postList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    if (filteredPosts.length === 0) {
        postList.innerHTML = '<div class="empty-state"><h2>No matching posts</h2><p>Try adjusting your search or filters.</p></div>';
        emptyState.style.display = 'none';
        postList.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    postList.style.display = 'block';
    
    // Update filter info
    if (searchQuery || activeTag) {
        let infoText = '';
        if (searchQuery && activeTag) {
            infoText = `Showing ${filteredPosts.length} post(s) matching "${searchQuery}" with tag "${activeTag}"`;
        } else if (searchQuery) {
            infoText = `Showing ${filteredPosts.length} post(s) matching "${searchQuery}"`;
        } else if (activeTag) {
            infoText = `Showing ${filteredPosts.length} post(s) tagged "${activeTag}"`;
        }
        filterInfo.textContent = infoText;
        filterInfo.classList.add('visible');
    } else {
        filterInfo.classList.remove('visible');
    }
    
    postList.innerHTML = filteredPosts.map(post => {
        const tags = extractTags(post.content);
        const excerpt = generateExcerpt(post.content);
        const highlightedTitle = highlightText(post.title, searchQuery);
        const highlightedExcerpt = highlightText(excerpt, searchQuery);
        
        return `
            <li class="post-item">
                <div class="post-header">
                    <div>
                        <div class="post-title">${highlightedTitle}</div>
                        <div class="post-date">${new Date(post.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</div>
                    </div>
                </div>
                <div class="post-excerpt">${highlightedExcerpt}</div>
                ${tags.length > 0 ? `
                    <div class="post-tags">
                        ${tags.map(tag => `
                            <span class="tag ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="post-actions">
                    <a href="editor.html?id=${post.id}" class="btn btn-sm">Edit</a>
                    <button class="btn btn-sm btn-delete" data-id="${post.id}">Delete</button>
                </div>
            </li>
        `;
    }).join('');
    
    // Attach event listeners
    attachEventListeners();
}

// Filter posts
function filterPosts() {
    filteredPosts = allPosts.filter(post => {
        // Filter by search query
        if (searchQuery) {
            const titleMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const contentMatch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
            if (!titleMatch && !contentMatch) return false;
        }
        
        // Filter by tag
        if (activeTag) {
            const tags = extractTags(post.content);
            if (!tags.includes(activeTag)) return false;
        }
        
        return true;
    });
    
    // Update clear filters button
    const clearFilters = document.getElementById('clearFilters');
    if (searchQuery || activeTag) {
        clearFilters.classList.add('visible');
    } else {
        clearFilters.classList.remove('visible');
    }
    
    renderPosts();
}

// Attach event listeners to dynamic content
function attachEventListeners() {
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this post?')) {
                storage.deletePost(id);
                loadPosts();
            }
        });
    });
    
    // Tag clicks
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const tagName = e.target.dataset.tag;
            if (activeTag === tagName) {
                activeTag = null;
            } else {
                activeTag = tagName;
            }
            filterPosts();
        });
    });
}

// Load posts
function loadPosts() {
    allPosts = storage.getPosts();
    // Sort by date descending
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    filterPosts();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        filterPosts();
    });
    
    // Clear filters button
    const clearFilters = document.getElementById('clearFilters');
    clearFilters.addEventListener('click', () => {
        searchQuery = '';
        activeTag = null;
        searchInput.value = '';
        filterPosts();
    });
    
    // Load posts
    loadPosts();
    
    // Add sample data if empty (for testing)
    if (allPosts.length === 0) {
        const samplePosts = [
            {
                id: '1',
                title: 'Welcome to inkwell',
                slug: 'welcome-to-inkwell',
                date: new Date('2024-01-15').toISOString(),
                content: `---
title: Welcome to inkwell
tags: [welcome, getting-started]
---

# Welcome to inkwell

This is your first post. **inkwell** is a minimalist markdown blog engine that focuses on beautiful typography and simplicity.

No config files. No theme options. Just write.`
            },
            {
                id: '2',
                title: 'Writing in Markdown',
                slug: 'writing-in-markdown',
                date: new Date('2024-01-20').toISOString(),
                content: `---
title: Writing in Markdown
tags: [markdown, writing]
---

# Writing in Markdown

Markdown makes writing for the web easy. Use simple syntax to create:

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- And more!`
            },
            {
                id: '3',
                title: 'The Art of Minimalism',
                slug: 'art-of-minimalism',
                date: new Date('2024-02-01').toISOString(),
                content: `---
title: The Art of Minimalism
tags: [design, minimalism]
---

# The Art of Minimalism

Less is more. In design, in writing, in life. Focus on what matters and remove everything else.`
            }
        ];
        storage.savePosts(samplePosts);
        loadPosts();
    }
});
