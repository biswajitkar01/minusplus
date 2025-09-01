// About page background animation — lightweight, 60fps-friendly
// Draws drifting plus/minus glyphs with parallax-like motion

const canvas = document.getElementById('about-canvas');
const ctx = canvas.getContext('2d');
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let width = 0, height = 0;
let rafId = 0;

function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const NUM_SYMBOLS = 56; // small count for perf, slightly denser
const symbols = [];

function init() {
    resize();
    symbols.length = 0;
    for (let i = 0; i < NUM_SYMBOLS; i++) {
        symbols.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            size: 10 + Math.random() * 18,
            type: Math.random() > 0.5 ? '+' : '−',
            alpha: 0.06 + Math.random() * 0.08
        });
    }
}

function step() {
    ctx.clearRect(0, 0, width, height);
    // very subtle vignette to blend with page bg without obscuring gradients
    const g = ctx.createRadialGradient(width * 0.5, height * 0.4, Math.min(width, height) * 0.1, width * 0.5, height * 0.6, Math.max(width, height) * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    ctx.font = '16px Inter, system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (const s of symbols) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -20) s.x = width + 20; if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20; if (s.y > height + 20) s.y = -20;
        ctx.save();
        ctx.globalAlpha = Math.min(1, s.alpha * 1.2); // ~20% brighter
        // match theme accents (fallbacks if CSS variables are unavailable)
        const plusColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-green')?.trim() || '#32cd32';
        const minusColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-red')?.trim() || '#ff4444';
        ctx.fillStyle = s.type === '+' ? plusColor : minusColor;
        ctx.font = `${s.size}px JetBrains Mono, monospace`;
        ctx.fillText(s.type, s.x, s.y);
        ctx.restore();
    }

    rafId = requestAnimationFrame(step);
}

const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function start() {
    if (mediaQuery.matches) return; // respect reduced motion
    cancelAnimationFrame(rafId);
    init();
    step();
}

function stop() {
    cancelAnimationFrame(rafId);
}

window.addEventListener('resize', () => { resize(); });
window.addEventListener('pageshow', start);
window.addEventListener('load', start);

// Pause when tab hidden to save battery
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stop();
    } else {
        start();
    }
});

// React to reduced-motion toggles live
mediaQuery.addEventListener?.('change', () => {
    if (mediaQuery.matches) {
        stop();
        ctx.clearRect(0, 0, width, height);
    } else {
        start();
    }
});
