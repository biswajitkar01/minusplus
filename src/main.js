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

            // Setup event coordination
            this.setupEventHandlers();

            // Load previous state if available
            await this.loadPreviousState();

            // Hide help indicator after first interaction
            this.setupHelpIndicator();

            console.log('MinusPlus Calculator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MinusPlus:', error);
        }
    }

    setupEventHandlers() {
        // Canvas click - create new calculation
        this.canvas.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.canvas.screenToWorld(screenX, screenY);

            this.textManager.createTextInput(worldPos.x, worldPos.y);
            this.hideHelpIndicator();
            this.markDirty();
        });

        // Mouse wheel - zoom
        this.canvas.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.canvas.getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.canvas.zoom(zoomFactor, centerX, centerY);

            // Update text element positions after zoom
            this.textManager.onCanvasTransform();
        });

        // Mouse drag - pan (middle mouse or Ctrl+click)
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };

        this.canvas.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                isDragging = true;
                lastPos = { x: e.clientX, y: e.clientY };
                e.preventDefault();
                this.canvas.canvas.style.cursor = 'move';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastPos.x;
                const deltaY = e.clientY - lastPos.y;
                this.canvas.pan(deltaX, deltaY);
                lastPos = { x: e.clientX, y: e.clientY };

                // Update text element positions after pan
                this.textManager.onCanvasTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.canvas.style.cursor = 'crosshair';
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
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '0':
                        e.preventDefault();
                        this.canvas.resetView();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveState();
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.textManager.clearActiveInput();
            }
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.canvas.handleResize();
        }, 150));

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Shortcuts button functionality
        this.setupShortcutsButton();
    }

    setupHelpIndicator() {
        this.helpIndicator = document.querySelector('.help-indicator');
        this.shortcutsButton = document.querySelector('#shortcuts-btn');
        this.shortcutsPopup = document.querySelector('#shortcuts-popup');

        // Check if we should show help indicator
        setTimeout(() => {
            // Only show help if there are no existing elements
            const hasElements = this.textManager.textElements.size > 0;
            if (!hasElements) {
                this.helpIndicator?.classList.add('fade-in');
            } else {
                // Hide help and show shortcuts button if we have elements
                this.hideHelpIndicator();
            }
        }, 500);
    }

    setupShortcutsButton() {
        // Elements are already selected in setupHelpIndicator
        if (!this.shortcutsButton || !this.shortcutsPopup) return;

        // Toggle shortcuts popup
        this.shortcutsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleShortcutsPopup();
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
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

    toggleShortcutsPopup() {
        if (this.shortcutsPopup.classList.contains('visible')) {
            this.hideShortcutsPopup();
        } else {
            this.showShortcutsPopup();
        }
    }

    showShortcutsPopup() {
        this.shortcutsPopup.classList.remove('hidden');
        this.shortcutsPopup.classList.add('visible');
    }

    hideShortcutsPopup() {
        this.shortcutsPopup.classList.remove('visible');
        this.shortcutsPopup.classList.add('hidden');
    }

    hideHelpIndicator() {
        if (this.helpIndicator && this.helpIndicator.style.display !== 'none') {
            this.helpIndicator.classList.add('fade-out');
            setTimeout(() => {
                this.helpIndicator.style.display = 'none';
                // Show shortcuts button when help indicator is hidden
                if (this.shortcutsButton) {
                    this.shortcutsButton.classList.add('visible');
                }
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
                console.log('Previous state loaded successfully');
            }
        } catch (error) {
            console.warn('Failed to load previous state:', error);
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
