// Text wrapping utilities for keyboard shortcuts

/**
 * Wrap selected text with markers (e.g., **bold**, *italic*)
 * If text is already wrapped, unwrap it
 * @param {string} text - Full text content
 * @param {number} selectionStart - Start position of selection
 * @param {number} selectionEnd - End position of selection
 * @param {string} startMarker - Opening marker (e.g., '**')
 * @param {string} endMarker - Closing marker (e.g., '**')
 * @returns {object} - { text, selectionStart, selectionEnd }
 */
export function wrapSelection(text, selectionStart, selectionEnd, startMarker, endMarker) {
    const before = text.substring(0, selectionStart);
    const selected = text.substring(selectionStart, selectionEnd);
    const after = text.substring(selectionEnd);
    
    // Check if already wrapped
    const beforeMarker = before.slice(-startMarker.length);
    const afterMarker = after.slice(0, endMarker.length);
    
    if (beforeMarker === startMarker && afterMarker === endMarker) {
        // Unwrap - remove markers
        const newText = before.slice(0, -startMarker.length) + selected + after.slice(endMarker.length);
        return {
            text: newText,
            selectionStart: selectionStart - startMarker.length,
            selectionEnd: selectionEnd - startMarker.length
        };
    }
    
    // Wrap - add markers
    const newText = before + startMarker + selected + endMarker + after;
    return {
        text: newText,
        selectionStart: selectionStart + startMarker.length,
        selectionEnd: selectionEnd + startMarker.length
    };
}

/**
 * Insert markdown link with selected text as link text
 * @param {string} text - Full text content
 * @param {number} selectionStart - Start position of selection
 * @param {number} selectionEnd - End position of selection
 * @param {string} url - URL for the link
 * @returns {object} - { text, selectionStart, selectionEnd }
 */
export function insertLink(text, selectionStart, selectionEnd, url) {
    const before = text.substring(0, selectionStart);
    const selected = text.substring(selectionStart, selectionEnd);
    const after = text.substring(selectionEnd);
    
    const link = `[${selected}](${url})`;
    const newText = before + link + after;
    
    return {
        text: newText,
        selectionStart: selectionStart + 1,
        selectionEnd: selectionStart + 1 + selected.length
    };
}

/**
 * Setup keyboard shortcuts for the editor
 * @param {HTMLTextAreaElement} textarea - The content textarea element
 * @param {HTMLFormElement} form - The form element for save shortcut
 */
export function setupKeyboardShortcuts(textarea, form) {
    let helpPanelVisible = false;
    
    // Keyboard event handler
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        
        // Cmd/Ctrl+S - Save post
        if (modifier && e.key === 's') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return;
        }
        
        // Only handle these shortcuts when textarea is focused
        if (document.activeElement !== textarea) {
            // ? key - Toggle help panel
            if (e.key === '?' && !e.shiftKey) {
                e.preventDefault();
                toggleHelpPanel();
            }
            return;
        }
        
        // Cmd/Ctrl+B - Bold
        if (modifier && e.key === 'b') {
            e.preventDefault();
            applyFormatting(textarea, '**', '**');
            return;
        }
        
        // Cmd/Ctrl+I - Italic
        if (modifier && e.key === 'i') {
            e.preventDefault();
            applyFormatting(textarea, '*', '*');
            return;
        }
        
        // Cmd/Ctrl+K - Insert link
        if (modifier && e.key === 'k') {
            e.preventDefault();
            showLinkDialog(textarea);
            return;
        }
        
        // Escape - Close dialogs
        if (e.key === 'Escape') {
            closeLinkDialog();
            return;
        }
    });
}

/**
 * Apply text formatting to textarea selection
 */
function applyFormatting(textarea, startMarker, endMarker) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const result = wrapSelection(text, start, end, startMarker, endMarker);
    
    textarea.value = result.text;
    textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    textarea.focus();
}

/**
 * Show link insertion dialog
 */
function showLinkDialog(textarea) {
    // Store current selection
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Create dialog if it doesn't exist
    let dialog = document.getElementById('linkDialog');
    if (!dialog) {
        dialog = createLinkDialog();
        document.body.appendChild(dialog);
    }
    
    dialog.style.display = 'flex';
    const urlInput = document.getElementById('linkUrlInput');
    urlInput.value = '';
    urlInput.focus();
    
    // Handle form submission
    const form = document.getElementById('linkDialogForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (url) {
            const text = textarea.value;
            const result = insertLink(text, start, end, url);
            textarea.value = result.text;
            textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
        }
        closeLinkDialog();
        textarea.focus();
    };
}

/**
 * Close link dialog
 */
function closeLinkDialog() {
    const dialog = document.getElementById('linkDialog');
    if (dialog) {
        dialog.style.display = 'none';
    }
}

/**
 * Create link dialog element
 */
function createLinkDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'linkDialog';
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <h3>Insert Link</h3>
            <form id="linkDialogForm">
                <input type="url" id="linkUrlInput" placeholder="https://example.com" required>
                <div class="modal-actions">
                    <button type="button" class="btn" onclick="document.getElementById('linkDialog').style.display='none'">Cancel</button>
                    <button type="submit" class="btn btn-primary">Insert</button>
                </div>
            </form>
        </div>
    `;
    return dialog;
}

/**
 * Toggle help panel visibility
 */
function toggleHelpPanel() {
    let panel = document.getElementById('helpPanel');
    if (!panel) {
        panel = createHelpPanel();
        document.body.appendChild(panel);
    }
    
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Create help panel element
 */
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
