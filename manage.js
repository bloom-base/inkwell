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
        readStatus.remove(id);
    }
};

// Read status utilities — stores { postId: lastReadTimestamp } in localStorage
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

    getTimestamp(postId) {
        const all = this.getAll();
        return all[postId] || null;
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

    remove(postId) {
        this.markUnread(postId);
    },

    isUpdatedSinceRead(postId, postDate) {
        const readTime = this.getTimestamp(postId);
        if (!readTime) return false;
        return new Date(postDate).getTime() > readTime;
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

// Generate markdown file content with frontmatter for a post
function generateMarkdownFile(post) {
    const tags = extractTags(post.content);
    const date = new Date(post.date).toISOString().split('T')[0];

    // Strip any existing frontmatter to get the body
    const body = post.content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trimStart();

    let frontmatter = `---\ntitle: ${post.title}\ndate: ${date}`;
    if (tags.length > 0) {
        frontmatter += `\ntags: [${tags.join(', ')}]`;
    }
    frontmatter += '\n---\n\n';

    return frontmatter + body;
}

// Trigger a browser download of the post as a .md file
function downloadPost(post) {
    const content = generateMarkdownFile(post);
    const slug = post.slug || post.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const filename = slug + '.md';

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Calculate word count from post content (excluding frontmatter)
function getWordCount(content) {
    const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    const plainText = withoutFrontmatter
        .replace(/#{1,6}\s+/g, ' ')
        .replace(/[*_`~]/g, '')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plainText) return 0;
    return plainText.split(' ').filter(w => w.length > 0).length;
}

// Estimate reading time at 200 words per minute
function getReadingTime(wordCount) {
    if (wordCount < 200) return '< 1 min read';
    return `${Math.ceil(wordCount / 200)} min read`;
}

// Format a timestamp as a human-readable relative time string
function formatRelativeTime(dateString) {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const seconds = Math.round((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    if (years === 1) return '1 year ago';
    return `${years} years ago`;
}

// Format a timestamp as a full date/time string for tooltips
function formatFullDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
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
let showUnreadOnly = false;

// Preview tooltip singleton
const tooltip = (() => {
    let el = null;
    let hideTimer = null;
    let showTimer = null;

    function getElement() {
        if (!el) {
            el = document.createElement('div');
            el.className = 'post-preview-tooltip';
            el.setAttribute('role', 'tooltip');
            document.body.appendChild(el);
        }
        return el;
    }

    function position(tip, anchor) {
        const rect = anchor.getBoundingClientRect();
        const gap = 8;

        // Default: place below the card, left-aligned
        let top = rect.bottom + gap;
        let left = rect.left;

        // Measure tooltip (render offscreen first)
        tip.style.left = '-9999px';
        tip.style.top = '-9999px';
        tip.classList.add('visible');
        const tipW = tip.offsetWidth;
        const tipH = tip.offsetHeight;
        tip.classList.remove('visible');

        // Flip above if no room below
        if (top + tipH > window.innerHeight - 8) {
            top = rect.top - tipH - gap;
        }

        // Keep within horizontal bounds
        if (left + tipW > window.innerWidth - 8) {
            left = window.innerWidth - tipW - 8;
        }
        if (left < 8) left = 8;

        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
    }

    function show(postId, anchorEl) {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);

        const post = filteredPosts.find(p => p.id === postId);
        if (!post) return;

        showTimer = setTimeout(() => {
            const tip = getElement();
            const wordCount = getWordCount(post.content);
            const readingTime = getReadingTime(wordCount);
            const createdDate = post.created || post.date;
            const fullDate = formatFullDate(createdDate);

            tip.innerHTML =
                '<div class="tooltip-row">' +
                    '<span class="tooltip-label">Words</span>' +
                    '<span class="tooltip-value">' + wordCount.toLocaleString() + '</span>' +
                '</div>' +
                '<div class="tooltip-row">' +
                    '<span class="tooltip-label">Reading time</span>' +
                    '<span class="tooltip-value">' + readingTime + '</span>' +
                '</div>' +
                '<div class="tooltip-divider"></div>' +
                '<div class="tooltip-row">' +
                    '<span class="tooltip-label">Created</span>' +
                    '<span class="tooltip-value">' + fullDate + '</span>' +
                '</div>';

            position(tip, anchorEl);
            tip.classList.add('visible');
        }, 400);
    }

    function hide() {
        clearTimeout(showTimer);
        hideTimer = setTimeout(() => {
            if (el) el.classList.remove('visible');
        }, 100);
    }

    return { show, hide };
})();

// Render the word count distribution chart
function renderDistributionChart() {
    const chart = document.getElementById('distributionChart');
    if (!chart) return;

    if (allPosts.length === 0) {
        chart.classList.remove('visible');
        return;
    }

    let shortCount = 0;
    let mediumCount = 0;
    let longCount = 0;

    allPosts.forEach(post => {
        const wc = getWordCount(post.content);
        if (wc < 500) shortCount++;
        else if (wc < 1500) mediumCount++;
        else longCount++;
    });

    const total = allPosts.length;
    const shortPct = Math.round((shortCount / total) * 100);
    const mediumPct = Math.round((mediumCount / total) * 100);
    const longPct = Math.round((longCount / total) * 100);

    // Determine dominant category for insight
    let insight = '';
    if (shortCount >= mediumCount && shortCount >= longCount) {
        insight = 'You write mostly <strong>short</strong> posts';
    } else if (mediumCount >= shortCount && mediumCount >= longCount) {
        insight = 'You write mostly <strong>medium-length</strong> posts';
    } else {
        insight = 'You write mostly <strong>long</strong> posts';
    }

    chart.innerHTML = `
        <div class="distribution-chart-title">Writing distribution</div>
        <div class="distribution-bars">
            <div class="distribution-bar-group">
                <div class="distribution-bar-label">
                    <span class="distribution-bar-label-text">Short</span>
                    <span class="distribution-bar-count">${shortCount} post${shortCount !== 1 ? 's' : ''} · ${shortPct}%</span>
                </div>
                <div class="distribution-bar-track">
                    <div class="distribution-bar-fill bar-short" style="width: ${shortPct}%"></div>
                </div>
            </div>
            <div class="distribution-bar-group">
                <div class="distribution-bar-label">
                    <span class="distribution-bar-label-text">Medium</span>
                    <span class="distribution-bar-count">${mediumCount} post${mediumCount !== 1 ? 's' : ''} · ${mediumPct}%</span>
                </div>
                <div class="distribution-bar-track">
                    <div class="distribution-bar-fill bar-medium" style="width: ${mediumPct}%"></div>
                </div>
            </div>
            <div class="distribution-bar-group">
                <div class="distribution-bar-label">
                    <span class="distribution-bar-label-text">Long</span>
                    <span class="distribution-bar-count">${longCount} post${longCount !== 1 ? 's' : ''} · ${longPct}%</span>
                </div>
                <div class="distribution-bar-track">
                    <div class="distribution-bar-fill bar-long" style="width: ${longPct}%"></div>
                </div>
            </div>
        </div>
        <div class="distribution-insight">${insight} · <span style="color: #a3a3a3">0–500 words short · 500–1500 medium · 1500+ long</span></div>
    `;
    chart.classList.add('visible');
}

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
    if (searchQuery || activeTag || showUnreadOnly) {
        const parts = [];
        if (searchQuery) parts.push(`matching "${searchQuery}"`);
        if (activeTag) parts.push(`tagged "${activeTag}"`);
        if (showUnreadOnly) parts.push('unread only');
        const infoText = `Showing ${filteredPosts.length} post(s)` + (parts.length ? ' — ' + parts.join(', ') : '');
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
        const wordCount = getWordCount(post.content);
        const readingTime = getReadingTime(wordCount);
        const isUnread = !readStatus.isRead(post.id);
        const updatedSinceRead = readStatus.isUpdatedSinceRead(post.id, post.date);
        const showIndicator = isUnread || updatedSinceRead;
        const indicatorLabel = updatedSinceRead ? 'Updated' : 'Unread';

        const createdDate = post.created || post.date;
        const relativeTime = formatRelativeTime(createdDate);
        const fullDate = formatFullDate(createdDate);

        return `
            <li class="post-item${showIndicator ? ' post-unread' : ''}" data-post-id="${post.id}">
                <div class="post-header">
                    <div>
                        <div class="post-title">${showIndicator ? '<span class="unread-dot" title="' + indicatorLabel + '"></span>' : ''}${highlightedTitle}</div>
                        <div class="post-date" title="${fullDate}">${relativeTime}</div>
                    </div>
                    <div class="post-meta" title="${wordCount} words · estimated at 200 words per minute">${wordCount} words · ${readingTime}</div>
                </div>
                <div class="post-excerpt">${highlightedExcerpt}</div>
                <div class="post-tags">
                    <span class="post-word-count">${wordCount.toLocaleString()} words</span>
                    ${tags.map(tag => `
                        <span class="tag ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</span>
                    `).join('')}
                </div>
                <div class="post-actions">
                    <a href="editor.html?id=${post.id}" class="btn btn-sm">Edit</a>
                    <button class="btn btn-sm btn-download" data-id="${post.id}" title="Download as markdown file">↓ .md</button>
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

        // Filter by unread status
        if (showUnreadOnly) {
            const isUnread = !readStatus.isRead(post.id);
            const updatedSinceRead = readStatus.isUpdatedSinceRead(post.id, post.date);
            if (!isUnread && !updatedSinceRead) return false;
        }

        return true;
    });

    // Update clear filters button
    const clearFilters = document.getElementById('clearFilters');
    if (searchQuery || activeTag || showUnreadOnly) {
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
    
    // Download buttons
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const post = storage.getPost(id);
            if (post) downloadPost(post);
        });
    });

    // Post item hover tooltips
    document.querySelectorAll('.post-item[data-post-id]').forEach(item => {
        item.addEventListener('mouseenter', () => {
            tooltip.show(item.dataset.postId, item);
        });
        item.addEventListener('mouseleave', () => {
            tooltip.hide();
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

    // Backfill: ensure every post has a created timestamp
    let needsSave = false;
    allPosts.forEach(post => {
        if (!post.created) {
            post.created = post.date || new Date().toISOString();
            needsSave = true;
        }
    });
    if (needsSave) {
        storage.savePosts(allPosts);
    }

    // Sort by date descending
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderDistributionChart();
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
        showUnreadOnly = false;
        searchInput.value = '';
        const unreadToggle = document.getElementById('unreadToggle');
        if (unreadToggle) unreadToggle.classList.remove('active');
        filterPosts();
    });

    // Unread filter toggle
    const unreadToggle = document.getElementById('unreadToggle');
    if (unreadToggle) {
        unreadToggle.addEventListener('click', () => {
            showUnreadOnly = !showUnreadOnly;
            unreadToggle.classList.toggle('active', showUnreadOnly);
            filterPosts();
        });
    }
    
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
                created: new Date('2024-01-15').toISOString(),
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
                created: new Date('2024-01-20').toISOString(),
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
                created: new Date('2024-02-01').toISOString(),
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
