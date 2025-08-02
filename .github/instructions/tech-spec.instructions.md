# MinusPlus Calculator App - Technical Specification

## Architecture Overview

**Technology Stack:**

- **Frontend:** Vanilla JavaScript (ES6+)
- **Rendering:** HTML5 Canvas API + DOM for text inputs
- **Styling:** Pure CSS3 with CSS Custom Properties
- **Storage:** localStorage + sessionStorage
- **Build Tool:** Vite (for development) / No build for production
- **Deployment:** Static hosting (Vercel/Netlify)

## Project Structure

```
minusplus-app/
├── src/
│   ├── core/
│   │   ├── canvas.js              # Infinite canvas management
│   │   ├── calculator.js          # Calculation engine
│   │   ├── textManager.js         # Text input/editing
│   │   └── clipboardManager.js    # Copy/paste operations
│   ├── utils/
│   │   ├── mathParser.js          # Number parsing & validation
│   │   ├── highlighter.js         # Text highlighting & matching
│   │   ├── storage.js             # Data persistence
│   │   └── constants.js           # App constants
│   ├── styles/
│   │   ├── main.css              # Global styles
│   │   ├── canvas.css            # Canvas-specific styles
│   │   └── themes.css            # Dark theme variables
│   ├── main.js                   # App initialization
│   └── index.html                # Entry point
├── assets/
│   ├── icons/                    # App icons
│   └── fonts/                    # Custom fonts
├── tests/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
└── dist/                         # Production build
```

## Core Technical Implementation

### 1. Canvas System Architecture

```javascript
// core/canvas.js
class InfiniteCanvas {
  constructor(containerId) {
    this.canvas = document.getElementById(containerId);
    this.ctx = this.canvas.getContext("2d");
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.elements = new Map(); // Store calculation elements
    this.init();
  }

  init() {
    this.setupCanvas();
    this.bindEvents();
    this.startRenderLoop();
  }

  setupCanvas() {
    // High DPI display support
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.viewport.width * dpr;
    this.canvas.height = this.viewport.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = this.viewport.width + "px";
    this.canvas.style.height = this.viewport.height + "px";
  }

  // Pan and zoom functionality
  pan(deltaX, deltaY) {
    this.viewport.x += deltaX / this.viewport.zoom;
    this.viewport.y += deltaY / this.viewport.zoom;
    this.render();
  }

  zoom(factor, centerX, centerY) {
    const newZoom = Math.max(0.1, Math.min(5, this.viewport.zoom * factor));

    // Zoom towards cursor position
    const zoomPoint = this.screenToWorld(centerX, centerY);
    this.viewport.zoom = newZoom;
    const newZoomPoint = this.screenToWorld(centerX, centerY);

    this.viewport.x += zoomPoint.x - newZoomPoint.x;
    this.viewport.y += zoomPoint.y - newZoomPoint.y;
    this.render();
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX / this.viewport.zoom + this.viewport.x,
      y: screenY / this.viewport.zoom + this.viewport.y,
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.viewport.x) * this.viewport.zoom,
      y: (worldY - this.viewport.y) * this.viewport.zoom,
    };
  }
}
```

### 2. Calculation Engine

```javascript
// core/calculator.js
class CalculationEngine {
  constructor() {
    this.operations = {
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => (b !== 0 ? a / b : NaN),
    };
  }

  // Parse and calculate vertical columns
  calculateVerticalColumn(text) {
    const numbers = this.extractNumbers(text.split("\n"));
    return {
      numbers: numbers,
      result: numbers.reduce((sum, num) => sum + num, 0),
      operation: "addition",
    };
  }

  // Parse and calculate horizontal sequences
  calculateHorizontalSequence(text) {
    const numbers = this.extractNumbers(text.split(/\s+/));
    return {
      numbers: numbers,
      result: numbers.reduce((sum, num) => sum + num, 0),
      operation: "addition",
    };
  }

  extractNumbers(textArray) {
    return textArray
      .map((str) => str.trim())
      .filter((str) => str.length > 0)
      .map((str) => this.parseNumber(str))
      .filter((num) => !isNaN(num));
  }

  parseNumber(str) {
    // Remove currency symbols, commas, and whitespace
    const cleaned = str.replace(/[$,\s]/g, "");
    return parseFloat(cleaned);
  }

  formatResult(number, precision = 2) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(number);
  }
}
```

### 3. Text Management System

