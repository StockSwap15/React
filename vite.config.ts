import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|webp|svg)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false,
              },
            },
          },
          'removeDimensions',
          'removeScriptElement',
          'removeStyleElement',
        ],
      },
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: false,
        quality: 80,
        method: 6,
      },
    }),
    process.env.ANALYZE === 'true' ? visualizer({
      filename: './docs/bundle.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }) : undefined
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    }
  },
  base: '/',
  server: {
    port: 5173,
    strictPort: false,
    host: true
  },
  build: {
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          // Core dependencies
          'react-core': [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'lucide-react'
          ],
          // Router and auth dependencies
          'router-auth': [
            'react-router-dom',
            '@supabase/supabase-js',
            './src/lib/auth.ts',
            './src/lib/AuthProvider.tsx'
          ],
          // Store dependencies
          'store-core': [
            './src/lib/store.ts',
            './src/lib/refetchStore.ts'
          ],
          // Individual stores
          'stores': [
            './src/stores/listingStore.ts',
            './src/stores/notificationStore.ts',
            './src/stores/adminStore.ts',
            './src/stores/useAuthStore.ts'
          ],
          // Hooks
          'hooks': [
            './src/hooks/useListings.ts'
          ]
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  }
});