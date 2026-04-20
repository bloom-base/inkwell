// Test utilities
const results = [];

function assert(condition, testName) {
    const result = { name: testName, passed: condition };
    results.push(result);
    console.log(`${condition ? '✓' : '✗'} ${testName}`);
    return condition;
}

function assertEquals(actual, expected, testName) {
    const condition = JSON.stringify(actual) === JSON.stringify(expected);
    if (!condition) {
        console.error(`  Expected: ${JSON.stringify(expected)}`);
        console.error(`  Actual: ${JSON.stringify(actual)}`);
    }
    return assert(condition, testName);
}

// Import functions from manage.js
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

function generateExcerpt(content, maxLength = 150) {
    const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    const plainText = withoutFrontmatter
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
}

function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function filterPosts(posts, searchQuery, activeTag) {
    return posts.filter(post => {
        if (searchQuery) {
            const titleMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const contentMatch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
            if (!titleMatch && !contentMatch) return false;
        }
        
        if (activeTag) {
            const tags = extractTags(post.content);
            if (!tags.includes(activeTag)) return false;
        }
        
        return true;
    });
}

// Run tests
console.log('Running inkwell test suite...\n');

// Test 1: Extract tags from frontmatter
const contentWithTags = `---
title: Test Post
tags: [javascript, web-development, testing]
---

# Test Content`;
assertEquals(extractTags(contentWithTags), ['javascript', 'web-development', 'testing'], 
    'Should extract tags from frontmatter');

// Test 2: Handle content without tags
const contentWithoutTags = `---
title: Test Post
---

# Test Content`;
assertEquals(extractTags(contentWithoutTags), [], 'Should return empty array for content without tags');

// Test 3: Handle content without frontmatter
const contentNoFrontmatter = `# Just a heading

Some content here.`;
assertEquals(extractTags(contentNoFrontmatter), [], 'Should return empty array for content without frontmatter');

// Test 4: Generate excerpt
const longContent = `---
title: Test
---

# Heading

This is a very long piece of content that should be truncated to fit within the maximum length constraint. It contains multiple sentences and should demonstrate the excerpt generation functionality properly.`;
const excerpt = generateExcerpt(longContent, 50);
assert(excerpt.length <= 53, 'Excerpt should be truncated to max length');
assert(!excerpt.includes('#'), 'Excerpt should remove markdown headers');
assert(!excerpt.includes('---'), 'Excerpt should remove frontmatter');

// Test 5: Highlight text
assertEquals(highlightText('Hello world', 'world'), 'Hello <span class="highlight">world</span>', 
    'Should highlight matching text');

// Test 6: Highlight text case-insensitive
assertEquals(highlightText('Hello World', 'world'), 'Hello <span class="highlight">World</span>', 
    'Should highlight matching text case-insensitively');

// Test 7: Search by title
const testPosts = [
    { id: '1', title: 'JavaScript Tutorial', content: 'Learn JS', date: '2024-01-01' },
    { id: '2', title: 'Python Guide', content: 'Learn Python', date: '2024-01-02' }
];
const searchByTitle = filterPosts(testPosts, 'JavaScript', null);
assertEquals(searchByTitle.length, 1, 'Should filter posts by title');
assertEquals(searchByTitle[0].id, '1', 'Should return correct post when filtering by title');

// Test 8: Search by content
const searchByContent = filterPosts(testPosts, 'Python', null);
assertEquals(searchByContent.length, 1, 'Should filter posts by content');
assertEquals(searchByContent[0].id, '2', 'Should return correct post when filtering by content');

// Test 9: Filter by tag
const postsWithTags = [
    { 
        id: '1', 
        title: 'Post 1', 
        content: `---
tags: [javascript, web]
---
Content 1`,
        date: '2024-01-01' 
    },
    { 
        id: '2', 
        title: 'Post 2', 
        content: `---
tags: [python, backend]
---
Content 2`,
        date: '2024-01-02' 
    }
];
const filteredByTag = filterPosts(postsWithTags, null, 'javascript');
assertEquals(filteredByTag.length, 1, 'Should filter posts by tag');
assertEquals(filteredByTag[0].id, '1', 'Should return correct post when filtering by tag');

