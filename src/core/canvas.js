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
        this.resetView(); // Always start with centered view
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

        // Force re-render after resize to fix grid alignment
        this.isDirty = true;

        console.log('Canvas setup:', {
            viewport: { width: this.viewport.width, height: this.viewport.height },
            canvas: { width: this.canvas.width, height: this.canvas.height },
            dpr: dpr
        });
    } startRenderLoop() {
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
        // Adaptive grid system - use different grid sizes based on zoom level
        let baseGridSize = 30; // Base grid size in world units (reduced from 50)
        let opacity = 0.08;

        // When zoomed out, use larger grid spacing
        if (this.viewport.zoom < 0.5) {
            baseGridSize = 120; // Reduced from 200
            opacity = 0.06;
        } else if (this.viewport.zoom < 1) {
            baseGridSize = 60; // Reduced from 100
            opacity = 0.07;
        }

        // When zoomed in, add finer grid
        const screenGridSize = baseGridSize * this.viewport.zoom;

        this.ctx.save();
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Calculate the canvas-space coordinates of the world origin (0,0)
        const originX = -this.viewport.x * this.viewport.zoom;
        const originY = -this.viewport.y * this.viewport.zoom;

        // Calculate the offset for the first grid line using modulo
        const startX = originX % screenGridSize;
        const startY = originY % screenGridSize;

        // Draw vertical lines across the entire viewport
        for (let x = startX; x < this.viewport.width; x += screenGridSize) {
            const lineX = Math.floor(x) + 0.5;
            this.ctx.moveTo(lineX, 0);
            this.ctx.lineTo(lineX, this.viewport.height);
        }

        // Draw horizontal lines across the entire viewport
        for (let y = startY; y < this.viewport.height; y += screenGridSize) {
            const lineY = Math.floor(y) + 0.5;
            this.ctx.moveTo(0, lineY);
            this.ctx.lineTo(this.viewport.width, lineY);
        }

        this.ctx.stroke();

        // Add fine grid when zoomed in
        if (this.viewport.zoom > 2) {
            const fineGridSize = (baseGridSize / 5) * this.viewport.zoom;
            if (fineGridSize >= 8) { // Only show if not too dense
                this.ctx.strokeStyle = `rgba(255, 255, 255, 0.03)`;
                this.ctx.beginPath();

                const fineStartX = originX % fineGridSize;
                const fineStartY = originY % fineGridSize;

                for (let x = fineStartX; x < this.viewport.width; x += fineGridSize) {
                    const lineX = Math.floor(x) + 0.5;
                    this.ctx.moveTo(lineX, 0);
                    this.ctx.lineTo(lineX, this.viewport.height);
                }

                for (let y = fineStartY; y < this.viewport.height; y += fineGridSize) {
                    const lineY = Math.floor(y) + 0.5;
                    this.ctx.moveTo(0, lineY);
                    this.ctx.lineTo(this.viewport.width, lineY);
                }

                this.ctx.stroke();
            }
        }

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
        // Make zoom more gradual - reduce sensitivity
        const adjustedFactor = factor > 1 ? 1 + (factor - 1) * 0.5 : 1 - (1 - factor) * 0.5;
        const newZoom = Math.max(0.1, Math.min(5, oldZoom * adjustedFactor));

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
        // Reset to centered view with grid-aligned position
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        this.isDirty = true;
        console.log('View reset to center');
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
        // Force a complete re-render to fix any grid alignment issues
        this.isDirty = true;
        console.log('Canvas resized and grid reset');
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export default InfiniteCanvas;
