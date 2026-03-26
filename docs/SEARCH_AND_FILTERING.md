# Search and Filtering

The blog post management interface includes powerful search and filtering capabilities to help you find posts quickly as your library grows.

## Features

### Real-time Search
- Search posts by **title** or **content**
- Results update instantly as you type
- Case-insensitive matching
- Highlights matching text in search results with yellow background

### Tag-based Filtering
- Extract tags from post frontmatter
- Display tags as clickable pills below each post
- Click any tag to filter posts by that tag
- Active tags are highlighted with black background

### Combined Filters
- Use search and tag filters together
- Filter info banner shows current active filters
- "Clear Filters" button appears when filters are active

### Tag Format

Add tags to your posts using YAML frontmatter:

```markdown
---
title: My Post Title
tags: [javascript, web-development, tutorial]
---

# Your content here
```

## Usage

1. **Search**: Type in the search bar to filter posts by title or content
2. **Filter by tag**: Click any tag pill to show only posts with that tag
3. **Combine filters**: Search while a tag filter is active to narrow results
4. **Clear filters**: Click "Clear Filters" to reset and show all posts

## UI Elements

- **Search bar**: Top of the page, filters in real-time
- **Tag pills**: Below each post, click to filter
- **Active tag**: Highlighted in black when filtering
- **Highlighted text**: Search matches shown with yellow background
- **Filter info**: Shows current filter state and result count
- **Clear button**: Appears when filters are active

## Technical Details

### Storage
Posts are stored in browser localStorage as JSON:
```javascript
{
  id: "unique-id",
  title: "Post Title",
  slug: "post-title",
  content: "Full markdown content...",
  date: "2024-01-01T00:00:00.000Z"
}
```

### Tag Extraction
Tags are extracted from the frontmatter using regex pattern matching:
- Looks for `tags: [...]` in YAML frontmatter
- Supports comma-separated values
- Removes quotes and trims whitespace

### Search Algorithm
- Converts both search query and post content to lowercase
- Checks if query exists in title OR content
- Returns true for any match

### Filtering Logic
1. Apply search filter first (if query exists)
2. Apply tag filter second (if tag selected)
3. Post must pass both filters to be displayed
4. Empty query or null tag skips that filter

## Performance

- All operations run client-side (instant)
- No network requests for search/filtering
- Efficient string matching with native JavaScript
- LocalStorage provides persistence across sessions

## Future Enhancements

Potential improvements for production:
- Fuzzy search (handle typos)
- Multiple tag selection
- Date range filters
- Sort options (date, title, popularity)
- Export/import post data
- Full-text search indexing for larger collections
