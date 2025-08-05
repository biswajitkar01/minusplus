// Text Management System
// Handles text inputs, auto-calculation, and real-time updates

import syntaxHighlighter from '../utils/syntaxHighlighter.js';

class TextManager {
    constructor(canvas, calculator) {
        this.canvas = canvas;
        this.calculator = calculator;
        this.activeInput = null;
        this.textElements = new Map();
        this.elementIdCounter = 0;
        this.syntaxHighlighter = syntaxHighlighter;

        // Input element pool for performance
        this.inputPool = [];
        this.maxPoolSize = 50;

        this.init();
    }

    init() {
        console.log('Text manager initialized');
    }

    // Create new text input at world coordinates
    createTextInput(worldX, worldY) {
        // Clean up any existing empty inputs first
        this.cleanupEmptyInputs();

        const id = this.generateElementId();
        const input = this.getPooledInput();

        // Position in screen coordinates
        const screenPos = this.canvas.worldToScreen(worldX, worldY);

        // Create container for input and syntax highlighting
        const container = document.createElement('div');
        container.className = 'text-input-container';
        container.style.position = 'absolute';
        container.style.left = screenPos.x + 'px';
        container.style.top = screenPos.y + 'px';
        container.style.zIndex = '1000';

        // Create syntax highlight overlay
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'syntax-highlight-overlay';
        highlightOverlay.id = `highlight-${id}`;

        // Setup input element
        input.id = `calc-input-${id}`;
        input.className = 'canvas-text-input';
        input.style.position = 'relative';
        input.style.left = '0';
        input.style.top = '0';
        input.style.width = '120px';
        input.style.minHeight = '40px';
        input.value = '';
        input.placeholder = 'Enter numbers...';

        // Add elements to container
        container.appendChild(highlightOverlay);
        container.appendChild(input);

        // Setup event listeners
        this.setupInputListeners(input, id, worldX, worldY);

        // Add to DOM and focus
        document.body.appendChild(container);
        input.focus();

        // Store element data
        const element = {
            id: id,
            input: input,
            container: container,
            highlightOverlay: highlightOverlay,
            worldX: worldX,
            worldY: worldY,
            calculation: null,
            resultElement: null
        };

        this.textElements.set(id, element);
        this.activeInput = input;

        // Update position on canvas transform
        this.updateElementPosition(element);

        // Notify main app that an element was created
        if (window.canvasApp && window.canvasApp.hideHelpIndicator) {
            window.canvasApp.hideHelpIndicator();
        }

        return element;
    }

    setupInputListeners(input, id, worldX, worldY) {
        // Input change handler with debouncing for calculations
        let inputTimeout;
        input.addEventListener('input', (e) => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                this.handleInputChange(id);
            }, 250);

            this.autoResize(input);

