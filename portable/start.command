#!/bin/bash
# MinusPlus Calculator - Portable Launcher (Mac/Linux)
# Double-click this file to launch MinusPlus in your browser

clear
echo ""
echo "  ============================================="
echo "   MinusPlus Calculator - Portable Launcher"
echo "  ============================================="
echo ""

# Get the directory where this script is located
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8000

# Function to open browser
open_browser() {
    local url="http://localhost:$PORT"
    sleep 1
    if command -v open &>/dev/null; then
        open "$url"  # macOS
    elif command -v xdg-open &>/dev/null; then
        xdg-open "$url"  # Linux
    else
        echo "  Open your browser to: $url"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "  MinusPlus server stopped."
    kill $SERVER_PID 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# Try python3 first (ships with macOS via Xcode CLI Tools)
if command -v python3 &>/dev/null; then
    echo "  Starting MinusPlus on http://localhost:$PORT ..."
    echo "  (Your browser will open automatically)"
    echo ""
    echo "  Press Ctrl+C to stop."
    echo ""
    open_browser &
    cd "$DIR"
    python3 -m http.server $PORT
    exit 0
fi

# Try python (older systems)
if command -v python &>/dev/null; then
    echo "  Starting MinusPlus on http://localhost:$PORT ..."
    echo "  (Your browser will open automatically)"
    echo ""
    echo "  Press Ctrl+C to stop."
    echo ""
    open_browser &
    cd "$DIR"
    python -m http.server $PORT 2>/dev/null || python -m SimpleHTTPServer $PORT
    exit 0
fi

# Try PHP
if command -v php &>/dev/null; then
    echo "  Starting MinusPlus on http://localhost:$PORT ..."
    echo "  (Your browser will open automatically)"
    echo ""
    echo "  Press Ctrl+C to stop."
    echo ""
    open_browser &
    cd "$DIR"
    php -S localhost:$PORT
    exit 0
fi

# Fallback: open file:// directly (no PWA install, but app works)
echo "  ⚠ No local server found (python3/php)."
echo "  Opening directly in browser (PWA install won't be available)..."
echo ""
if command -v open &>/dev/null; then
    open "$DIR/index.html"
elif command -v xdg-open &>/dev/null; then
    xdg-open "$DIR/index.html"
fi
echo "  Tip: Install Python 3 to enable PWA install."
echo "    macOS: xcode-select --install"
echo "    Linux: sudo apt install python3"
