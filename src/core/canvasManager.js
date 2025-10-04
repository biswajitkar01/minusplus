// Canvas Manager
// Manages the canvas element, viewport, and drawing operations

class CanvasManager {
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.ctx = null;
        this.viewport = {
            x: 0,
            y: 0,
            zoom: 1
        };
        this.isDirty = true;

        this.init();
    }

    init() {
        this.ctx = this.canvasElement.getContext('2d');

        // Initial clear
        this.clear();
    }

    // Clear the canvas
    clear() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.viewport.x) * this.viewport.zoom,
            y: (worldY - this.viewport.y) * this.viewport.zoom
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.viewport.zoom) + this.viewport.x,
            y: (screenY / this.viewport.zoom) + this.viewport.y
        };
    }

    // Set the viewport position
    setViewport(x, y) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.isDirty = true;
    }

    // Zoom the viewport
    setZoom(zoom) {
        this.viewport.zoom = zoom;
        this.isDirty = true;
    }

    // Draw a line on the canvas
    drawLine(startX, startY, endX, endY, color = 'black', lineWidth = 1) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Draw a rectangle on the canvas
    drawRect(x, y, width, height, color = 'black', lineWidth = 1) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, width, height);
    }

    // Fill a rectangle on the canvas
    fillRect(x, y, width, height, color = 'black') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }

    // Draw a circle on the canvas
    drawCircle(x, y, radius, color = 'black', lineWidth = 1) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Fill a circle on the canvas
    fillCircle(x, y, radius, color = 'black') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw text on the canvas
    drawText(text, x, y, font = '16px sans-serif', color = 'black') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.fillText(text, x, y);
    }

    // Clear a specific rectangle area
    clearRect(x, y, width, height) {
        const ctx = this.ctx;
        ctx.clearRect(x, y, width, height);
    }

    // Request animation frame loop
    startAnimationLoop(callback) {
        const loop = () => {
            callback();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // Resize the canvas to fill its container
    resize() {
        const container = this.canvasElement.parentNode;
        this.canvasElement.width = container.clientWidth;
        this.canvasElement.height = container.clientHeight;
        this.isDirty = true;
    }

    // Canvas transform updates
    onCanvasTransform() {
        this.updateElementPositions();
    }

    // Cleanup
    destroy() {
        this.clear();
        this.canvasElement = null;
        this.ctx = null;
    }
}

export default CanvasManager;