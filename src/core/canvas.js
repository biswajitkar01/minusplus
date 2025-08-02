// Infinite Canvas Management System
// High-performance canvas with smooth pan/zoom and viewport culling

class InfiniteCanvas {
    constructor(containerId) {
        this.canvas = document.getElementById(containerId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${containerId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.viewport = {
            x: 0,
            y: 0,
            zoom: 1,
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.elements = new Map();
        this.isDirty = true;
        this.animationFrame = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.startRenderLoop();
        console.log('Infinite canvas initialized');
    }

    setupCanvas() {
        // High DPI display support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.viewport.width = rect.width;
        this.viewport.height = rect.height;

        this.canvas.width = this.viewport.width * dpr;
        this.canvas.height = this.viewport.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = this.viewport.width + 'px';
        this.canvas.style.height = this.viewport.height + 'px';

        console.log('Canvas setup:', {
            viewport: { width: this.viewport.width, height: this.viewport.height },
            canvas: { width: this.canvas.width, height: this.canvas.height },
            dpr: dpr
        });
    }

    startRenderLoop() {
        const render = () => {
            if (this.isDirty) {
                this.render();
                this.isDirty = false;
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);

        // Set canvas background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);

        // Draw consistent grid pattern
        this.drawGrid();

        // Render visible elements with viewport culling
        const visibleBounds = this.getVisibleBounds();
        this.elements.forEach((element) => {
            if (this.isElementVisible(element, visibleBounds)) {
                this.renderElement(element);
            }
        });
    }

    drawGrid() {
        // Use a fixed grid size that doesn't scale with zoom to avoid overlapping patterns
        const baseGridSize = 20; // Fixed grid size in pixels

        // Calculate offset to keep grid aligned with world coordinates
        const offsetX = ((-this.viewport.x * this.viewport.zoom) % baseGridSize + baseGridSize) % baseGridSize;
        const offsetY = ((-this.viewport.y * this.viewport.zoom) % baseGridSize + baseGridSize) % baseGridSize;

        // Set grid style - very subtle
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 0.5;

        // Use save/restore to ensure we don't affect other drawing
        this.ctx.save();

        // Draw vertical lines - cover entire width with generous margins
        this.ctx.beginPath();
        for (let x = offsetX - baseGridSize * 2; x <= this.viewport.width + baseGridSize * 2; x += baseGridSize) {
            this.ctx.moveTo(Math.floor(x) + 0.5, 0);
            this.ctx.lineTo(Math.floor(x) + 0.5, this.viewport.height);
        }
        this.ctx.stroke();

        // Draw horizontal lines - cover entire height with generous margins
        this.ctx.beginPath();
        for (let y = offsetY - baseGridSize * 2; y <= this.viewport.height + baseGridSize * 2; y += baseGridSize) {
            this.ctx.moveTo(0, Math.floor(y) + 0.5);
            this.ctx.lineTo(this.viewport.width, Math.floor(y) + 0.5);
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    getVisibleBounds() {
        const margin = 100; // Extra margin for smooth scrolling
        return {
            left: this.viewport.x - margin / this.viewport.zoom,
            top: this.viewport.y - margin / this.viewport.zoom,
            right: this.viewport.x + (this.viewport.width + margin) / this.viewport.zoom,
            bottom: this.viewport.y + (this.viewport.height + margin) / this.viewport.zoom
        };
    }

    isElementVisible(element, bounds) {
        return element.x < bounds.right &&
            element.x + element.width > bounds.left &&
            element.y < bounds.bottom &&
            element.y + element.height > bounds.top;
    }

    renderElement(element) {
        const screenPos = this.worldToScreen(element.x, element.y);

        // Set font and style
        this.ctx.font = `${14 * this.viewport.zoom}px "JetBrains Mono", monospace`;
        this.ctx.fillStyle = element.color || '#ffffff';
        this.ctx.textBaseline = 'top';

        // Render text with word wrap
        this.renderText(element.text, screenPos.x, screenPos.y, element.width * this.viewport.zoom);
    }

    renderText(text, x, y, maxWidth) {
        const lines = text.split('\n');
        const lineHeight = 20 * this.viewport.zoom;

        lines.forEach((line, index) => {
            this.ctx.fillText(line, x, y + (index * lineHeight), maxWidth);
        });
    }

    pan(deltaX, deltaY) {
        this.viewport.x -= deltaX / this.viewport.zoom;
        this.viewport.y -= deltaY / this.viewport.zoom;
        this.isDirty = true;
    }

    zoom(factor, centerX, centerY) {
        const oldZoom = this.viewport.zoom;
        const newZoom = Math.max(0.1, Math.min(5, oldZoom * factor));

        if (newZoom !== oldZoom) {
            // Zoom towards cursor position
            const worldPoint = this.screenToWorld(centerX, centerY);

            this.viewport.zoom = newZoom;

            const newWorldPoint = this.screenToWorld(centerX, centerY);
            this.viewport.x += worldPoint.x - newWorldPoint.x;
            this.viewport.y += worldPoint.y - newWorldPoint.y;

            this.isDirty = true;
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.viewport.zoom + this.viewport.x,
            y: screenY / this.viewport.zoom + this.viewport.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.viewport.x) * this.viewport.zoom,
            y: (worldY - this.viewport.y) * this.viewport.zoom
        };
    }

    addElement(element) {
        this.elements.set(element.id, element);
        this.isDirty = true;
    }

    removeElement(id) {
        this.elements.delete(id);
        this.isDirty = true;
    }

    updateElement(id, updates) {
        const element = this.elements.get(id);
        if (element) {
            Object.assign(element, updates);
            this.isDirty = true;
        }
    }

    resetView() {
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        this.isDirty = true;
    }

    getViewport() {
        return { ...this.viewport };
    }

    setState(viewport) {
        this.viewport = { ...viewport };
        this.isDirty = true;
    }

    handleResize() {
        this.setupCanvas();
        this.isDirty = true;
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export default InfiniteCanvas;
