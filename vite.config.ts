import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This must match your repository name for GitHub Pages to work.
  // Based on your package.json homepage: https://jckraus1.github.io/Crew-Connect
  base: '/Crew-Connect/',
  define: {
    // Polyfill process.env to prevent crashes in libraries that expect it (like the AI SDK)
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssCodeSplit: false
  }
});