/**
 * Optimized Syntax Highlighter for MinusPlus Calculator
 * Lightweight, high-performance highlighting with flexible keyword support
 */

// Configuration for all highlight patterns and colors
const HIGHLIGHT_CONFIG = {
    keywords: {
        currencies: {
            patterns: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'KRW'],
            color: '#28a745',
            caseSensitive: false
        },
        timeWords: {
            patterns: ['time', 'now', 'today', 'yesterday', 'tomorrow'],
            color: '#17a2b8',
            caseSensitive: false
        }
    },

    symbols: {
        operators: { color: '#007acc' },
        currency: { color: '#28a745' },
        sapMinus: { color: '#dc3545' },
        accounting: { color: '#6f42c1' },
        numbers: { color: '#ffc107' },
        percentages: { color: '#fd7e14' }
    }
};

class SyntaxHighlighter {
    constructor() {
        this.compiledPatterns = this.compilePatterns();
        this.debounceTimeouts = new Map();
    }

    /**
     * Compile all regex patterns once for maximum performance
     */
    compilePatterns() {
        const patterns = new Map();

        // Build keyword patterns dynamically
        const currencyList = HIGHLIGHT_CONFIG.keywords.currencies.patterns.join('|');
        const timeList = HIGHLIGHT_CONFIG.keywords.timeWords.patterns.join('|');

        // Order by frequency for performance optimization
        patterns.set('operators', {
            regex: /(?<![.\d])\s*[+\-*/]\s*(?![.\d])/g,
            priority: 1,
            className: 'token-operators',
            color: HIGHLIGHT_CONFIG.symbols.operators.color
        });

        patterns.set('currency', {
            regex: new RegExp(`(?:\\$|\\b(?:${currencyList})\\b)\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi'),
            priority: 2,
            className: 'token-currency',
            color: HIGHLIGHT_CONFIG.symbols.currency.color
        });

        patterns.set('timeWords', {
            regex: new RegExp(`\\b(?:${timeList})\\b`, 'gi'),
            priority: 3,
            className: 'token-timeWords',
            color: HIGHLIGHT_CONFIG.keywords.timeWords.color
        });

        patterns.set('sapMinus', {
            regex: /(?<=\d)-(?!\d)/g,
            priority: 4,
            className: 'token-sapMinus',
            color: HIGHLIGHT_CONFIG.symbols.sapMinus.color
        });

        patterns.set('accounting', {
            regex: /\([\d,]+(?:\.\d{2})?\)/g,
            priority: 5,
            className: 'token-accounting',
            color: HIGHLIGHT_CONFIG.symbols.accounting.color
        });

        patterns.set('percentages', {
            regex: /\d+(?:\.\d+)?%/g,
            priority: 6,
            className: 'token-percentages',
            color: HIGHLIGHT_CONFIG.symbols.percentages.color
        });

        patterns.set('numbers', {
            regex: /\b\d+(?:\.\d+)?\b/g,
            priority: 7,
            className: 'token-numbers',
            color: HIGHLIGHT_CONFIG.symbols.numbers.color
        });

        return patterns;
    }

    /**
     * Debounced highlighting to prevent performance issues during typing
     */
    highlightTextDebounced(text, callback, delay = 150) {
        const key = 'highlight_' + Date.now();

        // Clear existing timeout
        this.debounceTimeouts.forEach((timeout, timeoutKey) => {
            clearTimeout(timeout);
            this.debounceTimeouts.delete(timeoutKey);
        });

        // Set new timeout
        const timeout = setTimeout(() => {
            const result = this.highlightText(text);
            callback(result);
            this.debounceTimeouts.delete(key);
        }, delay);

        this.debounceTimeouts.set(key, timeout);
    }

    /**
     * Main highlighting function with performance monitoring
     */
    highlightText(text) {
        if (!text || text.length === 0) return '';

        const startTime = performance.now();
        const tokens = this.extractTokens(text);

        // Performance safeguard
        const duration = performance.now() - startTime;
        if (duration > 10) {
            console.warn(`Syntax highlighting took ${duration.toFixed(2)}ms - consider optimization`);
            return this.escapeHtml(text); // Fallback to plain text
        }

        return this.applyHighlighting(text, tokens);
    }

    /**
     * Extract all tokens in a single pass for optimal performance
     */
    extractTokens(text) {
        const tokens = [];

        // Process patterns in priority order
        for (const [type, config] of this.compiledPatterns) {
            let match;
            config.regex.lastIndex = 0; // Reset regex state

            while ((match = config.regex.exec(text)) !== null) {
                tokens.push({
                    type,
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    className: config.className,
                    color: config.color
                });

                // Prevent infinite loops on zero-length matches
                if (match.index === config.regex.lastIndex) {
                    config.regex.lastIndex++;
                }
            }
        }

        // Sort by position and filter overlaps
        return this.resolveOverlaps(tokens.sort((a, b) => a.start - b.start));
    }

    /**
     * Resolve overlapping tokens by priority
     */
    resolveOverlaps(tokens) {
        const resolved = [];
        let lastEnd = 0;

        for (const token of tokens) {
            // Skip overlapping tokens
            if (token.start >= lastEnd) {
                resolved.push(token);
                lastEnd = token.end;
            }
        }

        return resolved;
    }

    /**
     * Apply highlighting using efficient string building
     */
    applyHighlighting(text, tokens) {
        if (tokens.length === 0) {
            return this.escapeHtml(text);
        }

        const parts = [];
        let lastIndex = 0;

        for (const token of tokens) {
            // Add text before token
            if (token.start > lastIndex) {
                parts.push(this.escapeHtml(text.slice(lastIndex, token.start)));
            }

            // Add highlighted token
            parts.push(`<span class="${token.className}">${this.escapeHtml(token.text)}</span>`);
            lastIndex = token.end;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(this.escapeHtml(text.slice(lastIndex)));
        }

        return parts.join('');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add new keyword category dynamically
     */
    addKeywordCategory(name, patterns, color, options = {}) {
        HIGHLIGHT_CONFIG.keywords[name] = {
            patterns: Array.isArray(patterns) ? patterns : [patterns],
            color,
            caseSensitive: options.caseSensitive || false
        };

        // Recompile patterns
        this.compiledPatterns = this.compilePatterns();
    }

    /**
     * Get performance stats
     */
    getStats() {
        return {
            patternCount: this.compiledPatterns.size,
            activeTimeouts: this.debounceTimeouts.size
        };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
        this.debounceTimeouts.clear();
    }
}

// Export singleton instance
export default new SyntaxHighlighter();
