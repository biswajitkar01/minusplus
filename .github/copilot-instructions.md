# GitHub Copilot Instructions - MinusPlus Calculator App

## Project Overview

MinusPlus is a high-performance web calculator app with an infinite dark canvas interface. Users can click anywhere to perform calculations, with intelligent auto-calculation for vertical columns and horizontal sequences.

**Domain:** minusplus.app  
**Tech Stack:** Vanilla JavaScript, HTML5 Canvas, Pure CSS  
**Performance Target:** <200ms load time, 60fps canvas operations

## Architecture Principles

### Core Philosophy

- **Simplicity First**: Keep the design and implementation as simple as possible. ALWAYS use the simplest solution possible. Avoid over-engineering - this is an internal automation tool, not enterprise software. Prefer single methods over complex class hierarchies. \*\* MAKE IT SUPER SIMPLE. NO EXTRA THINGS. MAKE THE METHODS COMPACT.
- **Performance First**: Vanilla JS for zero framework overhead
- **Canvas + DOM Hybrid**: Canvas for infinite workspace, DOM for text inputs
- **Modular Design**: Clean separation of concerns
- **Memory Efficient**: Object pooling and viewport culling
- **Progressive Enhancement**: Graceful fallbacks for all features

### Project Structure

```
src/
├── core/           # Core system modules
├── utils/          # Utility functions and helpers
├── styles/         # CSS files with CSS custom properties
├── main.js         # App initialization and coordination
└── index.html      # Entry point
```

## Coding Standards & Patterns

### JavaScript Style Guide

**ES6+ Features:** Use modern JavaScript features (classes, modules, async/await, destructuring)

```javascript
// ✅ Good - Modern class with proper encapsulation
class CanvasManager {
  constructor(containerId) {
    this.canvas = document.getElementById(containerId);
    this.ctx = this.canvas.getContext("2d");
    this.viewport = { x: 0, y: 0, zoom: 1 };
  }

  async initialize() {
    await this.setupCanvas();
    this.bindEvents();
  }
}

// ✅ Good - Destructuring and arrow functions
const { x, y, zoom } = this.viewport;
const handleClick = (e) => this.createCalculation(e);
```

**Performance Patterns:**

```javascript
// ✅ Good - Debounced operations for performance
const debouncedResize = debounce(() => {
  this.handleResize();
}, 150);

// ✅ Good - Viewport culling for canvas rendering
render() {
  const visibleBounds = this.getVisibleBounds();
  this.elements.forEach(element => {
    if (this.isElementVisible(element, visibleBounds)) {
      this.renderElement(element);
    }
  });
}

// ✅ Good - Object pooling for memory efficiency
createElement(type) {
  return this.elementPool.pop() || new CalculationElement(type);
}
```

**Error Handling:**

```javascript
// ✅ Good - Graceful error handling with fallbacks
async copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      this.fallbackCopy(text);
    }
  } catch (error) {
    console.warn('Copy failed, using fallback:', error);
    this.fallbackCopy(text);
  }
}
```

### CSS Standards

**Use CSS Custom Properties:** Maintain consistency with theme variables

```css
/* ✅ Good - CSS custom properties for theming */
:root {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  --accent-blue: #007acc;
}

.canvas-input {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

**Performance-First CSS:**

```css
/* ✅ Good - Hardware acceleration for smooth animations */
.canvas-element {
  transform: translateZ(0);
  will-change: transform;
}

/* ✅ Good - Efficient selectors */
.calculation-result {
  /* Direct class selector */
}

/* ❌ Avoid - Expensive selectors */
div > span + .result {
  /* Too complex */
}
```

## Feature Implementation Patterns

### 1. Canvas Management Pattern

```javascript
// Always use this pattern for canvas operations
class CanvasSystem {
  constructor(containerId) {
    this.setupCanvas();
    this.setupViewport();
    this.bindEvents();
    this.startRenderLoop();
  }

  // High DPI support is mandatory
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.viewport.width * dpr;
    this.canvas.height = this.viewport.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // Always implement smooth pan/zoom
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.viewport.x) * this.viewport.zoom,
      y: (worldY - this.viewport.y) * this.viewport.zoom,
    };
  }
}
```

### 2. Calculation Engine Pattern

```javascript
// Always parse numbers with this robust approach
parseNumber(str) {
  // Remove currency symbols, commas, whitespace
  const cleaned = str.replace(/[$,\s]/g, '');
  const number = parseFloat(cleaned);
  return isNaN(number) ? 0 : number;
}

// Auto-detect calculation types
detectCalculationType(text) {
  if (text.includes('\n')) return 'vertical';
  if (text.includes(' ')) return 'horizontal';
  return 'single';
}

