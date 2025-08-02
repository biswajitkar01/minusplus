# MinusPlus Calculator App - Product Requirements Document

## Product Overview

**Product Name:** MinusPlus Calculator App  
**Domain:** minusplus.app  
**Version:** 1.0  
**Date:** August 2025

### Vision Statement

MinusPlus revolutionizes the calculator experience by providing an infinite dark canvas where users can perform calculations spatially, intuitively, and collaboratively across the workspace.

### Product Summary

A web-based calculator application that breaks away from traditional calculator constraints by offering an infinite dark canvas where users can click anywhere to perform calculations, paste data from external sources, and leverage intelligent auto-calculation features.

## Core Features & Requirements

### 1. Infinite Dark Canvas Interface

**Feature Description:** The primary interface is a dark, infinite scrollable/pannable canvas where users can interact.

**Requirements:**

- Dark theme interface (black/dark gray background)
- Infinite scrolling and panning capabilities
- Smooth zoom in/out functionality
- Click-anywhere interaction model
- Responsive design for desktop, tablet, and mobile
- Canvas state persistence across sessions

**User Stories:**

- As a user, I want to click anywhere on the canvas to start a calculation
- As a user, I want to pan and zoom smoothly across the infinite workspace
- As a user, I want the dark theme to reduce eye strain during extended use

### 2. Vertical Column Auto-Calculation

**Feature Description:** Users can paste or type numbers in vertical columns, and the system automatically performs addition.

**Requirements:**

- Detect vertical arrangement of numbers (line-separated values)
- Auto-calculate sum for vertical columns
- Support for pasting from Excel, Google Sheets, or any clipboard source
- Display running total as numbers are added
- Handle different number formats (integers, decimals, negative numbers)
- Support for currency symbols and thousands separators

**User Stories:**

- As a user, I want to paste a column of numbers from Excel and see the automatic sum
- As a user, I want to add numbers vertically by typing them line by line
- As a user, I want to see the running total update as I add more numbers

**Technical Specifications:**

- Parse clipboard data for numeric values
- Regex patterns for number detection: `/[-+]?[0-9]*\.?[0-9]+/g`
- Support formats: 1,234.56, $1,234.56, -456.78, etc.

### 3. Horizontal Auto-Addition

**Feature Description:** When two or more numbers are placed horizontally with spaces, automatically perform addition.

**Requirements:**

- Detect space-separated numbers in horizontal arrangement
- Auto-calculate sum for horizontal sequences
- Real-time calculation as numbers are typed
- Visual indication of calculated groups
- Support for mixed horizontal and vertical calculations

**User Stories:**

- As a user, I want to type "25 30 45" and see "= 100" automatically calculated
- As a user, I want to separate numbers with spaces and see instant results

**Technical Specifications:**

- Pattern matching for space-separated numbers: `/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g`
- Real-time parsing and calculation
- Visual grouping of related calculations

### 4. Auto-Copy on Highlight

**Feature Description:** Any text highlighted by the user is automatically copied to the clipboard.

**Requirements:**

- Detect text selection events
- Copy selected text to clipboard automatically
- Work across all text elements on the canvas
- Provide subtle visual feedback for copy action
- Handle permissions for clipboard access
- Support for copying numbers, results, and formulas

**User Stories:**

- As a user, I want to highlight any number or result and have it automatically copied
- As a user, I want to quickly copy calculation results without manual copy commands

**Technical Specifications:**

- Use `navigator.clipboard.writeText()` API
- Handle `selectionchange` events
- Fallback for browsers without clipboard API support
- Visual indicator (brief flash or notification) for successful copy

### 5. Smart Highlighting & Matching

**Feature Description:** When text is highlighted, all matching values on the canvas are automatically highlighted.

**Requirements:**

- Real-time detection of text selection
- Search and highlight all matching instances across the canvas
- Visual differentiation between original selection and matches
- Support for exact matches and numeric value matches
- Clear highlighting when selection is cleared
- Performance optimization for large canvases

**User Stories:**

- As a user, I want to highlight "100" and see all other instances of "100" highlighted across the canvas
- As a user, I want to quickly identify duplicate values or results visually

**Technical Specifications:**

- Implement text matching algorithm
- Use different highlight colors: primary selection (blue), matches (yellow/orange)
- Debounce search for performance
- DOM traversal optimization

