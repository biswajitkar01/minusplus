// Minimap System
// Renders a small overview of the canvas and handles navigation

class Minimap {
    constructor(canvasApp) {
        this.app = canvasApp;
        this.container = document.getElementById('minimap-container');
        this.canvas = document.getElementById('minimap-canvas');
        
        if (!this.container || !this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Settings
        this.isVisible = false;
        this.hideTimeout = null;
        this.isInteracting = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEvents();
        this.startRenderLoop();
    }
    
    startRenderLoop() {
        const render = () => {
            this.update();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
    
    setupCanvas() {
        // Safe dimensions in case CSS isn't fully active on init
        this.width = 200;
        this.height = 120;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        
        // CSS forces the display size
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        this.ctx.scale(dpr, dpr);
    }
    
    setupEvents() {
        // Handle clicking and dragging on the minimap
        const handleInteraction = (e) => {
            if (e.buttons !== 1 && e.type !== 'pointerdown') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.panToPoint(x, y);
            
            // Keep minimap visible while interacting
            this.isInteracting = true;
            this.show();
        };

        this.canvas.addEventListener('pointerdown', handleInteraction);
        this.canvas.addEventListener('pointermove', handleInteraction);
        
        window.addEventListener('pointerup', () => {
            if (this.isInteracting) {
                this.isInteracting = false;
                this.scheduleHide();
            }
        });
        
        // Prevent map interaction from bubbling up
        this.container.addEventListener('wheel', (e) => e.stopPropagation());
    }
    
    show() {
        if (!this.container) return;
        
        clearTimeout(this.hideTimeout);
        
        if (!this.isVisible) {
            this.isVisible = true;
            this.container.classList.remove('minimap-hidden');
        }
        
        this.scheduleHide();
    }
    
    scheduleHide() {
        clearTimeout(this.hideTimeout);
        
        if (!this.isInteracting) {
            this.hideTimeout = setTimeout(() => {
                this.isVisible = false;
                this.container.classList.add('minimap-hidden');
            }, 2000); // Hide after 2 seconds of inactivity
        }
    }
    
    // Calculates the world bounds encompassing all elements and viewport
    calculateBounds() {
        const viewport = this.app.canvas.viewport;
        if (!viewport) return null;
        
        // Start bounds with the current viewport
        let minX = viewport.x;
        let minY = viewport.y;
        let maxX = viewport.x + viewport.width / viewport.zoom;
        let maxY = viewport.y + viewport.height / viewport.zoom;
        
        // Incorporate all text box elements
        if (this.app.textManager && this.app.textManager.textElements) {
            this.app.textManager.textElements.forEach(element => {
                const w = (element.input.offsetWidth || 120) / viewport.zoom;
                const h = (element.input.offsetHeight || 40) / viewport.zoom;
                
                if (element.worldX < minX) minX = element.worldX;
                if (element.worldY < minY) minY = element.worldY;
                if (element.worldX + w > maxX) maxX = element.worldX + w;
                if (element.worldY + h > maxY) maxY = element.worldY + h;
            });
        }
        
        // Add padding to bounds
        const padding = 500;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        return { 
            minX, minY, maxX, maxY, 
            width: maxX - minX, 
            height: maxY - minY 
        };
    }
    
    panToPoint(minimapX, minimapY) {
        const bounds = this.calculateBounds();
        if (!bounds) return;
        
        // Map minimap click to world coordinate
        const scale = Math.min(this.width / bounds.width, this.height / bounds.height);
        
        // Center the scaled content inside the minimap
        const drawnWidth = bounds.width * scale;
        const drawnHeight = bounds.height * scale;
        const offsetX = (this.width - drawnWidth) / 2;
        const offsetY = (this.height - drawnHeight) / 2;
        
        const worldX = bounds.minX + (minimapX - offsetX) / scale;
        const worldY = bounds.minY + (minimapY - offsetY) / scale;
        
        const viewport = this.app.canvas.viewport;
        
        // Calculate new viewport position to center around worldX/worldY
        const targetViewX = worldX - (viewport.width / viewport.zoom) / 2;
        const targetViewY = worldY - (viewport.height / viewport.zoom) / 2;
        
        // Apply pan directly using setState to avoid momentum complexities
        this.app.canvas.setState({
            ...viewport,
            x: targetViewX,
            y: targetViewY
        });
        
        // Update elements to their new screen positions
        if (this.app.textManager) {
            this.app.textManager.textElements.forEach(element => {
                this.app.textManager.updateElementPosition(element);
            });
            if (this.app.syntaxHighlighter) {
                this.app.syntaxHighlighter.updateHighlightPositions();
            }
        }
    }
    
    update() {
        if (!this.isVisible && !this.isInteracting) return;
        
        const bounds = this.calculateBounds();
        if (!bounds) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate scale to fit everything preserving aspect ratio
        const scale = Math.min(this.width / bounds.width, this.height / bounds.height);
        
        // Center the drawing in the minimap
        const offsetX = (this.width - (bounds.width * scale)) / 2;
        const offsetY = (this.height - (bounds.height * scale)) / 2;
        
        // Prepare to draw
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        
        // Function to map world coordinate to scaled drawing coordinate
        const mapCoord = (x, y, w, h) => {
            return {
                x: (x - bounds.minX) * scale,
                y: (y - bounds.minY) * scale,
                w: w * scale,
                h: h * scale
            };
        };
        
        // Read theme colors
        const styles = getComputedStyle(document.documentElement);
        const blipColor = styles.getPropertyValue('--minimap-blip').trim() || '#ff4444';
        const viewStroke = styles.getPropertyValue('--minimap-viewport-stroke').trim() || 'white';
        const viewFill = styles.getPropertyValue('--minimap-viewport-fill').trim() || 'rgba(255, 255, 255, 0.1)';
        
        // 1. Draw elements
        if (this.app.textManager && this.app.textManager.textElements) {
            this.ctx.fillStyle = blipColor;
            
            this.app.textManager.textElements.forEach(element => {
                const w = element.input.offsetWidth || 120;
                const h = element.input.offsetHeight || 40;
                
                const mapped = mapCoord(element.worldX, element.worldY, w, h);
                
                // Draw filled rounded rect for visibility
                this.ctx.beginPath();
                this.ctx.roundRect(mapped.x, mapped.y, Math.max(mapped.w, 4), Math.max(mapped.h, 4), 2);
                this.ctx.fill();
            });
        }
        
        // 2. Draw viewport
        const viewport = this.app.canvas.viewport;
        const viewW = viewport.width / viewport.zoom;
        const viewH = viewport.height / viewport.zoom;
        
        const mappedView = mapCoord(viewport.x, viewport.y, viewW, viewH);
        
        this.ctx.strokeStyle = viewStroke;
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([3, 3]);
        this.ctx.strokeRect(mappedView.x, mappedView.y, mappedView.w, mappedView.h);
        
        // Filled translucent viewport area
        this.ctx.fillStyle = viewFill;
        this.ctx.fillRect(mappedView.x, mappedView.y, mappedView.w, mappedView.h);
        
        this.ctx.restore();
    }
}

export default Minimap;
