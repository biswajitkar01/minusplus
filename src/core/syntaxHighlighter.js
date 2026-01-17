// Simple Syntax Highlighter
// Highlights #hashtags and "quoted comments" only

class SyntaxHighlighter {
    constructor() {
        this.overlays = new Map();
    }

    // Attach overlay to an input
    attach(input, id) {
        if (this.overlays.has(id)) return;

        const overlay = document.createElement('div');
        overlay.className = 'syntax-overlay';
        document.body.appendChild(overlay);

        this.overlays.set(id, { overlay, input });
        this.sync(id);
    }

    // Sync overlay with input
    sync(id) {
        const data = this.overlays.get(id);
        if (!data) return;

        const { overlay, input } = data;
        const rect = input.getBoundingClientRect();
        const style = getComputedStyle(input);

        // Position and size
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        // Copy text styling
        // Copy text styling - robustly copy individual properties
        // style.font is often empty in computed styles
        overlay.style.fontFamily = style.fontFamily;
        overlay.style.fontSize = style.fontSize;
        overlay.style.fontWeight = style.fontWeight;
        overlay.style.fontStyle = style.fontStyle;
        overlay.style.letterSpacing = style.letterSpacing;
        overlay.style.textTransform = style.textTransform;

        overlay.style.padding = style.padding;
        overlay.style.lineHeight = style.lineHeight;
        overlay.style.whiteSpace = style.whiteSpace;
        overlay.style.overflowWrap = style.overflowWrap;
        overlay.style.textAlign = style.textAlign;

        // Sync scroll
        overlay.scrollTop = input.scrollTop;
        overlay.scrollLeft = input.scrollLeft;

        // Render highlighted content
        overlay.innerHTML = this.highlight(input.value);
    }

    // Highlight #hashtags and "quoted text"
    highlight(text) {
        if (!text) return '';

        // Escape HTML first
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Highlight "quoted comments" - gray (allow empty strings)
        html = html.replace(/"([^"]*)"/g, '<span class="syntax-comment">"$1"</span>');

        // Highlight accounting numbers (123) - red
        // Matches (number) with optional spaces and common separators
        html = html.replace(/(\(\s*[0-9.,]+\s*\))/g, '<span class="syntax-negative">$1</span>');

        // Highlight #hashtags - purple (word characters after #)
        html = html.replace(/#(\w*)/g, '<span class="syntax-hashtag">#$1</span>');

        // Preserve newlines
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Remove overlay
    remove(id) {
        const data = this.overlays.get(id);
        if (data && data.overlay.parentNode) {
            data.overlay.parentNode.removeChild(data.overlay);
        }
        this.overlays.delete(id);
    }

    // Cleanup all
    destroy() {
        this.overlays.forEach((_, id) => this.remove(id));
    }
}

export default SyntaxHighlighter;
