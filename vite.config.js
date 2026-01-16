import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualEditPlugin } from './vite-plugins/visual-edit-plugin.js'
import { errorOverlayPlugin } from './vite-plugins/error-overlay-plugin.js'

import { workflow } from "workflow/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      workflow(),
      mode === 'development' && visualEditPlugin(),
      react(),
      errorOverlayPlugin(),
      {
        name: 'iframe-hmr',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Allow iframe embedding
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            res.setHeader('Content-Security-Policy', "frame-ancestors *;");
            next();
          });
        }
      }
    ].filter(Boolean),
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Treat import errors as fatal errors
          if (
            warning.code === "UNRESOLVED_IMPORT" ||
            warning.code === "MISSING_EXPORT"
          ) {
            throw new Error(`Build failed: ${warning.message}`);
          }
          // Use default for other warnings
          warn(warning);
        },
      },
    },
    server: {
      host: '0.0.0.0', // Bind to all interfaces for container access
      port: 5173,
      strictPort: false,
      // Allow all hosts - essential for Modal tunnel URLs
      allowedHosts: true,
      cors: true,
      watch: {
        // Enable polling for better file change detection in containers
        usePolling: true,
        interval: 100, // Check every 100ms for responsive HMR
      },
      // Removed forced HMR clientPort to allow auto-detection (better for hybrid local/ngrok)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    }
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      // Fix for ERR_REQUIRE_ESM in CI/CD when jsdom loads ESM-only packages
      server: {
        deps: {
          inline: ['@exodus/bytes', 'html-encoding-sniffer']
        }
      },
      poolOptions: {
        threads: {
          singleThread: true // Run sequentially to avoid race conditions in CI
        }
      }
    }
  }
});