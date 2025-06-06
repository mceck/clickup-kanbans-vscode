import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'app',
        dir: 'dist/compiled',
        entryFileNames: 'kanban.js',
        assetFileNames: 'kanban.css',
      },
    },
  },
  plugins: [
    tailwindcss(),
    svelte({
      onwarn: (warning, handler) => {
        if (warning.code.startsWith('a11y')) {
          // ignore a11y warnings
          return;
        }
        handler(warning);
      },
    }),
  ],
});