// Always format results consistently
formatResult(number, precision = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  }).format(number);
}
```

### 3. Text Management Pattern

```javascript
// Always create text inputs with this pattern
createTextInput(worldX, worldY) {
  const input = document.createElement('textarea');
  const screenPos = this.canvas.worldToScreen(worldX, worldY);

  input.className = 'canvas-text-input';
  input.style.position = 'absolute';
  input.style.left = screenPos.x + 'px';
  input.style.top = screenPos.y + 'px';

  // Auto-resize and calculation listeners
  input.addEventListener('input', (e) => {
    this.autoResize(input);
    this.handleCalculation(input);
  });

  return input;
}
```

### 4. Event Handling Pattern

```javascript
// Always use this event coordination pattern
setupEventHandlers() {
  // Canvas interactions
  this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
  this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

  // Drag for panning (middle mouse or Ctrl+click)
  let isDragging = false;
  this.canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      isDragging = true;
      e.preventDefault();
    }
  });

  // Always cleanup event listeners
  this.cleanup = () => {
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    // ... remove all listeners
  };
}
```

## Core Feature Requirements

### 1. Infinite Canvas Features

- **Mandatory:** High DPI display support
- **Mandatory:** Smooth pan and zoom (60fps target)
- **Mandatory:** Viewport culling for performance
- **Mandatory:** World/screen coordinate conversion

### 2. Auto-Calculation Features

- **Vertical Columns:** Detect line-separated numbers, auto-sum
- **Horizontal Sequences:** Detect space-separated numbers, auto-sum
- **Real-time Updates:** Calculate as user types
- **Number Parsing:** Handle currency, commas, decimals

### 3. Clipboard Integration

- **Auto-copy on Highlight:** Any selected text copies automatically
- **Graceful Fallbacks:** Support browsers without Clipboard API
- **Visual Feedback:** Show brief "Copied!" notification

### 4. Text Highlighting & Matching

- **Real-time Matching:** Highlight all instances of selected text
- **Different Colors:** Primary selection vs matches
- **Performance:** Debounced search for large canvases

### 5. Persistence

- **Auto-save:** Every 30 seconds to localStorage
- **State Recovery:** Restore canvas on page reload
- **Error Handling:** Graceful handling of storage failures

## Performance Guidelines

### Critical Performance Rules

1. **Canvas Operations:** Always use requestAnimationFrame for rendering
2. **Text Operations:** Debounce input handlers (150ms minimum)
3. **Memory Management:** Implement object pooling for frequently created objects
4. **DOM Manipulation:** Batch DOM updates, use DocumentFragment
5. **Event Listeners:** Always cleanup on component destruction

### Memory Management Pattern

```javascript
// Always implement this pattern for performance-critical objects
class ElementPool {
  constructor(createFn, resetFn, maxSize = 100) {
    this.pool = [];
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get() {
    return this.pool.pop() || this.createFn();
  }

  release(element) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(element);
      this.pool.push(element);
    }
  }
}
```

## Testing Patterns

### Unit Test Structure

```javascript
// Always structure tests this way
describe("CalculationEngine", () => {
  let calc;

  beforeEach(() => {
    calc = new CalculationEngine();
  });

  test("should handle vertical column calculation", () => {
    const result = calc.calculateVerticalColumn("10\n20\n30");
    expect(result.result).toBe(60);
    expect(result.numbers).toEqual([10, 20, 30]);
  });

  test("should handle edge cases gracefully", () => {
    expect(calc.parseNumber("$1,234.56")).toBe(1234.56);
    expect(calc.parseNumber("invalid")).toBe(0);
  });
});
```

## Common Utilities

### Utility Functions to Always Use

```javascript
// Debouncing for performance
function debounce(func, wait) {
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

// Safe number parsing
function parseNumber(str) {
  const cleaned = str.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Clamp values for zoom/pan limits
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
```

## Browser Compatibility Requirements

### Essential APIs

- **Canvas API:** Required for infinite canvas
- **Clipboard API:** Required with fallback to execCommand
- **Selection API:** Required for text highlighting
- **localStorage:** Required for persistence

### Fallback Patterns

```javascript
// Always implement feature detection with fallbacks
const hasClipboardAPI = navigator.clipboard && window.isSecureContext;
const hasIntersectionObserver = "IntersectionObserver" in window;

if (!hasClipboardAPI) {
  // Implement execCommand fallback
}
```

## Security Considerations

### Input Sanitization

```javascript
// Always sanitize user input
function sanitizeInput(input) {
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}
```

### Safe Evaluation

```javascript
// Never use eval() - always parse numbers safely
function safeCalculate(expression) {
  // Use proper parsing, never eval()
  const numbers = extractNumbers(expression);
  return numbers.reduce((sum, num) => sum + num, 0);
}
```

## Development Workflow

### File Organization Rules

1. **Core Systems:** Place in `/core/` directory
2. **Utilities:** Place in `/utils/` directory
3. **Styles:** Use CSS custom properties, organize by component
4. **Tests:** Mirror source structure in `/tests/`

### Naming Conventions

- **Classes:** PascalCase (`CalculationEngine`)
- **Functions:** camelCase (`handleCanvasClick`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_ZOOM_LEVEL`)
- **CSS Classes:** kebab-case (`canvas-text-input`)
- **Files:** camelCase for JS, kebab-case for CSS

### Git Commit Patterns

- **feat:** New features
- **perf:** Performance improvements
- **fix:** Bug fixes
- **refactor:** Code refactoring
- **test:** Adding tests

## Key Reminders for Copilot

1. **Always prioritize performance** - This is a real-time canvas application
2. **Use vanilla JS patterns** - No frameworks, keep it lightweight
3. **Implement proper cleanup** - Memory leaks are critical to avoid
4. **Handle edge cases gracefully** - Users will input unexpected data
5. **Maintain 60fps** - Canvas operations must be smooth
6. **Auto-calculation is core** - Every text input should detect and calculate
7. **Accessibility matters** - Proper keyboard navigation and screen reader support
8. **Mobile compatibility** - Touch events and responsive design
9. **Progressive enhancement** - Features should degrade gracefully
10. **Test edge cases** - Currency formats, large numbers, invalid input

## Success Metrics to Optimize For

- **Load Time:** <200ms initial load
- **Canvas Performance:** 60fps pan/zoom
- **Memory Usage:** <50MB for 1000 calculations
- **Input Responsiveness:** <50ms calculation updates
- **Search Performance:** <100ms for text highlighting

Remember: MinusPlus is about creating the fastest, smoothest calculator experience possible with an innovative infinite canvas interface.
