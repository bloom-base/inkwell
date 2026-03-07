# inkwell

Minimalist markdown blog engine. Write, publish, beautiful output.

No config. No themes to pick. Just words on a page, looking exactly right.

## Features

- **Blog Post Management** - Create, edit, and delete posts with a clean interface
- **Keyboard Shortcuts** - Speed up writing with Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+K (link), and more
- **Real-time Search** - Filter posts by title or content as you type
- **Tag-based Filtering** - Organize posts with tags and filter by clicking tag pills
- **Markdown Support** - Write in markdown with frontmatter for metadata
- **Client-side Storage** - Posts stored in browser localStorage (no backend needed)
- **Minimal Design** - Clean typography and zero configuration

## Quick Start

1. Visit the site and click "Manage Posts"
2. Create your first post with "New Post"
3. Write in markdown with optional frontmatter:
   ```markdown
   ---
   title: My First Post
   tags: [tutorial, getting-started]
   ---
   
   # Hello World
   
   Your content here...
   ```
4. Save and see your post in the list

## Keyboard Shortcuts

Write faster with keyboard shortcuts in the editor:

- `Cmd/Ctrl+S` - Save post
- `Cmd/Ctrl+B` - Bold
- `Cmd/Ctrl+I` - Italic
- `Cmd/Ctrl+K` - Insert link
- `?` - Toggle help panel

See [docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) for full details.

## Search & Filtering

- **Search**: Type in the search bar to filter by title or content
- **Tags**: Click any tag to filter posts by that tag
- **Combined**: Use search and tags together for precise filtering
- **Clear**: Click "Clear Filters" to reset

See [docs/SEARCH_AND_FILTERING.md](docs/SEARCH_AND_FILTERING.md) for detailed documentation.

## Development

Run tests:
```bash
node test.js
```

Open in browser:
```bash
python3 -m http.server 8080
# Visit http://localhost:8080
```
