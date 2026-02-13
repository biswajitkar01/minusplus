import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * Vite plugin to make the build output work from file:// protocol.
 * - Removes type="module" and crossorigin attributes from script tags
 * - Wraps the ES module code in an IIFE so top-level import/export are eliminated
 */
function portablePlugin() {
    return {
        name: 'portable-file-protocol',
        enforce: 'post',
        generateBundle(options, bundle) {
            // Transform the JS bundle to wrap in IIFE (removes top-level export)
            for (const [fileName, chunk] of Object.entries(bundle)) {
                if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
                    // Remove any export default / export statements and wrap in IIFE
                    let code = chunk.code;
                    // Remove export default statements
                    code = code.replace(/export\s*\{\s*\w+\s+as\s+default\s*\}\s*;?/g, '');
                    code = code.replace(/export\s+default\s+\w+\s*;?/g, '');
                    // Wrap in IIFE
                    chunk.code = `(function(){\n${code}\n})();`;
                }
            }
        },
        transformIndexHtml(html) {
            // Remove type="module" and crossorigin from script tags
            html = html.replace(/ type="module"/g, '');
            html = html.replace(/ crossorigin/g, '');
            // Point manifest to root-level portable manifest (with relative paths)
            html = html.replace('./assets/manifest.webmanifest', './manifest.webmanifest');
            return html;
        },
        closeBundle() {
            const distDir = resolve(__dirname, 'dist');
            const portableDir = resolve(__dirname, 'portable');
            const assetsDir = resolve(distDir, 'assets');
            const srcAssetsDir = resolve(__dirname, 'src/assets');

            // Fix manifest path in the final HTML (Vite rewrites it after transformIndexHtml)
            const indexPath = resolve(distDir, 'index.html');
            if (existsSync(indexPath)) {
                let html = readFileSync(indexPath, 'utf-8');
                html = html.replace('./assets/manifest.webmanifest', './manifest.webmanifest');
                writeFileSync(indexPath, html);
                console.log('  Fixed manifest path in index.html');
            }

            // Copy launcher scripts to dist root
            const filesToCopy = [
                { src: resolve(portableDir, 'start.bat'), dest: resolve(distDir, 'start.bat') },
                { src: resolve(portableDir, 'start.command'), dest: resolve(distDir, 'start.command') },
                { src: resolve(portableDir, 'sw.js'), dest: resolve(distDir, 'sw.js') },
                { src: resolve(portableDir, 'manifest.webmanifest'), dest: resolve(distDir, 'manifest.webmanifest') },
            ];

            // Copy PWA icons to dist/assets (needed for manifest)
            const iconsToCopy = [
                'web-app-manifest-192x192.png',
                'web-app-manifest-512x512.png',
            ];

            for (const { src, dest } of filesToCopy) {
                if (existsSync(src)) {
                    copyFileSync(src, dest);
                    console.log(`  Copied: ${src} → ${dest}`);
                }
            }

            for (const icon of iconsToCopy) {
                const src = resolve(srcAssetsDir, icon);
                const dest = resolve(assetsDir, icon);
                if (existsSync(src)) {
                    copyFileSync(src, dest);
                    console.log(`  Copied icon: ${icon}`);
                }
            }
        },
    };
}

export default defineConfig({
    // Use relative paths so the build works from file:// protocol
    base: './',
    build: {
        // Output to dist/ folder
        outDir: 'dist',
        // Inline all assets under 100KB (covers all favicons and icons)
        assetsInlineLimit: 100000,
        // Disable module preloading (not needed for single bundle)
        modulePreload: false,
        rollupOptions: {
            output: {
                // Single JS bundle, no code splitting
                inlineDynamicImports: true,
                // Use ES format (Vite requirement), we'll transform after
                format: 'es',
                // Clean filenames without hashes for readability
                entryFileNames: 'assets/app.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
    },
    plugins: [portablePlugin()],
});
