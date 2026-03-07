// Node.js test runner for keyboard shortcuts
import { wrapSelection, insertLink } from './editor-shortcuts.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        failed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

// Tests for text wrapping
test('wrapSelection wraps text with bold markers', () => {
    const result = wrapSelection('hello world', 0, 11, '**', '**');
    assertEquals(result.text, '**hello world**');
    assertEquals(result.selectionStart, 2);
    assertEquals(result.selectionEnd, 13);
});

test('wrapSelection wraps selected text only', () => {
    const result = wrapSelection('hello world', 0, 5, '**', '**');
    assertEquals(result.text, '**hello** world');
    assertEquals(result.selectionStart, 2);
    assertEquals(result.selectionEnd, 7);
});

test('wrapSelection wraps with italic markers', () => {
    const result = wrapSelection('emphasized', 0, 10, '*', '*');
    assertEquals(result.text, '*emphasized*');
    assertEquals(result.selectionStart, 1);
    assertEquals(result.selectionEnd, 11);
});

test('wrapSelection handles mid-text selection', () => {
    const result = wrapSelection('the quick brown fox', 4, 9, '**', '**');
    assertEquals(result.text, 'the **quick** brown fox');
    assertEquals(result.selectionStart, 6);
    assertEquals(result.selectionEnd, 11);
});

test('wrapSelection unwraps already wrapped text (bold)', () => {
    const result = wrapSelection('**bold**', 2, 6, '**', '**');
    assertEquals(result.text, 'bold');
    assertEquals(result.selectionStart, 0);
    assertEquals(result.selectionEnd, 4);
});

test('wrapSelection unwraps already wrapped text (italic)', () => {
    const result = wrapSelection('*italic*', 1, 7, '*', '*');
    assertEquals(result.text, 'italic');
    assertEquals(result.selectionStart, 0);
    assertEquals(result.selectionEnd, 6);
});

test('wrapSelection handles empty selection - inserts markers at cursor', () => {
    const result = wrapSelection('hello world', 5, 5, '**', '**');
    assertEquals(result.text, 'hello**** world');
    assertEquals(result.selectionStart, 7);
    assertEquals(result.selectionEnd, 7);
});

test('insertLink creates markdown link with selection', () => {
    const result = insertLink('click here', 0, 10, 'https://example.com');
    assertEquals(result.text, '[click here](https://example.com)');
    assertEquals(result.selectionStart, 1);
    assertEquals(result.selectionEnd, 11);
});

test('insertLink creates markdown link without selection', () => {
    const result = insertLink('text', 4, 4, 'https://example.com');
    assertEquals(result.text, 'text[](https://example.com)');
    assertEquals(result.selectionStart, 5);
    assertEquals(result.selectionEnd, 5);
});

test('insertLink handles selection in middle of text', () => {
    const result = insertLink('see this example here', 4, 16, 'https://example.com');
    assertEquals(result.text, 'see [this example](https://example.com) here');
    assertEquals(result.selectionStart, 5);
    assertEquals(result.selectionEnd, 17);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