// Test 10: Combine search and tag filter
const postsForCombined = [
    { 
        id: '1', 
        title: 'JavaScript Tutorial', 
        content: `---
tags: [javascript, tutorial]
---
Learn JavaScript`,
        date: '2024-01-01' 
    },
    { 
        id: '2', 
        title: 'JavaScript Guide', 
        content: `---
tags: [javascript, guide]
---
JavaScript guide`,
        date: '2024-01-02' 
    },
    { 
        id: '3', 
        title: 'Python Tutorial', 
        content: `---
tags: [python, tutorial]
---
Learn Python`,
        date: '2024-01-03' 
    }
];
const combined = filterPosts(postsForCombined, 'Tutorial', 'javascript');
assertEquals(combined.length, 1, 'Should combine search and tag filter');
assertEquals(combined[0].id, '1', 'Should return correct post with combined filters');

// Test 11: Return all posts when no filters
const noFilters = filterPosts(testPosts, '', null);
assertEquals(noFilters.length, 2, 'Should return all posts when no filters applied');

// Test 12: Case-insensitive search
const caseInsensitive = filterPosts(testPosts, 'javascript', null);
assertEquals(caseInsensitive.length, 1, 'Should perform case-insensitive search');

// ── renderPreview helpers ──────────────────────────────────────────────────────

