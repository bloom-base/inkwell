# Keyboard Shortcuts

inkwell provides keyboard shortcuts to speed up your writing workflow. All shortcuts work in the editor when writing or editing posts.

## Available Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl+S` | Save Post | Save or create the current post |
| `Cmd/Ctrl+B` | Bold | Wrap selected text in `**bold**` markers |
| `Cmd/Ctrl+I` | Italic | Wrap selected text in `*italic*` markers |
| `Cmd/Ctrl+K` | Insert Link | Open link dialog to insert a markdown link |
| `Esc` | Close Dialog | Close any open dialog (link insertion) |
| `?` | Toggle Help | Show/hide the keyboard shortcuts help panel |

## Using Text Formatting Shortcuts

### Bold and Italic

1. Select the text you want to format
2. Press `Cmd/Ctrl+B` for bold or `Cmd/Ctrl+I` for italic
3. The text will be wrapped with markdown markers (`**` for bold, `*` for italic)

**Toggle behavior:** If text is already wrapped with formatting markers, pressing the shortcut again will unwrap it.

**Examples:**
- Select "hello" → `Cmd/Ctrl+B` → `**hello**`
- Select "**hello**" (including markers) → `Cmd/Ctrl+B` → `hello`

### Insert Link

1. Select the text you want to turn into a link (or position cursor where you want the link)
2. Press `Cmd/Ctrl+K`
3. Enter the URL in the dialog
4. Press Enter or click Insert

**Result:** `[selected text](url)`

## Toolbar Buttons

All formatting actions are also available via toolbar buttons above the content editor:

- **B** - Bold (shows tooltip with shortcut)
- **I** - Italic (shows tooltip with shortcut)
- 🔗 - Insert Link (shows tooltip with shortcut)
- **?** - Toggle keyboard shortcuts help panel

Hover over any button to see the keyboard shortcut in a tooltip.

## Help Panel

Press `?` anywhere in the editor to toggle a help panel that displays all available keyboard shortcuts. The panel shows:
- Platform-specific modifier keys (⌘ on Mac, Ctrl on Windows/Linux)
- All available shortcuts with descriptions

Close the help panel by:
- Pressing `?` again
- Clicking the × button
- Clicking outside the panel

## Implementation Details

The keyboard shortcuts are implemented in `editor-shortcuts.js` and provide:

- **Cross-platform support**: Automatically detects Mac (⌘) vs Windows/Linux (Ctrl)
- **Smart text wrapping**: Handles edge cases like existing formatting, partial selections, and cursor positioning
- **Markdown-native**: All formatting uses standard markdown syntax
- **Non-invasive**: Shortcuts only active when focused on the editor textarea (except for `?` and `Cmd/Ctrl+S`)

## Accessibility

- All shortcuts have visual toolbar button alternatives
- Tooltips provide shortcut hints on hover
- Help panel accessible via keyboard (`?` key)
- Standard keyboard navigation preserved (Tab, Arrow keys, etc.)
