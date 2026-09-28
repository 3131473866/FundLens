import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' lets the built app run from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
