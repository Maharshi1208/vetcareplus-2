import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    globals: true,
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
    ],
    exclude: [
      'backend/**',
      'qa/**',
      '**/node_modules/**',
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reports: ['text', 'html'],
      exclude: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/src/test/**'],
    },
  },
});
