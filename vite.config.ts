import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    globals: true,
    coverage: {
      provider: 'c8',
      reports: ['text', 'html'],
      exclude: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/src/test/**']
    }
  }
});