```javascript
// core/textManager.js
class TextManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeInput = null;
    this.textElements = new Map();
    this.calculator = new CalculationEngine();
  }

  createTextInput(x, y) {
    const input = document.createElement("textarea");
    input.className = "canvas-text-input";
    input.style.position = "absolute";
    input.style.left = x + "px";
    input.style.top = y + "px";

    // Auto-resize functionality
    input.addEventListener("input", (e) => {
      this.autoResize(input);
      this.handleInputChange(input);
    });

    input.addEventListener("paste", (e) => {
      setTimeout(() => this.handlePaste(input), 0);
    });

    document.body.appendChild(input);
    input.focus();
    this.activeInput = input;

    return input;
  }

  handleInputChange(input) {
    const text = input.value;

    // Detect calculation type and compute result
    let result = null;

    if (text.includes("\n")) {
      // Vertical calculation
      result = this.calculator.calculateVerticalColumn(text);
    } else if (text.includes(" ")) {
      // Horizontal calculation
      result = this.calculator.calculateHorizontalSequence(text);
    }

    if (result && result.numbers.length > 1) {
      this.displayResult(input, result);
    }
  }

  displayResult(input, calculation) {
    const resultElement = this.getOrCreateResultElement(input);
    resultElement.textContent = `= ${this.calculator.formatResult(
      calculation.result
    )}`;
    resultElement.style.display = "block";
  }

  autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
}
```

### 4. Clipboard Management

```javascript
// core/clipboardManager.js
class ClipboardManager {
  constructor() {
    this.isSupported = navigator.clipboard && window.isSecureContext;
    this.setupSelectionListener();
  }

  setupSelectionListener() {
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        this.copyToClipboard(selection.toString());
      }
    });
  }

  async copyToClipboard(text) {
    try {
      if (this.isSupported) {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopy(text);
      }
      this.showCopyFeedback();
    } catch (err) {
      console.warn("Copy failed:", err);
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  showCopyFeedback() {
    // Brief visual feedback
    const feedback = document.createElement("div");
    feedback.className = "copy-feedback";
    feedback.textContent = "Copied!";
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 1000);
  }
}
```

### 5. Text Highlighting & Matching

```javascript
// utils/highlighter.js
class TextHighlighter {
  constructor() {
    this.activeHighlights = [];
    this.originalSelection = null;
  }

  highlightMatches(selectedText) {
    this.clearHighlights();

    if (!selectedText.trim()) return;

    // Find all text elements on canvas
    const textElements = document.querySelectorAll(
      ".canvas-text-input, .calculation-result"
    );

    textElements.forEach((element) => {
      this.highlightInElement(element, selectedText);
    });
  }

  highlightInElement(element, searchText) {
    const text = element.textContent || element.value;
    const regex = new RegExp(escapeRegExp(searchText), "gi");
    let match;

    while ((match = regex.exec(text)) !== null) {
      this.createHighlight(
        element,
        match.index,
        match.index + searchText.length
      );
    }
  }

  createHighlight(element, start, end) {
    const highlight = {
      element: element,
      start: start,
      end: end,
      originalBg: element.style.backgroundColor,
    };

    // Apply highlight styling
    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      element.setSelectionRange(start, end);
      element.style.backgroundColor = "rgba(255, 165, 0, 0.3)";
    } else {
      // For other elements, wrap matching text in span
      this.wrapTextInHighlight(element, start, end);
    }

    this.activeHighlights.push(highlight);
  }

  clearHighlights() {
    this.activeHighlights.forEach((highlight) => {
      highlight.element.style.backgroundColor = highlight.originalBg;
    });
    this.activeHighlights = [];
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

## Performance Optimizations

### 1. Canvas Rendering Optimization

```javascript
// Viewport culling - only render visible elements
render() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  // Calculate visible bounds
  const bounds = this.getVisibleBounds();

  // Only render elements within viewport
  this.elements.forEach((element, id) => {
    if (this.isElementVisible(element, bounds)) {
      this.renderElement(element);
    }
  });
}

// Debounced resize handler
const debouncedResize = debounce(() => {
  this.handleResize();
}, 150);

window.addEventListener('resize', debouncedResize);
```

### 2. Memory Management

```javascript
// Efficient element storage and cleanup
class ElementManager {
  constructor() {
    this.elements = new Map();
    this.elementPool = []; // Reuse elements
    this.maxPoolSize = 100;
  }

  createElement(type, data) {
    let element = this.elementPool.pop();
    if (!element) {
      element = new CalculationElement(type);
    }
    element.update(data);
    this.elements.set(element.id, element);
    return element;
  }

  removeElement(id) {
    const element = this.elements.get(id);
    if (element && this.elementPool.length < this.maxPoolSize) {
      element.reset();
      this.elementPool.push(element);
    }
    this.elements.delete(id);
  }
}
```

## Data Persistence

```javascript
// utils/storage.js
class StorageManager {
  constructor() {
    this.storageKey = "minusplus_canvas_data";
    this.autoSaveInterval = 30000; // 30 seconds
    this.startAutoSave();
  }

