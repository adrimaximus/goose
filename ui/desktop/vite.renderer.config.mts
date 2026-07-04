import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config
export default defineConfig({
  server: {
    port: 5374,
    strictPort: true,
    watch: {
      ignored: ['.vite/**', '.vite/build/**', 'out/**', '**/.vite/**'],
      usePolling: false,
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  define: {
    'process.env.GOOSE_TUNNEL': JSON.stringify(process.env.GOOSE_TUNNEL !== 'no' && process.env.GOOSE_TUNNEL !== 'none'),
  },

  plugins: [
    tailwindcss(),
    react(),
  ],

  // Vite caches a copy of @aaif/goose-sdk and doesn't notice when we rebuild it
  // locally, so it serves stale code until you clear node_modules/.vite by hand.
  // Excluding it makes Vite always read the latest ui/sdk/dist build.
  // Dev-server only — release builds ignore optimizeDeps.
  optimizeDeps: {
    exclude: ['@aaif/goose-sdk'],
  },

  build: {
    target: 'esnext'
  }
});