            // Only trigger highlighting for longer text or when operators are present
            const text = input.value || '';
            if (text.length > 3 || /[+\-*/$%()]/.test(text)) {
                this.updateSyntaxHighlighting(id);
            }
        });

        // Paste handler
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.handleInputChange(id);
                this.autoResize(input);
                this.updateSyntaxHighlighting(id);
            }, 10);
        });

        // Focus handlers
        input.addEventListener('focus', () => {
            this.activeInput = input;
            input.style.borderColor = 'var(--accent-blue)';
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.2)';

            // Remove empty inputs immediately when they lose focus
            setTimeout(() => {
                if (!input.value.trim()) {
                    this.removeElement(id);
                }
            }, 50);
        });

        // Keyboard shortcuts
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.removeElement(id);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                // Ctrl+Enter (or Cmd+Enter on Mac) creates a new input box
                e.preventDefault();
                this.createAdjacentInput(worldX, worldY + 60);
            }
        });

        // Scroll synchronization for highlight overlay
        input.addEventListener('scroll', () => {
            const element = this.textElements.get(id);
            if (element && element.highlightOverlay) {
                element.highlightOverlay.scrollTop = input.scrollTop;
                element.highlightOverlay.scrollLeft = input.scrollLeft;
            }
        });
    }

    handleInputChange(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        const text = element.input.value || '';
        const calculation = this.calculator.calculate(text);

        element.calculation = calculation;

        if (calculation && calculation.numbers.length > 1) {
            this.displayResult(element, calculation);
        } else {
            this.hideResult(element);
        }

        // Mark app as dirty for auto-save
        if (window.canvasApp) {
            window.canvasApp.markDirty();
        }
    }

    displayResult(element, calculation) {
        if (!element.resultElement) {
            element.resultElement = document.createElement('div');
            element.resultElement.className = 'calculation-result';
            element.resultElement.style.position = 'absolute';
            element.resultElement.style.zIndex = '1001';
            document.body.appendChild(element.resultElement);
        }

        // Update result content
        element.resultElement.textContent = `= ${calculation.formatted}`;
        element.resultElement.style.display = 'block';

        // Position result below input using canvas coordinate system
        const screenPos = this.canvas.worldToScreen(element.worldX, element.worldY);
        // Use the actual rendered height of the input, not its scroll height
        const inputHeight = element.input.offsetHeight || parseInt(element.input.style.height) || 40;
        element.resultElement.style.left = screenPos.x + 'px';
        element.resultElement.style.top = (screenPos.y + inputHeight + 5) + 'px';

        // Add summary tooltip for complex calculations
        if (calculation.numbers.length > 2) {
            const summary = this.calculator.getCalculationSummary(calculation);
            element.resultElement.title = summary;
        }
    }

    hideResult(element) {
        if (element.resultElement) {
            element.resultElement.style.display = 'none';
        }
    }

    autoResize(textarea) {
        const text = textarea.value;
        const hasManualLineBreaks = text.includes('\n');
        const maxChars = 500;

        // Reset dimensions to measure content
        textarea.style.height = 'auto';
        textarea.style.width = 'auto';

        if (!hasManualLineBreaks) {
            // Single line content - expand horizontally until max chars
            if (text.length <= maxChars) {
                // Calculate width needed for the text
                const testElement = this.createMeasureElement(text || 'Enter numbers...');
                const neededWidth = Math.max(120, testElement.offsetWidth + 20);
                textarea.style.width = neededWidth + 'px';
                textarea.style.height = '40px'; // Single line height
                textarea.style.overflowX = 'auto'; // Allow horizontal scrolling if needed
                textarea.style.overflowY = 'hidden'; // No vertical scrolling for single line
                textarea.style.whiteSpace = 'nowrap'; // Prevent wrapping
                testElement.remove();
            } else {
                // Content exceeds max chars - make it scrollable horizontally
                const testElement = this.createMeasureElement('A'.repeat(maxChars));
                const maxWidth = testElement.offsetWidth + 20;
                textarea.style.width = maxWidth + 'px';
                textarea.style.height = '40px';
                textarea.style.overflowX = 'scroll';
                textarea.style.overflowY = 'hidden';
                textarea.style.whiteSpace = 'nowrap'; // Prevent wrapping
                testElement.remove();
            }
        } else {
            // Multi-line content with manual breaks - expand vertically
            const maxLines = 50;
            const lineHeight = 24;
            const minHeight = 40;
            const maxHeight = maxLines * lineHeight;

            const newHeight = Math.min(maxHeight, Math.max(minHeight, textarea.scrollHeight));
            textarea.style.height = newHeight + 'px';
            textarea.style.width = '120px'; // Fixed width for vertical content
            textarea.style.whiteSpace = 'pre-wrap'; // Allow wrapping for multi-line

            // Enable vertical scrolling if content exceeds max height
            if (textarea.scrollHeight > maxHeight) {
                textarea.style.overflowY = 'scroll'; // Use scroll to ensure scrollbar shows when focused
            } else {
                textarea.style.overflowY = 'hidden';
            }
            textarea.style.overflowX = 'hidden';
        }

        // Sync highlight overlay dimensions and styles
        const element = this.findElementByInput(textarea);
        if (element) {
            this.syncHighlightOverlay(element);
        }
    }

    // Helper method to find element by input
    findElementByInput(input) {
        for (const [id, element] of this.textElements) {
            if (element.input === input) {
                return element;
            }
        }
        return null;
    }

    createMeasureElement(text) {
        const measure = document.createElement('span');
        measure.style.position = 'absolute';
        measure.style.visibility = 'hidden';
        measure.style.whiteSpace = 'nowrap';
        measure.style.font = window.getComputedStyle(document.querySelector('.canvas-text-input') || document.body).font;
        measure.textContent = text;
        document.body.appendChild(measure);
        return measure;
    }

    createAdjacentInput(worldX, worldY) {
        return this.createTextInput(worldX, worldY);
    }

    updateElementPositions() {
        this.textElements.forEach(element => {
            this.updateElementPosition(element);
        });
    }

    updateElementPosition(element) {
        const screenPos = this.canvas.worldToScreen(element.worldX, element.worldY);

        // Update container position (contains both input and highlight overlay)
        if (element.container) {
            element.container.style.left = screenPos.x + 'px';
            element.container.style.top = screenPos.y + 'px';
        } else {
            // Fallback for legacy elements without container
            element.input.style.left = screenPos.x + 'px';
            element.input.style.top = screenPos.y + 'px';
        }

        // Update result position if visible - use actual rendered height, not scroll height
        if (element.resultElement && element.resultElement.style.display !== 'none') {
            const inputHeight = element.input.offsetHeight || parseInt(element.input.style.height) || 40;
            element.resultElement.style.left = screenPos.x + 'px';
            element.resultElement.style.top = (screenPos.y + inputHeight + 5) + 'px';
        }
    }

    // Update syntax highlighting for a specific element
    updateSyntaxHighlighting(id) {
        const element = this.textElements.get(id);
        if (!element || !element.highlightOverlay) return;

        const text = element.input.value || '';

        // Skip highlighting for very short text to improve performance
        if (text.length < 2) {
            element.highlightOverlay.innerHTML = '';
            element.input.classList.remove('highlighting');
            return;
        }

        // Use debounced highlighting to prevent performance issues
        this.syntaxHighlighter.highlightTextDebounced(text, (highlightedHtml) => {
            if (element.highlightOverlay) {
                element.highlightOverlay.innerHTML = highlightedHtml;
                this.syncHighlightOverlay(element);

                // Only toggle highlighting if there's a meaningful change
                const hasHighlighting = highlightedHtml.includes('<span class="token-');
                if (hasHighlighting && !element.input.classList.contains('highlighting')) {
                    element.input.classList.add('highlighting');
                } else if (!hasHighlighting && element.input.classList.contains('highlighting')) {
                    element.input.classList.remove('highlighting');
                }
            }
        });
    }    // Sync highlight overlay dimensions and scroll with textarea
    syncHighlightOverlay(element) {
        if (!element.highlightOverlay || !element.input) return;

        const input = element.input;
        const overlay = element.highlightOverlay;

        // Copy all relevant styles from input to overlay
        overlay.style.width = input.style.width;
        overlay.style.height = input.style.height;
        overlay.style.padding = getComputedStyle(input).padding;
        overlay.style.fontSize = getComputedStyle(input).fontSize;
        overlay.style.lineHeight = getComputedStyle(input).lineHeight;
        overlay.style.fontFamily = getComputedStyle(input).fontFamily;

        // Sync scroll position
        overlay.scrollTop = input.scrollTop;
        overlay.scrollLeft = input.scrollLeft;
    }

    // Canvas transform callback
    onCanvasTransform() {
        this.updateElementPositions();
    }

    removeElement(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        // Remove container from DOM (includes input and highlight overlay)
        if (element.container && element.container.parentNode) {
            element.container.parentNode.removeChild(element.container);
        } else if (element.input.parentNode) {
            // Fallback for legacy elements without container
            element.input.parentNode.removeChild(element.input);
        }

        if (element.resultElement && element.resultElement.parentNode) {
            element.resultElement.parentNode.removeChild(element.resultElement);
        }

        // Return input to pool
        this.returnToPool(element.input);

        // Clear active input if this was it
        if (this.activeInput === element.input) {
            this.activeInput = null;
        }

        // Remove from elements map
        this.textElements.delete(id);
    }

    clearActiveInput() {
        if (this.activeInput) {
            this.activeInput.blur();
        }
    }

    // Clear all calculations from the canvas
    clearAllCalculations() {
        console.log('Clearing all calculations...');

        // Get all element IDs to avoid modifying map during iteration
        const elementIds = Array.from(this.textElements.keys());

        // Remove each element
        elementIds.forEach(id => {
            this.removeElement(id);
        });

        // Clear active input
        this.activeInput = null;

        // Clear canvas elements
        this.canvas.elements.clear();

        // Force canvas re-render
        this.canvas.isDirty = true;

        console.log(`Cleared ${elementIds.length} calculations`);

        return elementIds.length;
    }

    // Object pooling for performance
    getPooledInput() {
        if (this.inputPool.length > 0) {
            const input = this.inputPool.pop();
            this.resetInput(input);
            return input;
        }

        return this.createInput();
    }

    returnToPool(input) {
        if (this.inputPool.length < this.maxPoolSize) {
            this.resetInput(input);
            this.inputPool.push(input);
        }
    }

    createInput() {
        return document.createElement('textarea');
    }

    resetInput(input) {
        input.value = '';
        input.style.cssText = '';
        input.className = '';
        input.removeAttribute('id');
        input.removeAttribute('placeholder');

        // Remove all event listeners by cloning
        const newInput = input.cloneNode(false);
        if (input.parentNode) {
            input.parentNode.replaceChild(newInput, input);
        }

        return newInput;
    }

    generateElementId() {
        return ++this.elementIdCounter;
    }

    // Clean up empty inputs immediately
    cleanupEmptyInputs() {
        const elementsToRemove = [];
        this.textElements.forEach((element, id) => {
            if (!element.input.value.trim()) {
                elementsToRemove.push(id);
            }
        });

        elementsToRemove.forEach(id => {
            this.removeElement(id);
        });
    }

    // State management
    getElements() {
        const elements = [];
        this.textElements.forEach((element, id) => {
            elements.push({
                id: id,
                worldX: element.worldX,
                worldY: element.worldY,
                text: element.input.value,
                calculation: element.calculation
            });
        });
        return elements;
    }

    async restoreElements(elements) {
        if (!elements || !Array.isArray(elements)) return;

        for (const elementData of elements) {
            const element = this.createTextInput(elementData.worldX, elementData.worldY);
            element.input.value = elementData.text || '';

            // Trigger auto-resize to ensure proper sizing after restoration
            this.autoResize(element.input);

            // Restore calculation if present
            if (elementData.text) {
                await new Promise(resolve => setTimeout(resolve, 50));
                this.handleInputChange(element.id);
            }
        }
    }

    // Canvas transform updates
    onCanvasTransform() {
        this.updateElementPositions();
    }

    // Cleanup
    destroy() {
        this.textElements.forEach((element, id) => {
            this.removeElement(id);
        });
        this.textElements.clear();
        this.inputPool = [];
    }
}

export default TextManager;