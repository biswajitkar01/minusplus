// Clean Text Highlighting System - VS Code Style
// Simple, performant highlighting with native browser selection

class TextHighlighter {
    constructor() {
        this.activeHighlights = [];
        this.debounceTimeout = null;
        this.activeSelection = null; // track active input & selection range
        this.init();
    }

    init() {
        // Clean, simple initialization
    }

    // Main highlighting method - clean and simple
    highlightMatches(selectedText) {
        this.clearHighlights();

        if (!selectedText || selectedText.length < 2) {
            this.activeSelection = null;
            return;
        }

        // Capture selection source so we can style it differently
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) {
            const start = ae.selectionStart ?? 0;
            const end = ae.selectionEnd ?? 0;
            // Only record when text matches the selectedText (case-insensitive)
            const sel = (ae.value || '').substring(start, end);
            if (sel && sel.toLowerCase() === selectedText.toLowerCase()) {
                this.activeSelection = { element: ae, start, end, text: sel };
            } else {
                this.activeSelection = null;
            }
        } else {
            this.activeSelection = null;
        }

        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            console.log('Highlighting:', selectedText);
            this.performHighlighting(selectedText.trim());
        }, 50);
    }

    performHighlighting(searchText) {
        if (!searchText) return;

        const textElements = this.getTextElements();
        console.log('Found elements:', textElements.length);
        console.log('Searching for:', searchText);

        textElements.forEach(elementData => {
            console.log('Checking element text:', elementData.text, 'for:', searchText);
            if (elementData.text.toLowerCase().includes(searchText.toLowerCase())) {
                console.log('Match found! Highlighting in element:', elementData.element, 'text:', elementData.text);
                this.highlightInElement(elementData, searchText);
            } else {
                console.log('No match in this element');
            }
        });
    }
    getTextElements() {
        const elements = [];

        document.querySelectorAll('.canvas-text-input').forEach(input => {
            console.log('Found input:', input, 'value:', input.value);
            elements.push({
                element: input,
                type: 'input',
                text: input.value
            });
        });

        document.querySelectorAll('.calculation-result, .inline-calculation-result').forEach(result => {
            console.log('Found result:', result, 'text:', result.textContent);
            elements.push({
                element: result,
                type: 'result',
                text: result.textContent
            });
        });

        return elements;
    }

    highlightInElement(elementData, searchText) {
        const { element, type, text } = elementData;

        console.log('highlightInElement called for:', type, element);

        // Try to highlight in all elements - both input and result
        console.log('Attempting to highlight in:', type, 'element');
        this.highlightInText(element, searchText);
    }

    highlightInText(element, searchText) {
        const originalText = element.textContent || element.value || '';

        // For textarea/input elements, render a highlight overlay that mirrors text
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            console.log('Creating precise overlay for input element');
            this.createInputOverlay(element, searchText, originalText);
        } else {
            // For other elements, use HTML highlighting with lower-contrast matches
            const regex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi');
            const highlightedHTML = this.escapeHTML(originalText).replace(
                regex,
                '<span class="mp-highlight-match">$1</span>'
            );
            console.log('Original:', originalText, 'Highlighted:', highlightedHTML);

            // Store for cleanup
            this.activeHighlights.push({
                element: element,
                originalHTML: element.innerHTML,
                type: 'text'
            });

            element.innerHTML = highlightedHTML;
            console.log('Applied HTML to element:', element);
        }
    }

    createInputOverlay(input, searchText, originalText) {
        // Remove any previous overlay for this input (safety)
        this.activeHighlights = this.activeHighlights.filter(h => {
            if (h.type === 'input-overlay' && h.element === input && h.overlay && h.overlay.parentNode) {
                h.overlay.parentNode.removeChild(h.overlay);
                return false;
            }
            return true;
        });

        // Build highlighted content by mirroring the input's text.
        // IMPORTANT: Do not cover the currently selected portion in the active input,
        // so native ::selection shows with higher contrast.
        const html = this.buildOverlayHTML(input, originalText, searchText);

        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'mp-text-highlight-overlay';
        overlay.style.position = 'absolute';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '999';
        overlay.style.color = 'transparent'; // show only backgrounds in spans
        overlay.style.background = 'transparent';
        overlay.style.whiteSpace = 'pre-wrap';
        overlay.style.overflow = 'hidden';
        overlay.style.transition = 'none';

        // Copy typography and box model from the input exactly
        const cs = window.getComputedStyle(input);
        overlay.style.font = cs.font; // copies font-size, family, weight, etc.
        overlay.style.lineHeight = cs.lineHeight;
        overlay.style.letterSpacing = cs.letterSpacing;
        overlay.style.wordSpacing = cs.wordSpacing;
        overlay.style.textIndent = cs.textIndent;
        overlay.style.whiteSpace = cs.whiteSpace || 'pre-wrap';

        // Copy padding and borders exactly as they are
        overlay.style.padding = cs.padding;
        overlay.style.border = cs.border;
        overlay.style.borderRadius = cs.borderRadius;
        overlay.style.boxSizing = cs.boxSizing;

        // Copy text alignment to ensure proper positioning
        overlay.style.textAlign = cs.textAlign;
        overlay.style.verticalAlign = cs.verticalAlign;

        // Position overlay to match the input exactly
        const rect = input.getBoundingClientRect();
        overlay.style.left = (rect.left + window.scrollX) + 'px';
        overlay.style.top = (rect.top + window.scrollY) + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';

        // Ensure overlay border is transparent so it doesn't interfere with positioning
        overlay.style.borderColor = 'transparent';

        // Insert the content
        overlay.innerHTML = html;

        // Append to body
        document.body.appendChild(overlay);

        // Track for cleanup/reposition
        this.activeHighlights.push({ element: input, overlay, type: 'input-overlay' });

        console.log('Created precise overlay for input');
    }

    // Build overlay HTML with matches. Skip the active selection range for the active element
    // so that the native selection remains visible (higher contrast).
    buildOverlayHTML(input, text, searchText) {
        const lowerText = (text || '').toLowerCase();
        const q = (searchText || '').toLowerCase();
        if (!q) return this.escapeHTML(text || '');

        const isActive = this.activeSelection && this.activeSelection.element === input;
        const selStart = isActive ? this.activeSelection.start : -1;
        const selEnd = isActive ? this.activeSelection.end : -1;

        let i = 0;
        let html = '';
        const qLen = q.length;
        while (i < lowerText.length) {
            const idx = lowerText.indexOf(q, i);
            if (idx === -1) {
                html += this.escapeHTML(text.slice(i));
                break;
            }
            // preceding text
            if (idx > i) html += this.escapeHTML(text.slice(i, idx));

            const matchEnd = idx + qLen;
            const isSelectedRange = isActive && idx === selStart && matchEnd === selEnd;

            const segment = this.escapeHTML(text.slice(idx, matchEnd));
            if (isSelectedRange) {
                // Do not wrap selected range so native ::selection shows through
                html += segment;
            } else {
                html += `<span class="mp-highlight-match">${segment}</span>`;
            }
            i = matchEnd;
        }
        return html;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Escape HTML to safely inject text content into overlay/result HTML
    escapeHTML(str) {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    clearHighlights() {
        this.activeHighlights.forEach(highlight => {
            try {
                if (highlight.type === 'text') {
                    highlight.element.innerHTML = highlight.originalHTML;
                } else if ((highlight.type === 'input-overlay' || highlight.type === 'overlay') && highlight.overlay) {
                    if (highlight.overlay.parentNode) highlight.overlay.parentNode.removeChild(highlight.overlay);
                } else if (highlight.type === 'border') {
                    highlight.element.style.border = highlight.originalBorder || '';
                }
            } catch (error) {
                console.warn('Error clearing highlight:', error);
            }
        });
        this.activeHighlights = [];
    }

    updateHighlightPositions() {
        // Reposition any active input overlays (e.g., after scroll/zoom)
        this.activeHighlights.forEach(h => {
            if ((h.type === 'input-overlay' || h.type === 'overlay') && h.overlay && h.element) {
                const rect = h.element.getBoundingClientRect();
                h.overlay.style.left = (rect.left + window.scrollX) + 'px';
                h.overlay.style.top = (rect.top + window.scrollY) + 'px';
                h.overlay.style.width = rect.width + 'px';
                h.overlay.style.height = rect.height + 'px';
            }
        });
    }

    destroy() {
        clearTimeout(this.debounceTimeout);
        this.clearHighlights();
    }
}

export default TextHighlighter;
