// MinusPlus Calculator App - Main Entry Point
// High-performance vanilla JS calculator with infinite canvas interface

import InfiniteCanvas from './core/canvas.js';
import CalculationEngine from './core/calculator.js';
import TextManager from './core/textManager.js';
import ClipboardManager from './core/clipboardManager.js';
import TextHighlighter from './utils/highlighter.js';
import StorageManager from './utils/storage.js';

class MinusPlusApp {
    constructor() {
        this.isDirty = false;
        // Check if this is first visit
        this.isFirstVisit = !localStorage.getItem('minusplus_visited');
        this.welcomeShown = false;

        this.init();
    }

    async init() {
        try {
            // Initialize core systems
            this.canvas = new InfiniteCanvas('main-canvas');
            this.calculator = new CalculationEngine();
            this.textManager = new TextManager(this.canvas, this.calculator);
            this.clipboardManager = new ClipboardManager();
            this.highlighter = new TextHighlighter();
            this.storage = new StorageManager();
            // Hide help indicator after first interaction
            this.setupHelpIndicator();
            // Setup event coordination
            this.setupEventHandlers();

            // Load previous state if available
            await this.loadPreviousState();

            console.log('MinusPlus Calculator initialized successfully');

            // Don't auto-show example on first visit, wait for first click
            // Welcome message already visible from HTML
        } catch (error) {
            console.error('Failed to initialize MinusPlus:', error);
        }
    }

    showWelcomeExample(clickEvent) {
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: Single column layout
            const examples = [
                { text: 'Hi There', position: { x: 150, y: 100 } },
                { text: 'Just hit enter to add', position: { x: 150, y: 200 } },
                { text: '200\n200', position: { x: 150, y: 350 } },
                { text: 'Or space', position: { x: 150, y: 550 } },
                { text: '200 200 200', position: { x: 150, y: 650 } },
                { text: 'You can also try below phrase\n"Time + 2"\n"10:00 AM CST"', position: { x: 150, y: 850 } },
                { text: 'Click on -+ button to know the shortcuts', position: { x: 150, y: 1050 } }
            ];

            this.createTypingSequence(examples);
        } else {
            // Desktop: 3-column layout
            const examples = [
                // Column 1 - Basic intro
                { text: 'Hi There', position: { x: 200, y: 80 } },
                { text: 'Just hit enter to add', position: { x: 200, y: 150 } },
                { text: '200\n200', position: { x: 200, y: 220 } },

                // Column 2 - Space calculations
                { text: 'Or space', position: { x: 600, y: 80 } },
                { text: '200 200 200', position: { x: 600, y: 150 } },
                { text: 'time', position: { x: 600, y: 300 } },


                // Column 3 - Advanced features
                { text: 'You can also try below phrase\n"Time + 2"\n"10:00 AM CST"', position: { x: 1000, y: 80 } },
                { text: 'Click on -+ button to know the shortcuts', position: { x: 1000, y: 300 } }
            ];

            this.createTypingSequence(examples);
        }

