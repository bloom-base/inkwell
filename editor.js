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
});
