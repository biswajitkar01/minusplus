// Clipboard Management System
// Auto-copy on text selection with graceful fallbacks

class ClipboardManager {
    constructor() {
        this.isClipboardAPISupported = this.checkClipboardSupport();
        this.lastCopiedText = '';
        this.copyFeedbackElement = null;

        this.init();
    }

    init() {
        console.log(`Clipboard manager initialized. API support: ${this.isClipboardAPISupported}`);
    }

    checkClipboardSupport() {
        return navigator.clipboard &&
            navigator.clipboard.writeText &&
            window.isSecureContext;
    }

    async copyToClipboard(text) {
        if (!text || text === this.lastCopiedText) {
            return false;
        }

        const cleanText = text.trim();
        if (!cleanText) {
            return false;
        }

        try {
            if (this.isClipboardAPISupported) {
                await navigator.clipboard.writeText(cleanText);
            } else {
                this.fallbackCopy(cleanText);
            }

            this.lastCopiedText = cleanText;
            this.showCopyFeedback(cleanText);

            return true;
        } catch (error) {
            console.warn('Clipboard write failed, trying fallback:', error);
            return this.fallbackCopy(cleanText);
        }
    }

    fallbackCopy(text) {
        try {
            // Create temporary textarea for copying
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            textArea.style.opacity = '0';
            textArea.setAttribute('readonly', '');

            document.body.appendChild(textArea);

            // Select and copy
            textArea.select();
            textArea.setSelectionRange(0, text.length);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                this.lastCopiedText = text;
                this.showCopyFeedback(text);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        }
    }

    showCopyFeedback(text) {
        // Remove existing feedback
        this.hideCopyFeedback();

        // Create feedback element
        this.copyFeedbackElement = document.createElement('div');
        this.copyFeedbackElement.className = 'copy-feedback';

        // Truncate long text for display
        const displayText = text.length > 20 ? text.substring(0, 20) + '...' : text;
        this.copyFeedbackElement.innerHTML = `
            <div class="copy-icon">📋</div>
            <div class="copy-text">Copied: "${displayText}"</div>
        `;

        document.body.appendChild(this.copyFeedbackElement);

        // Animate in
        requestAnimationFrame(() => {
            this.copyFeedbackElement.classList.add('show');
        });

        // Auto-hide after delay
        setTimeout(() => {
            this.hideCopyFeedback();
        }, 2000);
    }

    hideCopyFeedback() {
        if (this.copyFeedbackElement) {
            this.copyFeedbackElement.classList.add('hide');
            setTimeout(() => {
                if (this.copyFeedbackElement && this.copyFeedbackElement.parentNode) {
                    this.copyFeedbackElement.parentNode.removeChild(this.copyFeedbackElement);
                }
                this.copyFeedbackElement = null;
            }, 300);
        }
    }

    // Manual copy method for programmatic copying
    async copyResult(calculation) {
        if (!calculation || !calculation.formatted) {
            return false;
        }

        return await this.copyToClipboard(calculation.formatted);
    }

    // Copy calculation summary
    async copyCalculationSummary(calculation) {
        if (!calculation) return false;

        const { numbers, result, operation, type } = calculation;
        let summary = '';

        if (type === 'vertical') {
            summary = numbers.join('\n') + '\n= ' + calculation.formatted;
        } else if (type === 'horizontal') {
            summary = numbers.join(' + ') + ' = ' + calculation.formatted;
        } else {
            summary = calculation.formatted;
        }

        return await this.copyToClipboard(summary);
    }

    // Check if clipboard contains numeric data
    async hasNumericData() {
        if (!this.isClipboardAPISupported) {
            return false;
        }

        try {
            const text = await navigator.clipboard.readText();
            const lines = text.split('\n');

            // Check if any line contains numbers
            return lines.some(line => {
                const cleaned = line.replace(/[$,\s]/g, '');
                return !isNaN(parseFloat(cleaned));
            });
        } catch (error) {
            console.warn('Cannot read clipboard:', error);
            return false;
        }
    }

    // Paste from clipboard (for future use)
    async pasteFromClipboard() {
        if (!this.isClipboardAPISupported) {
            return null;
        }

        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            console.warn('Cannot read from clipboard:', error);
            return null;
        }
    }

    // Format copied text for different contexts
    formatForContext(text, context = 'default') {
        switch (context) {
            case 'excel':
                // Format for Excel/Sheets pasting
                return text.replace(/,/g, '');

            case 'programming':
                // Format for code
                return text.replace(/,/g, '');

            case 'accounting':
                // Keep currency formatting
                return text;

            default:
                return text;
        }
    }

    // Utility methods
    isNumber(text) {
        const cleaned = text.replace(/[$,\s]/g, '');
        return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
    }

    extractNumbers(text) {
        const lines = text.split('\n');
        return lines
            .map(line => line.trim())
            .filter(line => this.isNumber(line))
            .map(line => parseFloat(line.replace(/[$,\s]/g, '')));
    }

    // Event handling for auto-copy on selection
    setupAutoCopy() {
        let selectionTimeout;

        document.addEventListener('selectionchange', () => {
            clearTimeout(selectionTimeout);

            selectionTimeout = setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();

                // Skip auto-copy when selection is inside timezone friend label or its editor
                const anchorNode = selection.anchorNode;
                if (anchorNode) {
                    const anchorEl = anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement;
                    if (anchorEl) {
                        const inNoCopy = anchorEl.closest('.tz-friend-label') || anchorEl.closest('.tz-label-input');
                        if (inNoCopy) {
                            return; // do not copy labels while editing or selecting them
                        }
                    }
                }

                if (selectedText && selectedText.length > 0) {
                    // Only auto-copy if it looks like a calculation result or number
                    if (this.shouldAutoCopy(selectedText)) {
                        this.copyToClipboard(selectedText);
                    }
                }
            }, 100);
        });
    }

    shouldAutoCopy(text) {
        // Auto-copy if text looks like:
        // - A number
        // - A calculation result (starts with =)
        // - Multiple numbers

        if (text.startsWith('=')) {
            return true;
        }

        if (this.isNumber(text)) {
            return true;
        }

        // Check if contains multiple numbers
        const numbers = this.extractNumbers(text);
        return numbers.length > 0;
    }

    // Cleanup
    destroy() {
        this.hideCopyFeedback();
    }
}

export default ClipboardManager;