        this.track('welcome_example', { method: 'default_set', layout: isMobile ? 'mobile' : 'desktop' });
    }

    createTypingSequence(examples) {
        let currentDelay = 0;

        examples.forEach((example, index) => {
            // Stagger the start of each typing animation (Apple-style spacing)
            setTimeout(() => {
                this.typeText(example.text, example.position);
            }, currentDelay);

            // Calculate next delay: base delay + time for this text to type + pause
            const typingTime = example.text.length * 45; // 45ms per character
            const pauseTime = 800; // 800ms pause between examples
            currentDelay += typingTime + pauseTime;
        });
    }

    typeText(fullText, position) {
        // Create the input element first
        const element = this.textManager.createTextInput(position.x, position.y);
        element.input.value = '';
        element.input.focus();

        let currentIndex = 0;
        const typingSpeed = 45; // 45ms per character (Apple-like timing)

        const typeNextChar = () => {
            if (currentIndex < fullText.length) {
                // Add next character
                element.input.value = fullText.substring(0, currentIndex + 1);

                // Auto-resize as we type
                this.textManager.autoResize(element.input);

                // Trigger calculation for numbers
                if (this.shouldTriggerCalculation(element.input.value)) {
                    this.textManager.handleInputChange(element.id);
                }

                currentIndex++;

                // Variable timing for more natural feel
                const nextDelay = this.getVariableTypingDelay(fullText[currentIndex - 1], typingSpeed);
                setTimeout(typeNextChar, nextDelay);
            } else {
                // Typing complete - final processing
                setTimeout(() => {
                    this.textManager.handleInputChange(element.id);
                    this.textManager.autoResize(element.input);

                    // Blur with smooth transition
                    setTimeout(() => {
                        element.input.blur();
                    }, 200);
                }, 300);
            }
        };

        // Start typing with a slight initial delay
        setTimeout(typeNextChar, 150);
    }

    getVariableTypingDelay(char, baseSpeed) {
        // Add natural variation to typing speed
        const variation = Math.random() * 20 - 10; // ±10ms random variation

        // Slightly longer pauses after punctuation and spaces
        if (char === '.' || char === ',' || char === '!' || char === '?') {
            return baseSpeed + 100 + variation;
        }
        if (char === ' ') {
            return baseSpeed + 50 + variation;
        }
        if (char === '\n') {
            return baseSpeed + 150 + variation;
        }

        return baseSpeed + variation;
    }

    shouldTriggerCalculation(text) {
        // Only trigger calculation for numbers, not text labels
        return /\d/.test(text) && (text.includes('\n') || text.includes(' ') || text === 'time');
    }

    setupEventHandlers() {
        // Debounced zoom tracking
        this.trackZoomDebounced = this.debounce(() => {
            const vp = this.canvas.getViewport?.();
            if (vp) this.track('zoom', { zoom: Number(vp.zoom?.toFixed?.(3) || vp.zoom || 1) });
        }, 300);

        // Canvas click - create new calculation
        this.canvas.canvas.addEventListener('click', (e) => {
            // If first visit and welcome is still showing, hide it and show example
            if (this.isFirstVisit && !this.welcomeShown) {
                this.hideHelpIndicator();
                this.showWelcomeExample(e);
                this.welcomeShown = true;
                localStorage.setItem('minusplus_visited', 'true');
                return; // Don't create normal input, just show example
            }

            const rect = this.canvas.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.canvas.screenToWorld(screenX, screenY);

            this.textManager.createTextInput(worldPos.x, worldPos.y);
            this.hideHelpIndicator();
            this.markDirty();
            // Analytics
            const vp = this.canvas.getViewport?.();
            this.track('input_created', { method: 'click', zoom: vp?.zoom });
        });

        // Touch tap - create new calculation on mobile
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        let hasMoved = false;

        // Pinch-to-zoom variables
        let initialPinchDistance = 0;
        let lastPinchDistance = 0;
        let isPinching = false;
        let pinchCenter = { x: 0, y: 0 };

        this.canvas.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartTime = Date.now();
                const touch = e.touches[0];
                const rect = this.canvas.canvas.getBoundingClientRect();
                touchStartPos = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };
                hasMoved = false;
                isPinching = false;
            } else if (e.touches.length === 2) {
                // Start pinch-to-zoom
                isPinching = true;
                hasMoved = true; // Prevent tap from triggering

                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const rect = this.canvas.canvas.getBoundingClientRect();

                // Calculate initial distance between touches
                initialPinchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                lastPinchDistance = initialPinchDistance;

                // Calculate center point between touches
                pinchCenter = {
                    x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
                    y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
                };

                e.preventDefault();
            }
        });

        this.canvas.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && !isPinching) {
                const touch = e.touches[0];
                const rect = this.canvas.canvas.getBoundingClientRect();
                const currentPos = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };

                const distance = Math.sqrt(
                    Math.pow(currentPos.x - touchStartPos.x, 2) +
                    Math.pow(currentPos.y - touchStartPos.y, 2)
                );

                if (distance > 10) {
                    hasMoved = true;
                    // Pan the canvas
                    const deltaX = currentPos.x - touchStartPos.x;
                    const deltaY = currentPos.y - touchStartPos.y;
                    this.canvas.pan(deltaX, deltaY);
                    touchStartPos = currentPos;
                    this.textManager.onCanvasTransform();
                }
                e.preventDefault();
            } else if (e.touches.length === 2 && isPinching) {
                // Handle pinch-to-zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const rect = this.canvas.canvas.getBoundingClientRect();

                // Calculate current distance between touches
                const currentPinchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                // Calculate zoom factor based on distance change
                const zoomFactor = currentPinchDistance / lastPinchDistance;

                // Apply zoom centered on pinch point
                this.canvas.zoom(zoomFactor, pinchCenter.x, pinchCenter.y);

                // Update text element positions after zoom
                this.textManager.onCanvasTransform();

                lastPinchDistance = currentPinchDistance;
                this.trackZoomDebounced();
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1 && !isPinching) {
                const touchDuration = Date.now() - touchStartTime;

                // If it's a quick tap without movement, create text input
                if (touchDuration < 300 && !hasMoved) {
                    // If first visit and welcome is still showing, hide it and show example
                    if (this.isFirstVisit && !this.welcomeShown) {
                        this.hideHelpIndicator();
                        this.showWelcomeExample(e.changedTouches[0]);
                        this.welcomeShown = true;
                        localStorage.setItem('minusplus_visited', 'true');
                        e.preventDefault();
                        return; // Don't create normal input, just show example
                    }

                    const touch = e.changedTouches[0];
                    const rect = this.canvas.canvas.getBoundingClientRect();
                    const tapPos = {
                        x: touch.clientX - rect.left,
                        y: touch.clientY - rect.top
                    };

                    const worldPos = this.canvas.screenToWorld(tapPos.x, tapPos.y);
                    this.textManager.createTextInput(worldPos.x, worldPos.y);
                    this.hideHelpIndicator();
                    this.markDirty();
                    // Analytics
                    const vp = this.canvas.getViewport?.();
                    this.track('input_created', { method: 'tap', zoom: vp?.zoom });
                }
                e.preventDefault();
            } else if (e.touches.length < 2) {
                // End pinch-to-zoom when less than 2 touches remain
                isPinching = false;
                initialPinchDistance = 0;
                lastPinchDistance = 0;
            }
        }, { passive: false });        // Mouse wheel - zoom
        this.canvas.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.canvas.getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.canvas.zoom(zoomFactor, centerX, centerY);

            // Update text element positions after zoom
            this.textManager.onCanvasTransform();
            this.trackZoomDebounced();
        });

        // Mouse drag - pan (Ctrl+click)
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };
        let panDistance = 0;

        // Touch support variables
        let isTouchDragging = false;
        let touchLastPos = { x: 0, y: 0 };

        this.canvas.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && e.ctrlKey) {
                isDragging = true;
                lastPos = { x: e.clientX, y: e.clientY };
                panDistance = 0;
                e.preventDefault();
                this.canvas.canvas.style.cursor = 'grab';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastPos.x;
                const deltaY = e.clientY - lastPos.y;
                this.canvas.pan(deltaX, deltaY);
                lastPos = { x: e.clientX, y: e.clientY };

                // Accumulate pan distance for analytics
                panDistance += Math.hypot(deltaX, deltaY);

                // Show grabbing cursor while dragging
                this.canvas.canvas.style.cursor = 'grabbing';

                // Update text element positions after pan
                this.textManager.onCanvasTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.canvas.style.cursor = 'crosshair';
                // Track pan once when drag ends
                if (panDistance > 0) {
                    this.track('pan', { distance: Math.round(panDistance) });
                    panDistance = 0;
                }
            }
        });

        // Prevent context menu on right click
        this.canvas.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Selection change - highlight matches and auto-copy
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText) {
                this.highlighter.highlightMatches(selectedText);
                this.clipboardManager.copyToClipboard(selectedText);
            } else {
                this.highlighter.clearHighlights();
            }
        });

        // Update highlighter positions on canvas transform
        this.canvas.canvas.addEventListener('wheel', () => {
            setTimeout(() => this.highlighter.updateHighlightPositions(), 50);
        });

        let panUpdateTimeout;
        document.addEventListener('mousemove', () => {
            if (isDragging) {
                clearTimeout(panUpdateTimeout);
                panUpdateTimeout = setTimeout(() => {
                    this.highlighter.updateHighlightPositions();
                }, 100);
            }
        });

        // Keyboard shortcuts
        const onKeyDown = (e) => {
            // Reset view: Ctrl+0 only (support main row and numpad 0).
            // On macOS, use Control+0; Command+0 is left to the browser's default zoom reset.
            if (e.ctrlKey && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                this.canvas.resetView();
                this.textManager.onCanvasTransform?.();
                this.highlighter.updateHighlightPositions?.();
                this.track('reset_view', { source: 'keyboard' });
                return false;
            }

            // Allow Cmd+0 to pass through on macOS
            if (e.metaKey && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
                return; // Do not block browser default
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        e.stopPropagation();
                        this.saveState();
                        return false;
                }
            }

            if (e.key === 'Escape') {
                this.textManager.clearActiveInput();
            }
        };
        // Capture phase so Ctrl+0 is handled early; Cmd+0 is allowed to pass through on macOS
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keydown', onKeyDown, true);

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.canvas.handleResize();
            this.textManager.onCanvasTransform?.();
            this.highlighter.updateHighlightPositions?.();
        }, 150));

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Shortcuts button functionality
        this.setupShortcutsButton();

        // Clear all button functionality
        this.setupClearAllButton();
    }

    setupHelpIndicator() {
        this.helpIndicator = document.querySelector('.help-indicator');
        this.shortcutsButton = document.querySelector('#shortcuts-btn');
        this.shortcutsPopup = document.querySelector('#shortcuts-popup');
        this.clearAllButton = document.querySelector('#clear-all-btn');

        console.log('Elements found in setupHelpIndicator:');
        console.log('- Help indicator:', !!this.helpIndicator);
        console.log('- Shortcuts button:', !!this.shortcutsButton);
        console.log('- Shortcuts popup:', !!this.shortcutsPopup);
        console.log('- Clear all button:', !!this.clearAllButton);

        // Check if we should show help indicator
        setTimeout(() => {
            // Only show help if there are no existing elements
            const hasElements = this.textManager.textElements.size > 0;
            if (!hasElements) {
                this.helpIndicator?.classList.add('fade-in');
                // Also hide action buttons when showing help
                if (this.shortcutsButton) {
                    this.shortcutsButton.classList.remove('visible');
                }
                if (this.clearAllButton) {
                    this.clearAllButton.classList.remove('visible');
                }
            } else {
                // Hide help and show action buttons if we have elements
                this.hideHelpIndicator();
            }
        }, 500);
    }

    setupShortcutsButton() {
        // Elements are already selected in setupHelpIndicator
        if (!this.shortcutsButton || !this.shortcutsPopup) {
            console.error('Shortcuts button or popup not found!');
            return;
        }

        console.log('Setting up shortcuts button functionality');

        // Toggle shortcuts popup
        this.shortcutsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Shortcuts button clicked');
            this.toggleShortcutsPopup();
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.shortcutsPopup.contains(e.target) && !this.shortcutsButton.contains(e.target)) {
                this.hideShortcutsPopup();
            }
        });

        // Close popup when touching outside (mobile)
        document.addEventListener('touchstart', (e) => {
            if (!this.shortcutsPopup.contains(e.target) && !this.shortcutsButton.contains(e.target)) {
                this.hideShortcutsPopup();
            }
        });

        // Close popup with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideShortcutsPopup();
            }
        });
    }

    setupClearAllButton() {
        console.log('Setting up clear all button...');

        if (!this.clearAllButton) {
            console.error('Clear all button not found in DOM!');
            return;
        }

        console.log('Clear all button found:', this.clearAllButton);
        console.log('Button visibility classes:', this.clearAllButton.className);
        console.log('Button style display:', this.clearAllButton.style.display);

        // Clear all calculations when button is clicked
        this.clearAllButton.addEventListener('click', (e) => {
            console.log('Clear all button clicked!');
            e.stopPropagation();
            e.preventDefault();
            this.clearAllCalculations();
        });

        console.log('Clear all button event listener added');
    }

    clearAllCalculations() {
        console.log('clearAllCalculations() called');

        // Show confirmation if there are calculations to clear
        const elementCount = this.textManager.textElements.size;
        console.log('Current element count:', elementCount);

        if (elementCount === 0) {
            console.log('No calculations to clear');
            alert('No calculations to clear!'); // Temporary debug alert
            return;
        }

        // Simple confirmation
        const confirmed = confirm(`Clear all ${elementCount} calculations? This cannot be undone.`);
        console.log('User confirmed:', confirmed);

        if (confirmed) {
            // Track count cleared
            this.track('clear_all', { count: elementCount });

            // Clear all calculations
            const clearedCount = this.textManager.clearAllCalculations();

            // Clear storage
            this.storage.clearCanvasState();

            // Show help indicator again since canvas is empty
            this.showHelpIndicator();

            // Hide action buttons
            this.clearAllButton.classList.remove('visible');
            this.shortcutsButton.classList.remove('visible');

            console.log(`Cleared ${clearedCount} calculations`);
        }
    }

    showHelpIndicator() {
        if (this.helpIndicator) {
            this.helpIndicator.style.display = 'block';
            this.helpIndicator.classList.remove('fade-out');
            this.helpIndicator.classList.add('fade-in');

            // Hide action buttons when showing help indicator
            if (this.shortcutsButton) {
                this.shortcutsButton.classList.remove('visible');
            }
            if (this.clearAllButton) {
                this.clearAllButton.classList.remove('visible');
            }
        }
    }

    toggleShortcutsPopup() {
        console.log('Toggle shortcuts popup called');
        if (this.shortcutsPopup.classList.contains('visible')) {
            console.log('Hiding popup');
            this.hideShortcutsPopup();
        } else {
            console.log('Showing popup');
            this.showShortcutsPopup();
        }
    }

    showShortcutsPopup() {
        console.log('Showing shortcuts popup');
        this.shortcutsPopup.classList.remove('hidden');
        this.shortcutsPopup.classList.add('visible');
        this.shortcutsPopup.style.display = 'block'; // Ensure it's visible
        this.track('shortcuts_popup', { action: 'show' });
    }

    hideShortcutsPopup() {
        console.log('Hiding shortcuts popup');
        this.shortcutsPopup.classList.remove('visible');
        this.shortcutsPopup.classList.add('hidden');
        this.track('shortcuts_popup', { action: 'hide' });
    }

    hideHelpIndicator() {
        if (this.helpIndicator && this.helpIndicator.style.display !== 'none') {
            this.helpIndicator.classList.add('fade-out');

            // Show action buttons immediately when help starts hiding
            if (this.shortcutsButton) {
                this.shortcutsButton.classList.add('visible');
            }
            if (this.clearAllButton) {
                this.clearAllButton.classList.add('visible');
            }

            setTimeout(() => {
                this.helpIndicator.style.display = 'none';
            }, 500);
        }
    }

    async loadPreviousState() {
        try {
            const state = this.storage.loadCanvasState();
            if (state && state.elements && state.elements.length > 0) {
                this.canvas.setState(state.viewport);
                await this.textManager.restoreElements(state.elements);
                // Hide help indicator if we have existing elements
                this.hideHelpIndicator();
                // Immediately show action buttons without delay for existing content
                if (this.shortcutsButton) {
                    this.shortcutsButton.classList.add('visible');
                }
                if (this.clearAllButton) {
                    this.clearAllButton.classList.add('visible');
                }
                console.log('Previous state loaded successfully');
                this.track('app_ready', { restored: true, elements: state.elements.length });
            } else {
                // No previous state - ensure we start with a centered, grid-aligned view
                this.canvas.resetView();
                console.log('No previous state - starting with centered view');
                this.track('app_ready', { restored: false, elements: 0 });
            }
        } catch (error) {
            console.warn('Failed to load previous state:', error);
            // On error, also reset to center
            this.canvas.resetView();
            this.track('app_ready', { restored: false, error: true });
        }
    }

    saveState() {
        try {
            const state = {
                viewport: this.canvas.getViewport(),
                elements: this.textManager.getElements()
            };
            this.storage.saveCanvasState(state);
            this.isDirty = false;
        } catch (error) {
            console.warn('Failed to save state:', error);
        }
    }

    getState() {
        return {
            viewport: this.canvas.getViewport(),
            elements: this.textManager.getElements()
        };
    }

    markDirty() {
        this.isDirty = true;
    }

    // Lightweight analytics helper
    track(eventName, params = {}) {
        try {
            if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                window.gtag('event', eventName, {
                    send_to: 'G-9MJLW4B550',
                    app: 'MinusPlus',
                    ...params
                });
            }
        } catch (e) {
            // no-op
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.canvasApp = new MinusPlusApp();
});

export default MinusPlusApp;
