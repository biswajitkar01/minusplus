// Text Management System
// Handles text inputs, auto-calculation, and real-time updates

class TextManager {
    constructor(canvas, calculator) {
        this.canvas = canvas;
        this.calculator = calculator;
        this.activeInput = null;
        this.textElements = new Map();
        this.elementIdCounter = 0;

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

        input.id = `calc-input-${id}`;
        input.className = 'canvas-text-input';
        input.style.position = 'absolute';
        input.style.left = screenPos.x + 'px';
        input.style.top = screenPos.y + 'px';
        input.style.zIndex = '1000';
        input.value = '';
        input.placeholder = 'Enter numbers...';

        // Set initial size
        input.style.width = '120px';
        input.style.minHeight = '40px';

        // Setup event listeners
        this.setupInputListeners(input, id, worldX, worldY);

        // Add to DOM and focus
        document.body.appendChild(input);
        input.focus();

        // Store element data
        const element = {
            id: id,
            input: input,
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
        // Input change handler with debouncing
        let inputTimeout;
        input.addEventListener('input', (e) => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                this.handleInputChange(id);
            }, 150);

            this.autoResize(input);
        });

        // Paste handler
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.handleInputChange(id);
                this.autoResize(input);
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
            }, 50); // Very short delay to allow for quick focus changes
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
            // Normal Enter key allows new line within the same input (default behavior)
        });
    }

    handleInputChange(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        const text = element.input.value;
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

        // Position result below input
        const inputRect = element.input.getBoundingClientRect();
        element.resultElement.style.left = inputRect.left + 'px';
        element.resultElement.style.top = (inputRect.bottom + 5) + 'px';

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
        // Reset height to measure content
        textarea.style.height = 'auto';

        // Set height based on content
        const newHeight = Math.max(40, textarea.scrollHeight);
        textarea.style.height = newHeight + 'px';

        // Auto-width for horizontal content
        const text = textarea.value;
        if (text.includes(' ') && !text.includes('\n')) {
            const testElement = this.createMeasureElement(text);
            const width = Math.max(120, testElement.offsetWidth + 20);
            textarea.style.width = width + 'px';
            testElement.remove();
        }
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
        element.input.style.left = screenPos.x + 'px';
        element.input.style.top = screenPos.y + 'px';

        // Update result position if visible
        if (element.resultElement && element.resultElement.style.display !== 'none') {
            const inputRect = element.input.getBoundingClientRect();
            element.resultElement.style.left = inputRect.left + 'px';
            element.resultElement.style.top = (inputRect.bottom + 5) + 'px';
        }
    }

    // Canvas transform callback
    onCanvasTransform() {
        this.updateElementPositions();
    }

    removeElement(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        // Remove from DOM
        if (element.input.parentNode) {
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
