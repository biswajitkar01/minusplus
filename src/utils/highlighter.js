// Text Highlighting and Matching System
// Real-time text matching with visual highlighting

class TextHighlighter {
    constructor() {
        this.activeHighlights = [];
        this.originalSelection = null;
        this.searchCache = new Map();
        this.debounceTimeout = null;

        this.init();
    }

    init() {
        console.log('Text highlighter initialized');
    }

    // Main method to highlight all matching text instances
    highlightMatches(selectedText) {
        // Clear existing highlights
        this.clearHighlights();

        if (!selectedText || selectedText.length < 2) {
            return;
        }

        // Debounce for performance
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.performHighlighting(selectedText);
        }, 50);
    }

    performHighlighting(searchText) {
        const trimmedText = searchText.trim();

        if (!trimmedText) {
            return;
        }

        // Find all text elements that could contain matches
        const textElements = this.getTextElements();

        textElements.forEach(element => {
            this.highlightInElement(element, trimmedText);
        });
    }

    getTextElements() {
        const elements = [];

        // Get all text inputs
        const inputs = document.querySelectorAll('.canvas-text-input');
        inputs.forEach(input => elements.push({
            element: input,
            type: 'input',
            text: input.value
        }));

        // Get all calculation results
        const results = document.querySelectorAll('.calculation-result');
        results.forEach(result => elements.push({
            element: result,
            type: 'result',
            text: result.textContent
        }));

        return elements;
    }

    highlightInElement(elementData, searchText) {
        const { element, type, text } = elementData;

        if (!text || !text.includes(searchText)) {
            return;
        }

        if (type === 'input') {
            this.highlightInInput(element, searchText);
        } else if (type === 'result') {
            this.highlightInText(element, searchText);
        }
    }

    highlightInInput(input, searchText) {
        const text = input.value;
        const indices = this.findAllIndices(text, searchText);

        if (indices.length === 0) {
            return;
        }

        // Create highlight overlay for input
        const overlay = this.createInputOverlay(input, searchText, indices);
        if (overlay) {
            this.activeHighlights.push({
                element: input,
                overlay: overlay,
                type: 'input'
            });
        }
    }

    highlightInText(element, searchText) {
        const originalText = element.textContent;
        const indices = this.findAllIndices(originalText, searchText);

        if (indices.length === 0) {
            return;
        }

        // Create highlighted HTML
        const highlightedHTML = this.createHighlightedHTML(originalText, searchText, indices);

        // Store original content
        const highlight = {
            element: element,
            originalHTML: element.innerHTML,
            originalText: originalText,
            type: 'text'
        };

        // Apply highlighted HTML
        element.innerHTML = highlightedHTML;

        this.activeHighlights.push(highlight);
    }

    createInputOverlay(input, searchText, indices) {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'text-highlight-overlay';
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '999';

            // Match input styling
            const inputStyle = window.getComputedStyle(input);
            overlay.style.font = inputStyle.font;
            overlay.style.padding = inputStyle.padding;
            overlay.style.border = 'transparent';
            overlay.style.backgroundColor = 'transparent';
            overlay.style.color = 'transparent';

            // Position overlay
            const rect = input.getBoundingClientRect();
            overlay.style.left = rect.left + 'px';
            overlay.style.top = rect.top + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';

            // Create highlighted content
            const text = input.value;
            let highlightedText = '';
            let lastIndex = 0;

            indices.forEach(index => {
                highlightedText += text.substring(lastIndex, index);
                highlightedText += `<span class="highlight-match">${searchText}</span>`;
                lastIndex = index + searchText.length;
            });
            highlightedText += text.substring(lastIndex);

            overlay.innerHTML = highlightedText;
            document.body.appendChild(overlay);

            return overlay;
        } catch (error) {
            console.warn('Failed to create input overlay:', error);
            return null;
        }
    }

    createHighlightedHTML(text, searchText, indices) {
        let result = '';
        let lastIndex = 0;

        indices.forEach(index => {
            // Add text before match
            result += this.escapeHTML(text.substring(lastIndex, index));
            // Add highlighted match
            result += `<span class="highlight-match">${this.escapeHTML(searchText)}</span>`;
            lastIndex = index + searchText.length;
        });

        // Add remaining text
        result += this.escapeHTML(text.substring(lastIndex));

        return result;
    }

    findAllIndices(text, searchText) {
        const indices = [];
        const searchLower = searchText.toLowerCase();
        const textLower = text.toLowerCase();

        let index = textLower.indexOf(searchLower);
        while (index !== -1) {
            indices.push(index);
            index = textLower.indexOf(searchLower, index + 1);
        }

        return indices;
    }

    clearHighlights() {
        this.activeHighlights.forEach(highlight => {
            try {
                if (highlight.type === 'input' && highlight.overlay) {
                    // Remove input overlay
                    if (highlight.overlay.parentNode) {
                        highlight.overlay.parentNode.removeChild(highlight.overlay);
                    }
                } else if (highlight.type === 'text') {
                    // Restore original content
                    highlight.element.innerHTML = highlight.originalHTML;
                }
            } catch (error) {
                console.warn('Error clearing highlight:', error);
            }
        });

        this.activeHighlights = [];
    }

    // Numeric highlighting - highlight all instances of a number value
    highlightNumericValue(value) {
        const textElements = this.getTextElements();

        textElements.forEach(elementData => {
            const numbers = this.extractNumbers(elementData.text);
            if (numbers.includes(value)) {
                this.highlightInElement(elementData, value.toString());
            }
        });
    }

    extractNumbers(text) {
        const matches = text.match(/[-+]?\d*\.?\d+/g);
        return matches ? matches.map(match => parseFloat(match)) : [];
    }

    // Context-aware highlighting
    highlightCalculationContext(calculation) {
        if (!calculation) return;

        const { numbers, result } = calculation;

        // Highlight all numbers involved in calculation
        numbers.forEach(num => {
            this.highlightNumericValue(num);
        });

        // Highlight result with different style
        this.highlightNumericValue(result, 'result');
    }

    // Performance optimization: viewport-based highlighting
    highlightInViewport() {
        const viewportElements = this.getVisibleTextElements();
        // Only highlight elements currently visible
        // This could be implemented for very large canvases
    }

    getVisibleTextElements() {
        // Get elements within current viewport
        // Implementation would depend on canvas system
        return this.getTextElements();
    }

    // Utility methods
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Smart highlighting based on content type
    getHighlightType(text) {
        // Determine if text is a number, calculation, or regular text
        if (/^[-+]?\d*\.?\d+$/.test(text.trim())) {
            return 'number';
        }

        if (text.includes('=')) {
            return 'result';
        }

        if (/\d+.*\d+/.test(text)) {
            return 'calculation';
        }

        return 'text';
    }

    // Update highlights when canvas transforms
    updateHighlightPositions() {
        this.activeHighlights.forEach(highlight => {
            if (highlight.type === 'input' && highlight.overlay) {
                const rect = highlight.element.getBoundingClientRect();
                highlight.overlay.style.left = rect.left + 'px';
                highlight.overlay.style.top = rect.top + 'px';
            }
        });
    }

    // Cleanup
    destroy() {
        clearTimeout(this.debounceTimeout);
        this.clearHighlights();
    }
}

export default TextHighlighter;