## User Interface Requirements

### Visual Design

- **Color Scheme:** Dark theme with high contrast
  - Background: #1a1a1a or #000000
  - Text: #ffffff or #f0f0f0
  - Highlights: #007acc (primary), #ffa500 (matches)
  - Results: #00ff00 or #32cd32
- **Typography:** Monospace font for numbers, clean sans-serif for UI elements
- **Spacing:** Generous whitespace, clear visual hierarchy

### Interaction Patterns

- Click to place cursor and start typing
- Drag to pan canvas
- Mouse wheel or pinch to zoom
- Text selection triggers auto-copy and matching
- Enter key to create new line/calculation
- Tab key for horizontal spacing

### Responsive Design

- Desktop: Full keyboard and mouse support
- Tablet: Touch-optimized with virtual keyboard
- Mobile: Simplified interface with core functionality

## Technical Requirements

### Performance

- Smooth 60fps canvas rendering
- Efficient text search algorithms
- Lazy loading for large calculation sets
- Memory management for infinite canvas

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### APIs & Libraries

- Canvas API or WebGL for rendering
- Clipboard API for auto-copy functionality
- Web Workers for heavy calculations
- Local Storage for persistence

## User Experience Flow

### Primary User Journey

1. User opens minusplus.app
2. Sees infinite dark canvas with subtle introduction/tutorial
3. Clicks anywhere to start first calculation
4. Types or pastes numbers
5. Sees automatic calculation results
6. Highlights results to copy
7. Continues adding calculations across the canvas
8. Uses pan/zoom to navigate between calculation areas

### Edge Cases & Error Handling

- Invalid number formats → Show error indicator
- Clipboard permission denied → Provide manual copy option
- Large datasets → Progressive loading and performance optimization
- Network connectivity → Offline functionality with local storage

## Success Metrics

### Primary KPIs

- User engagement: Average session duration > 5 minutes
- Feature adoption: >70% of users use auto-copy feature
- User retention: >40% return within 7 days
- Performance: Page load time < 2 seconds

### Secondary Metrics

- Calculation accuracy: 99.9% correct results
- Cross-platform usage distribution
- Feature usage analytics (vertical vs horizontal calculations)
- User feedback scores

## Future Enhancements (Phase 2+)

### Advanced Features

- Custom formulas and functions (SUM, AVERAGE, etc.)
- Collaborative real-time editing
- Export calculations to Excel/PDF
- Undo/Redo functionality
- Calculation history sidebar
- Custom themes and color schemes
- Voice input for calculations
- Integration with external data sources

### Premium Features

- Cloud sync across devices
- Advanced mathematical functions
- Data visualization (charts, graphs)
- Team workspaces
- API access for developers

## Technical Architecture

### Frontend Stack

- **Framework:** React or Vue.js
- **Canvas Rendering:** HTML5 Canvas or Three.js for WebGL
- **State Management:** Redux or Vuex
- **Styling:** CSS Modules or Styled Components
- **Build Tool:** Vite or Webpack

### Backend Requirements

- **Storage:** Firebase or AWS for user data persistence
- **Authentication:** Optional user accounts for sync
- **Analytics:** Google Analytics or Mixpanel

## Risk Assessment

### Technical Risks

- **Medium Risk:** Browser clipboard API limitations
- **Low Risk:** Performance with very large canvases
- **Medium Risk:** Cross-browser text selection differences

### Mitigation Strategies

- Implement fallback clipboard methods
- Use virtual scrolling and efficient rendering
- Extensive cross-browser testing
- Progressive enhancement approach

## Timeline & Milestones

### Phase 1 (MVP - 8 weeks)

- Week 1-2: Core canvas infrastructure
- Week 3-4: Basic calculation engine
- Week 5-6: Auto-calculation features
- Week 7-8: Auto-copy and highlighting features

### Phase 2 (Enhanced Features - 6 weeks)

- Advanced calculations and formulas
- Performance optimizations
- Enhanced UX/UI polish
- Mobile optimization

## Conclusion

MinusPlus represents an innovative approach to digital calculations, combining the flexibility of an infinite workspace with intelligent automation features. The focus on user experience, performance, and intuitive interaction patterns positions it as a unique tool in the calculator application space.
