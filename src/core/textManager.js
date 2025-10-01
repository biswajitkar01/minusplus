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

            // Update result position immediately to prevent jittering
            const element = this.textElements.get(id);
            if (element && element.resultElement && element.resultElement.style.display !== 'none') {
                this.updateElementPosition(element);
            }
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
    }

    handleInputChange(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        const text = element.input.value || '';
        const calculation = this.calculator.calculate(text);

        element.calculation = calculation;

        // Clear inline results first if text is empty or no calculation
        if (!text.trim() || !calculation) {
            this.clearInlineResults(element);
            this.hideResult(element);
            return;
        }

        if (calculation) {
            if (calculation.type === 'timezone') {
                this.displayTimezoneResults(element, calculation);
            } else if (calculation.type === 'mixed') {
                this.displayMixedResults(element, calculation);
            } else if (calculation.numbers && calculation.numbers.length > 1) {
                this.displayResult(element, calculation);
            } else {
                this.hideResult(element);
            }
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

    displayMixedResults(element, calculation) {
        // Clear any existing inline results
        this.clearInlineResults(element);

        // Create inline result elements for horizontal calculations
        if (calculation.horizontal && calculation.horizontal.length > 0) {
            calculation.horizontal.forEach(horizCalc => {
                this.createInlineResult(element, horizCalc.line, horizCalc.result.formatted);
            });
        }

        // Display vertical result below (if exists)
        if (calculation.vertical) {
            this.displayResult(element, calculation.vertical);
        } else {
            this.hideResult(element);
        }
    }

    createInlineResult(element, lineIndex, resultText) {
        const textarea = element.input;
        const lines = textarea.value.split('\n');

        if (lineIndex >= lines.length) return;

        // Create inline result element (similar to main result)
        const inlineResult = document.createElement('div');
        inlineResult.className = 'inline-calculation-result';
        inlineResult.textContent = `= ${resultText}`;
        inlineResult.style.position = 'absolute';
        inlineResult.style.zIndex = '1001';

        // Store the line index on the element for repositioning
        inlineResult.lineIndex = lineIndex;

        // Position it to the right of the textarea for the specific line
        this.positionInlineResult(element, inlineResult, lineIndex);

        // Store reference for cleanup
        if (!element.inlineResults) {
            element.inlineResults = [];
        }
        element.inlineResults.push(inlineResult);

        document.body.appendChild(inlineResult);
    }

    positionInlineResult(element, inlineResult, lineIndex) {
        const textarea = element.input;
        const screenPos = this.canvas.worldToScreen(element.worldX, element.worldY);

        // Calculate line position
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 24;
        const textareaWidth = parseInt(textarea.style.width) || 120;

        // Position to the right of the textarea at the specific line
        inlineResult.style.left = (screenPos.x + textareaWidth + 10) + 'px';
        inlineResult.style.top = (screenPos.y + (lineIndex * lineHeight) + 8) + 'px';
    }

    clearInlineResults(element) {
        if (element.inlineResults) {
            element.inlineResults.forEach(result => {
                if (result.parentNode) {
                    result.parentNode.removeChild(result);
                }
            });
            element.inlineResults = [];
        }
    }

    displayTimezoneResults(element, calculation) {
        // Clear any existing timezone results and timer
        this.clearTimezoneResults(element);

        const timezones = calculation.timezones;
        if (!timezones || timezones.length === 0) return;

        // Create container for all timezone results
        if (!element.timezoneResults) {
            element.timezoneResults = [];
        }

        // Store timezone configuration for live updates including hour offset
        element.timezoneConfig = timezones.map(tz => ({
            label: tz.label,
            offset: this.getOffsetFromLabel(tz.label),
            isLocal: tz.isLocal
        }));

        // Store hour offset for live updates (from "time + 2" or "time - 3")
        element.timezoneHourOffset = calculation.hourOffset || 0;

        const screenPos = this.canvas.worldToScreen(element.worldX, element.worldY);
        const inputHeight = element.input.offsetHeight || parseInt(element.input.style.height) || 40;
        let currentY = screenPos.y + inputHeight + 5;

        // Add offset indicator if hours are added/subtracted
        if (calculation.hourOffset && calculation.hourOffset !== 0) {
            const offsetHeader = document.createElement('div');
            offsetHeader.className = 'timezone-offset-header';
            offsetHeader.textContent = calculation.hourOffset > 0
                ? `+${calculation.hourOffset} hour${Math.abs(calculation.hourOffset) !== 1 ? 's' : ''} ahead`
                : `${calculation.hourOffset} hour${Math.abs(calculation.hourOffset) !== 1 ? 's' : ''} behind`;
            offsetHeader.style.position = 'absolute';
            offsetHeader.style.zIndex = '1001';
            offsetHeader.style.left = screenPos.x + 'px';
            offsetHeader.style.top = currentY + 'px';

            // Mark as header so it's not updated in live updates
            offsetHeader.dataset.isHeader = 'true';

            document.body.appendChild(offsetHeader);
            element.timezoneResults.push(offsetHeader);

            currentY += 30; // Move down for timezones
        }

        // Create a result box for each timezone
        timezones.forEach((tz, index) => {
            const resultBox = document.createElement('div');
            resultBox.className = 'calculation-result timezone-result';

            // Add night-time styling if applicable
            if (tz.isNight) {
                resultBox.classList.add('timezone-night');
            }

            // Add local indicator styling
            if (tz.isLocal) {
                resultBox.classList.add('timezone-local');
            }

            resultBox.textContent = `${tz.label}: ${tz.time}`;
            resultBox.style.position = 'absolute';
            resultBox.style.zIndex = '1001';
            resultBox.style.left = screenPos.x + 'px';
            resultBox.style.top = currentY + 'px';

            // Store timezone info on the element for updates
            resultBox.dataset.label = tz.label;
            resultBox.dataset.offset = this.getOffsetFromLabel(tz.label);
            resultBox.dataset.isLocal = tz.isLocal;

            document.body.appendChild(resultBox);
            element.timezoneResults.push(resultBox);

            // Move down for next timezone (result box height + small gap)
            currentY += 35;
        });

        // Also hide the regular result element if it exists
        if (element.resultElement) {
            element.resultElement.style.display = 'none';
        }

        // Start live update timer
        this.startTimezoneTimer(element);
    }

    getOffsetFromLabel(label) {
        // Map timezone labels to IANA timezone identifiers (handles DST automatically)
        const ianaMap = {
            'Pacific': 'America/Los_Angeles',  // PST/PDT
            'Mountain': 'America/Denver',       // MST/MDT
            'Central': 'America/Chicago',       // CST/CDT
            'Eastern': 'America/New_York',      // EST/EDT
            'UTC': 'UTC',
            'India': 'Asia/Kolkata'             // IST
        };

        // Find matching timezone in label
        for (const [key, ianaTimezone] of Object.entries(ianaMap)) {
            if (label.includes(key)) {
                // Get current offset for this timezone (accounts for DST)
                const now = new Date();
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                const tzDate = new Date(now.toLocaleString('en-US', { timeZone: ianaTimezone }));
                const offset = (tzDate - utcDate) / (1000 * 60 * 60); // Convert ms to hours
                return offset;
            }
        }
        return 0;
    } startTimezoneTimer(element) {
        // Clear any existing timer
        if (element.timezoneTimer) {
            clearInterval(element.timezoneTimer);
        }

        // Update every minute (60 seconds)
        element.timezoneTimer = setInterval(() => {
            if (!element.timezoneResults || element.timezoneResults.length === 0) {
                clearInterval(element.timezoneTimer);
                element.timezoneTimer = null;
                return;
            }

            this.updateTimezoneDisplay(element);
        }, 60000); // 60000ms = 60 seconds = 1 minute
    }

    updateTimezoneDisplay(element) {
        if (!element.timezoneResults) return;

        const now = new Date();

        // Apply hour offset if present (from "time + 2" or "time - 3")
        const hourOffset = element.timezoneHourOffset || 0;
        const adjustedTime = new Date(now.getTime() + (hourOffset * 3600000));

        element.timezoneResults.forEach((resultBox) => {
            // Skip the offset header - it doesn't need to be updated
            if (resultBox.dataset.isHeader === 'true') {
                return;
            }

            const label = resultBox.dataset.label;
            const offset = parseFloat(resultBox.dataset.offset);
            const isLocal = resultBox.dataset.isLocal === 'true';

            // Calculate current time for this timezone
            const utcTime = Date.UTC(
                adjustedTime.getUTCFullYear(),
                adjustedTime.getUTCMonth(),
                adjustedTime.getUTCDate(),
                adjustedTime.getUTCHours(),
                adjustedTime.getUTCMinutes(),
                adjustedTime.getUTCSeconds()
            );

            const zoneTime = new Date(utcTime + (offset * 3600000));
            const hours24 = zoneTime.getUTCHours();
            const minutes = zoneTime.getUTCMinutes();

            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12;

            // Format without seconds - HH:MM AM/PM
            const timeString = `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;

            // Update display
            resultBox.textContent = `${label}: ${timeString}`;

            // Update night/day styling
            const isNight = hours24 >= 18 || hours24 < 6;
            if (isNight) {
                resultBox.classList.add('timezone-night');
            } else {
                resultBox.classList.remove('timezone-night');
            }
        });
    }

    clearTimezoneResults(element) {
        // Clear the timer first
        if (element.timezoneTimer) {
            clearInterval(element.timezoneTimer);
            element.timezoneTimer = null;
        }

        if (element.timezoneResults) {
            element.timezoneResults.forEach(result => {
                if (result.parentNode) {
                    result.parentNode.removeChild(result);
                }
            });
            element.timezoneResults = [];
        }
    }

    hideResult(element) {
        if (element.resultElement) {
            element.resultElement.style.display = 'none';
        }
        // Also clear inline results when hiding
        this.clearInlineResults(element);
        // Also clear timezone results when hiding
        this.clearTimezoneResults(element);
    }

    autoResize(textarea) {
        const text = textarea.value;
        const hasManualLineBreaks = text.includes('\n');
        const maxChars = 500;

        // Reset dimensions to measure content
        textarea.style.height = 'auto';

        // Store current width if it was previously expanded
        const currentWidth = parseInt(textarea.style.width) || 120;
        const wasExpanded = currentWidth > 120;

        if (!hasManualLineBreaks) {
            // Reset width for measuring
            textarea.style.width = 'auto';

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
                textarea.style.lineHeight = '24px'; // Consistent line height
                textarea.style.paddingTop = '8px';
                textarea.style.paddingBottom = '8px';
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
                textarea.style.lineHeight = '24px'; // Consistent line height
                textarea.style.paddingTop = '8px';
                textarea.style.paddingBottom = '8px';
                testElement.remove();
            }
        } else {
            // Multi-line content with manual breaks - expand vertically
            // PRESERVE the expanded width if it was previously expanded, but also check if we need more width
            const preservedWidth = wasExpanded ? Math.max(currentWidth, 120) : 120;

            // Check if any line needs more width than current
            const lines = text.split('\n');
            let maxNeededWidth = preservedWidth;

            lines.forEach(line => {
                if (line.trim()) {
                    const testElement = this.createMeasureElement(line);
                    const lineWidth = testElement.offsetWidth + 20;
                    maxNeededWidth = Math.max(maxNeededWidth, lineWidth);
                    testElement.remove();
                }
            });

            const maxLines = 50;
            const lineHeight = 24;
            const minHeight = 40;
            const maxHeight = maxLines * lineHeight;

            // Calculate height based on actual line count instead of scrollHeight
            const lineCount = lines.length;
            const paddingTotal = 16; // 8px top + 8px bottom
            const calculatedHeight = Math.max(minHeight, (lineCount * lineHeight) + paddingTotal);
            const newHeight = Math.min(maxHeight, calculatedHeight);

            textarea.style.height = newHeight + 'px';
            textarea.style.width = maxNeededWidth + 'px'; // Use the maximum needed width
            textarea.style.whiteSpace = 'pre-wrap'; // Allow wrapping for multi-line

            // Ensure consistent line-height and vertical alignment
            textarea.style.lineHeight = lineHeight + 'px';
            textarea.style.paddingTop = '8px';
            textarea.style.paddingBottom = '8px';

            // Enable vertical scrolling if content exceeds max height
            if (calculatedHeight > maxHeight) {
                textarea.style.overflowY = 'scroll'; // Use scroll to ensure scrollbar shows when focused
            } else {
                textarea.style.overflowY = 'hidden';
            }
            textarea.style.overflowX = 'hidden';
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

        // Update result position if visible - use actual rendered height, not scroll height
        if (element.resultElement && element.resultElement.style.display !== 'none') {
            const inputHeight = element.input.offsetHeight || parseInt(element.input.style.height) || 40;
            element.resultElement.style.left = screenPos.x + 'px';
            element.resultElement.style.top = (screenPos.y + inputHeight + 5) + 'px';
        }

        // Update inline result positions
        if (element.inlineResults && element.inlineResults.length > 0) {
            this.updateInlineResultPositions(element);
        }

        // Update timezone result positions
        if (element.timezoneResults && element.timezoneResults.length > 0) {
            this.updateTimezoneResultPositions(element);
        }
    }

    updateTimezoneResultPositions(element) {
        if (!element.timezoneResults) return;

        const screenPos = this.canvas.worldToScreen(element.worldX, element.worldY);
        const inputHeight = element.input.offsetHeight || parseInt(element.input.style.height) || 40;
        let currentY = screenPos.y + inputHeight + 5;

        element.timezoneResults.forEach((resultBox) => {
            resultBox.style.left = screenPos.x + 'px';
            resultBox.style.top = currentY + 'px';

            // Use different spacing for header vs timezone results
            if (resultBox.dataset.isHeader === 'true') {
                currentY += 30; // Header spacing
            } else {
                currentY += 35; // Timezone result spacing
            }
        });
    }

    updateInlineResultPositions(element) {
        if (!element.inlineResults) return;

        element.inlineResults.forEach((inlineResult) => {
            // Use the stored line index instead of array index
            this.positionInlineResult(element, inlineResult, inlineResult.lineIndex);
        });
    }

    // Canvas transform callback
    onCanvasTransform() {
        this.updateElementPositions();
    }

    removeElement(id) {
        const element = this.textElements.get(id);
        if (!element) return;

        // Clean up inline results
        this.clearInlineResults(element);

        // Clean up timezone results
        this.clearTimezoneResults(element);

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
                calculation: element.calculation,
                // Store the current width and height for restoration
                width: parseInt(element.input.style.width) || 120,
                height: parseInt(element.input.style.height) || 40,
                // Store CSS properties to preserve scrolling behavior
                whiteSpace: element.input.style.whiteSpace || 'nowrap',
                overflowX: element.input.style.overflowX || 'auto',
                overflowY: element.input.style.overflowY || 'hidden'
            });
        });
        return elements;
    }

    async restoreElements(elements) {
        if (!elements || !Array.isArray(elements)) return;

        for (const elementData of elements) {
            const element = this.createTextInput(elementData.worldX, elementData.worldY);
            element.input.value = elementData.text || '';

            // Simply restore the saved width, height, and CSS properties
            element.input.style.width = (elementData.width || 120) + 'px';
            element.input.style.height = (elementData.height || 40) + 'px';
            element.input.style.whiteSpace = elementData.whiteSpace || 'nowrap';
            element.input.style.overflowX = elementData.overflowX || 'auto';
            element.input.style.overflowY = elementData.overflowY || 'hidden';

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