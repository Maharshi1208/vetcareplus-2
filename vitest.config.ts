// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Load both the existing test setup and the a11y (axe) setup
    setupFiles: [
      './src/test/setup.ts',
      './src/test/setup-a11y.ts',
    ],
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
      reporter: ['text', 'html'],

      // To only show coverage for the files we actually tested today
      all: false, // only instrument files imported by tests
      include: [
        'src/pages/Login.tsx',
        'src/pages/Vets.tsx',
        'src/pages/Owners.tsx',
        'src/pages/PetDetails.tsx',
        'src/pages/Appointments.tsx',
        'src/utils/authHeaders.ts',
      ],

      // Keep excluding stuff we don't care about
      exclude: [
        'backend/**',
        'qa/**',
        '**/*.d.ts',
        'src/test/**',
        'src/**/__mocks__/**',
        // 'src/main.tsx',
        // 'src/App.tsx',
      ],
      // thresholds: { lines: 0, functions: 0, statements: 0, branches: 0 },
    },
  },
});