  saveCanvasState(canvasData) {
    try {
      const data = {
        timestamp: Date.now(),
        viewport: canvasData.viewport,
        elements: Array.from(canvasData.elements.entries()),
        version: "1.0",
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save canvas state:", error);
    }
  }

  loadCanvasState() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          viewport: parsed.viewport,
          elements: new Map(parsed.elements),
        };
      }
    } catch (error) {
      console.warn("Failed to load canvas state:", error);
    }
    return null;
  }

  startAutoSave() {
    setInterval(() => {
      if (window.canvasApp && window.canvasApp.isDirty) {
        this.saveCanvasState(window.canvasApp.getState());
        window.canvasApp.isDirty = false;
      }
    }, this.autoSaveInterval);
  }
}
```

## Event Handling System

```javascript
// main.js - Event coordination
class MinusPlusApp {
  constructor() {
    this.canvas = new InfiniteCanvas("main-canvas");
    this.textManager = new TextManager(this.canvas);
    this.clipboardManager = new ClipboardManager();
    this.highlighter = new TextHighlighter();
    this.storage = new StorageManager();

    this.setupEventHandlers();
    this.loadPreviousState();
  }

  setupEventHandlers() {
    // Canvas click - create new calculation
    this.canvas.canvas.addEventListener("click", (e) => {
      const worldPos = this.canvas.screenToWorld(e.clientX, e.clientY);
      this.textManager.createTextInput(worldPos.x, worldPos.y);
    });

    // Mouse wheel - zoom
    this.canvas.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.canvas.zoom(zoomFactor, e.clientX, e.clientY);
    });

    // Mouse drag - pan
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    this.canvas.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        // Middle mouse or Ctrl+click
        isDragging = true;
        lastPos = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastPos.x;
        const deltaY = e.clientY - lastPos.y;
        this.canvas.pan(deltaX, deltaY);
        lastPos = { x: e.clientX, y: e.clientY };
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Selection change - highlight matches
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection().toString();
      this.highlighter.highlightMatches(selection);
    });
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  window.canvasApp = new MinusPlusApp();
});
```

## CSS Styling

```css
/* styles/main.css */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent-blue: #007acc;
  --accent-orange: #ffa500;
  --accent-green: #32cd32;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

#main-canvas {
  display: block;
  cursor: crosshair;
  background: var(--bg-primary);
}

.canvas-text-input {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  padding: 8px;
  border-radius: 4px;
  resize: none;
  min-width: 100px;
  min-height: 40px;
}

.canvas-text-input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.calculation-result {
  color: var(--accent-green);
  font-weight: 600;
  margin-top: 4px;
  font-family: "JetBrains Mono", monospace;
}

.copy-feedback {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--accent-green);
  color: var(--bg-primary);
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  animation: fadeInOut 1s ease-in-out;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Testing Strategy

```javascript
// tests/unit/calculator.test.js
import { CalculationEngine } from "../src/core/calculator.js";

describe("CalculationEngine", () => {
  let calc;

  beforeEach(() => {
    calc = new CalculationEngine();
  });

  test("should calculate vertical column correctly", () => {
    const result = calc.calculateVerticalColumn("10\n20\n30");
    expect(result.result).toBe(60);
    expect(result.numbers).toEqual([10, 20, 30]);
  });

  test("should calculate horizontal sequence correctly", () => {
    const result = calc.calculateHorizontalSequence("10 20 30");
    expect(result.result).toBe(60);
    expect(result.numbers).toEqual([10, 20, 30]);
  });

  test("should handle currency formatting", () => {
    const result = calc.calculateVerticalColumn("$1,234.56\n$2,345.67");
    expect(result.result).toBe(3580.23);
  });
});
```

## Performance Benchmarks

**Target Performance Metrics:**

- Initial load time: < 200ms
- Canvas pan/zoom: 60fps
- Text input response: < 50ms
- Memory usage: < 50MB for 1000 calculations
- Search/highlight: < 100ms for 10,000 text elements

## Browser Compatibility

**Minimum Requirements:**

- Chrome 80+ (Canvas API, Clipboard API)
- Firefox 76+ (Canvas API, Clipboard API)
- Safari 13.1+ (Canvas API, limited Clipboard API)
- Edge 80+ (Canvas API, Clipboard API)

**Fallbacks:**

- Clipboard API → document.execCommand('copy')
- CSS Grid → Flexbox
- ES6 modules → Bundled single file

## Security Considerations

1. **XSS Prevention**: Sanitize all text inputs
2. **Clipboard Security**: Handle clipboard permissions gracefully
3. **Data Validation**: Validate all numeric inputs
4. **Storage Limits**: Implement storage quota management
5. **Error Handling**: Fail gracefully without exposing internals

## Deployment Configuration

```javascript
// vite.config.js (for development)
export default {
  root: "src",
  build: {
    outDir: "../dist",
    minify: "terser",
    target: "es2020",
  },
  server: {
    port: 3000,
    open: true,
  },
};
```

This technical specification provides a complete roadmap for building MinusPlus with optimal performance using vanilla JavaScript. The modular architecture ensures maintainability while the performance optimizations guarantee smooth 60fps canvas operations.
