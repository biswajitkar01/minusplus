import { defineConfig } from 'vite';

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
            return html;
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
