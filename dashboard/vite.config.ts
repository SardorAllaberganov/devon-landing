import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  // The GitHub repo is `SardorAllaberganov/devon-landing`, so the live URL
  // prefix is `/devon-landing/dashboard/`. If the repo gets renamed (e.g.
  // back to `Devon`), update this AND the favicon href in `index.html` AND
  // the comment in `public/404.html` together.
  base: '/devon-landing/dashboard/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: '/devon-landing/dashboard/',
  },
  // Force the dev server to pre-bundle all @dnd-kit packages together in
  // one chunk so they share the same React instance. Without this, adding
  // a new @dnd-kit/* package while the dev server is running can land it
  // in a separate optimized bundle with its own React reference, causing
  // "Invalid hook call" + "Cannot read properties of null (reading
  // 'useContext')" crashes from inside SortableContext.
  optimizeDeps: {
    include: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  },
});
