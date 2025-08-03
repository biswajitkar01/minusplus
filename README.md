# MinusPlus Calculator App

Revolutionary calculator with infinite dark canvas interface. Click anywhere to start calculating, with intelligent auto-calculation for vertical columns and horizontal sequences.

![MinusPlus Calculator](https://img.shields.io/badge/MinusPlus-Calculator-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Infinite Dark Canvas**: Smooth pan and zoom across an unlimited workspace
- **Auto-Calculation**: Vertical columns and horizontal sequences calculate automatically
- **Auto-Copy on Highlight**: Any selected text is automatically copied to clipboard
- **Smart Text Matching**: Highlight text to see all matching instances across the canvas
- **High Performance**: Vanilla JavaScript with 60fps canvas operations
- **Mobile Support**: Touch-optimized for tablets and phones
- **Persistent State**: Auto-save every 30 seconds with state recovery

## 🚀 Quick Start

### Live Demo

Visit [minusplus.app](https://biswajitkar01.github.io/minusplus) to try it online!

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/biswajitkar01/minusplus.git
cd minusplus
```

2. Start the development server:

```bash
npm run dev
# or
python3 -m http.server 8000
```

3. Open your browser to `http://localhost:8000`

### GitHub Pages Deployment

This project is set up for GitHub Pages deployment:

1. Push your changes to the `main` branch
2. Go to your repository Settings → Pages
3. Set Source to "Deploy from a branch"
4. Select branch: `main` and folder: `/ (root)`
5. Your site will be available at `https://yourusername.github.io/minusplus`

The `index.html` file is in the root directory for GitHub Pages compatibility.

## 📁 Project Structure

```

## 🎯 How to Use

1. **Click anywhere** on the dark canvas to create a text input
2. **Type numbers** vertically (line-separated) or horizontally (space-separated)
3. **See automatic calculations** appear as you type
4. **Highlight any text** to copy it and see matching instances
5. **Pan**: Middle mouse button or Ctrl+click and drag
6. **Zoom**: Mouse wheel
7. **Reset view**: Ctrl+0 (Cmd+0 on Mac)

## 🧮 Calculation Examples

### Vertical Column Addition

```

10
20
30
= 60

```

### Horizontal Sequence Addition

```

25 30 45 = 100

```

### Currency Support

```

$1,234.56
$2,345.67
= $3,580.23

```

## 🎨 Key Features

### Infinite Canvas

- Smooth pan and zoom
- High DPI display support
- Viewport culling for performance
- Grid reference overlay

### Auto-Calculation Engine

- Real-time number parsing
- Multiple format support (currency, decimals, negatives)
- Vertical column detection
- Horizontal sequence detection
- Graceful error handling

### Clipboard Integration

- Auto-copy on text selection
- Visual feedback notifications
- Fallback for unsupported browsers
- Smart content detection

### Text Highlighting

- Real-time matching as you select
- Different colors for selection vs matches
- Performance-optimized search
- Canvas-aware positioning

## 🛠️ Technical Architecture

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API + DOM
- **Styling**: Pure CSS3 with custom properties
- **Storage**: localStorage for persistence
- **Build**: Vite (optional, for development)

### Performance Features

- 60fps canvas rendering
- Object pooling for memory efficiency
- Viewport culling
- Debounced input handling
- Hardware acceleration

### Browser Support

- Chrome 80+
- Firefox 76+
- Safari 13.1+
- Edge 80+

## 📁 Project Structure

```

src/
├── core/ # Core system modules
│ ├── canvas.js # Infinite canvas management
│ ├── calculator.js # Calculation engine
│ ├── textManager.js # Text input handling
│ └── clipboardManager.js # Copy/paste operations
├── utils/ # Utility functions
│ ├── highlighter.js # Text highlighting system
│ ├── storage.js # Data persistence
│ └── constants.js # Configuration constants
├── styles/ # CSS files
│ ├── main.css # Global styles
│ ├── canvas.css # Canvas-specific styles
│ └── themes.css # Dark theme variants
├── main.js # App initialization
└── index.html # Entry point

````

## ⚙️ Configuration

Key settings can be modified in `src/utils/constants.js`:

```javascript
// Canvas performance
CANVAS_CONFIG.TARGET_FPS = 60;
CANVAS_CONFIG.MAX_ZOOM = 5.0;

// Auto-save interval
STORAGE_CONFIG.AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Text input behavior
TEXT_CONFIG.CALCULATION_DEBOUNCE = 150; // ms
````

## 🎨 Customization

### Theme Variants

The app includes several dark theme variants:

- Default Dark (default)
- High Contrast Dark
- Blue Dark
- Green Dark
- Purple Dark
- Minimal Dark
- OLED True Black

### Adding Custom Themes

Add new themes in `src/styles/themes.css`:

```css
[data-theme="custom-theme"] {
  --bg-primary: #your-color;
  --accent-blue: #your-accent;
  /* ... other variables */
}
```

## 🔧 Development

### Local Development

```bash
# Install dependencies (optional, for Vite)
npm install

# Start development server
npm run dev

# Or use simple Python server
npm run serve
```

### Building for Production

```bash
npm run build
```

### Performance Monitoring

Enable debug mode by adding `?debug=true` to the URL to see:

- FPS counter
- Element boundaries
- Performance metrics

## 📱 Mobile Support

The app is optimized for mobile devices with:

- Touch pan and zoom gestures
- Larger touch targets
- Responsive text inputs
- iOS Safari compatibility

## 🔒 Privacy & Security

- **No external dependencies**: Everything runs locally
- **No data collection**: No analytics or tracking
- **Local storage only**: Data never leaves your device
- **Secure clipboard**: Respects browser security policies

## 🚀 Performance Tips

1. **Large datasets**: The app handles thousands of calculations efficiently
2. **Memory management**: Uses object pooling and viewport culling
3. **Smooth scrolling**: Optimized for 60fps on modern devices
4. **Auto-cleanup**: Removes empty inputs automatically

## 🤝 Contributing

This is a demonstration project built according to specific technical requirements. The codebase follows:

- Vanilla JavaScript patterns
- High-performance canvas rendering
- Modular architecture
- Comprehensive error handling

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with modern web standards and optimized for performance. Inspired by the need for a more intuitive calculator experience.

---

**MinusPlus Calculator** - Where mathematics meets infinite possibilities.

Visit: [minusplus.app](https://minusplus.app)