// Mirror the stripFrontmatter function from editor.js
function stripFrontmatter(content) {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

// Detect language tag from an opening code fence (mirrors hljs language lookup)
function detectCodeFenceLanguage(fence) {
    const match = fence.match(/^```(\w+)/);
    return match ? match[1] : null;
}

// Test 13: stripFrontmatter removes YAML frontmatter
const contentWithFrontmatter = `---
title: My Post
tags: [js]
---

# Hello

World`;
assertEquals(stripFrontmatter(contentWithFrontmatter).trim(), '# Hello\n\nWorld',
    'stripFrontmatter should remove YAML frontmatter block');

// Test 14: stripFrontmatter is a no-op when there is no frontmatter
const contentNoFm = '# Heading\n\nParagraph.';
assertEquals(stripFrontmatter(contentNoFm), contentNoFm,
    'stripFrontmatter should leave content without frontmatter unchanged');

// Test 15: stripFrontmatter preserves fenced code blocks
const contentWithCode = `# Title

\`\`\`javascript
const x = 1;
\`\`\``;
assert(stripFrontmatter(contentWithCode).includes('```javascript'),
    'stripFrontmatter should preserve fenced code blocks');

// Test 16: detectCodeFenceLanguage returns the language tag
assertEquals(detectCodeFenceLanguage('```javascript'), 'javascript',
    'Should detect javascript from code fence');
assertEquals(detectCodeFenceLanguage('```python'), 'python',
    'Should detect python from code fence');
assertEquals(detectCodeFenceLanguage('```'), null,
    'Should return null for code fence without language tag');

// ── getWordCount & getReadingTime ──────────────────────────────────────────────

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

function getReadingTime(wordCount) {
    if (wordCount < 200) return '< 1 min read';
    return `${Math.ceil(wordCount / 200)} min read`;
}

// Test 17: getWordCount ignores frontmatter
const postWithFm = `---
title: Test
tags: [a, b]
---

Hello world this is a test.`;
assertEquals(getWordCount(postWithFm), 6, 'getWordCount should exclude frontmatter words');

// Test 18: getWordCount strips markdown syntax
// "Heading One Bold and italic and a link content." = 9 words after stripping
const postWithMarkdown = `# Heading One

**Bold** and *italic* and [a link](https://example.com) content.`;
assertEquals(getWordCount(postWithMarkdown), 9, 'getWordCount should strip markdown syntax');

// Test 19: getWordCount returns 0 for empty content
assertEquals(getWordCount(''), 0, 'getWordCount should return 0 for empty content');

// Test 20: getWordCount returns 0 for frontmatter-only content
const fmOnly = `---
title: Empty
---
`;
assertEquals(getWordCount(fmOnly), 0, 'getWordCount should return 0 for frontmatter-only content');

// Test 21: getReadingTime returns "< 1 min read" for very short posts
assertEquals(getReadingTime(0), '< 1 min read', 'getReadingTime should return "< 1 min read" for 0 words');
assertEquals(getReadingTime(50), '< 1 min read', 'getReadingTime should return "< 1 min read" for 50 words');

// Test 22: getReadingTime rounds up to nearest minute
assertEquals(getReadingTime(200), '1 min read', 'getReadingTime should return "1 min read" for exactly 200 words');
assertEquals(getReadingTime(201), '2 min read', 'getReadingTime should ceil to 2 min for 201 words');
assertEquals(getReadingTime(400), '2 min read', 'getReadingTime should return "2 min read" for 400 words');
assertEquals(getReadingTime(1000), '5 min read', 'getReadingTime should return "5 min read" for 1000 words');

// ── Read status utilities (pure-logic tests) ──────────────────────────────────

// Simulate a minimal readStatus store for testing (mirrors manage.js / editor.js)
function createReadStatusStore() {
    let data = {};
    return {
        getAll()           { return { ...data }; },
        isRead(id)         { return data.hasOwnProperty(id); },
        getTimestamp(id)   { return data[id] || null; },
        markRead(id)       { data[id] = Date.now(); },
        markUnread(id)     { delete data[id]; },
        remove(id)         { delete data[id]; },
        toggle(id) {
            if (this.isRead(id)) { this.markUnread(id); return false; }
            else { this.markRead(id); return true; }
        },
        isUpdatedSinceRead(id, postDate) {
            const readTime = this.getTimestamp(id);
            if (!readTime) return false;
            return new Date(postDate).getTime() > readTime;
        }
    };
}

// Test 23: New post is unread by default
const rs1 = createReadStatusStore();
assert(!rs1.isRead('post-1'), 'New post should be unread by default');

// Test 24: markRead sets a post as read
rs1.markRead('post-1');
assert(rs1.isRead('post-1'), 'Post should be read after markRead');

// Test 25: markUnread clears read status
rs1.markUnread('post-1');
assert(!rs1.isRead('post-1'), 'Post should be unread after markUnread');

// Test 26: toggle switches read ↔ unread
const rs2 = createReadStatusStore();
const firstToggle = rs2.toggle('post-2');
assert(firstToggle === true, 'toggle should return true when marking as read');
assert(rs2.isRead('post-2'), 'Post should be read after first toggle');
const secondToggle = rs2.toggle('post-2');
assert(secondToggle === false, 'toggle should return false when marking as unread');
assert(!rs2.isRead('post-2'), 'Post should be unread after second toggle');

// Test 27: remove cleans up read status (used on post delete)
const rs3 = createReadStatusStore();
rs3.markRead('post-3');
rs3.remove('post-3');
assert(!rs3.isRead('post-3'), 'Post should be unread after remove');

// Test 28: isUpdatedSinceRead detects post edited after last read
const rs4 = createReadStatusStore();
// Simulate: read the post, then the post date is set to a future time
rs4.markRead('post-4');
const futureDate = new Date(Date.now() + 60000).toISOString();
assert(rs4.isUpdatedSinceRead('post-4', futureDate), 'Should detect post updated after last read');

// Test 29: isUpdatedSinceRead returns false for never-read post
assert(!rs4.isUpdatedSinceRead('post-never', futureDate), 'Should return false for never-read post');

// Test 30: isUpdatedSinceRead returns false when post not updated since read
const rs5 = createReadStatusStore();
const pastDate = new Date(Date.now() - 60000).toISOString();
rs5.markRead('post-5');
assert(!rs5.isUpdatedSinceRead('post-5', pastDate), 'Should return false when post date is before read time');

// Test 31: getTimestamp returns null for unread post
const rs6 = createReadStatusStore();
assertEquals(rs6.getTimestamp('nope'), null, 'getTimestamp should return null for unread post');

// Test 32: getTimestamp returns a number after markRead
rs6.markRead('post-6');
assert(typeof rs6.getTimestamp('post-6') === 'number', 'getTimestamp should return a number after markRead');

// Test 33: filterPosts with unread-only flag
function filterPostsWithReadStatus(posts, searchQuery, activeTag, unreadOnly, readStatusStore) {
    return posts.filter(post => {
        if (searchQuery) {
            const titleMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const contentMatch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
            if (!titleMatch && !contentMatch) return false;
        }
        if (activeTag) {
            const tags = extractTags(post.content);
            if (!tags.includes(activeTag)) return false;
        }
        if (unreadOnly) {
            const isUnread = !readStatusStore.isRead(post.id);
            const updatedSinceRead = readStatusStore.isUpdatedSinceRead(post.id, post.date);
            if (!isUnread && !updatedSinceRead) return false;
        }
        return true;
    });
}

const rsFilter = createReadStatusStore();
rsFilter.markRead('1'); // Mark first post as read
const unreadFiltered = filterPostsWithReadStatus(testPosts, '', null, true, rsFilter);
assertEquals(unreadFiltered.length, 1, 'Unread-only filter should exclude read posts');
assertEquals(unreadFiltered[0].id, '2', 'Unread-only filter should return unread post');

// ============================================================
// Editor stats tests (getEditorStats)
// ============================================================

function stripFrontmatter(content) {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

function getEditorStats(text) {
    const body = stripFrontmatter(text);
    const chars = body.length;
    const trimmed = body.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    const paragraphs = trimmed === '' ? 0 :
        trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const readingMinutes = Math.max(1, Math.ceil(words / 200));
    const readTime = words === 0 ? '0 min' : readingMinutes + ' min';
    return { chars, words, paragraphs, readTime };
}

// Empty content
const emptyStats = getEditorStats('');
assertEquals(emptyStats.chars, 0, 'Empty content: 0 chars');
assertEquals(emptyStats.words, 0, 'Empty content: 0 words');
assertEquals(emptyStats.paragraphs, 0, 'Empty content: 0 paragraphs');
assertEquals(emptyStats.readTime, '0 min', 'Empty content: 0 min reading time');

// Simple sentence
const simpleStats = getEditorStats('Hello world');
assertEquals(simpleStats.chars, 11, 'Simple text: correct char count');
assertEquals(simpleStats.words, 2, 'Simple text: correct word count');
assertEquals(simpleStats.paragraphs, 1, 'Simple text: 1 paragraph');
assertEquals(simpleStats.readTime, '1 min', 'Simple text: 1 min reading time');

// Multiple paragraphs
const multiPara = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
const multiStats = getEditorStats(multiPara);
assertEquals(multiStats.words, 6, 'Multi-paragraph: correct word count');
assertEquals(multiStats.paragraphs, 3, 'Multi-paragraph: 3 paragraphs');

// Content with frontmatter should exclude frontmatter from stats
const withFrontmatter = '---\ntitle: Test\ntags: [a, b]\n---\nHello world again';
const fmStats = getEditorStats(withFrontmatter);
assertEquals(fmStats.words, 3, 'Frontmatter stripped: only body words counted');
assertEquals(fmStats.paragraphs, 1, 'Frontmatter stripped: 1 paragraph');

// Reading time calculation (over 200 words)
const longText = Array(250).fill('word').join(' ');
const longStats = getEditorStats(longText);
assertEquals(longStats.words, 250, 'Long text: 250 words');
assertEquals(longStats.readTime, '2 min', 'Long text: 2 min reading time');

// Warning threshold check (over 5000 words)
const hugeText = Array(5001).fill('word').join(' ');
const hugeStats = getEditorStats(hugeText);
assert(hugeStats.words > 5000, 'Huge text exceeds 5000 word threshold');

// Summary
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests: ${passed} passed, ${failed} failed, ${total} total`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);
