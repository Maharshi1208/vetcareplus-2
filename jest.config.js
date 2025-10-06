/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.jest.json",
      diagnostics: false, // don't block on TS type errors
    },
  },

  // Make <rootDir>/src a module root
  roots: ["<rootDir>/src"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],

  // Transform TS/TSX explicitly
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/jest.global-mocks.ts",
  ],

  testMatch: ["<rootDir>/src/__tests__/**/*.test.tsx"],
};

export default config;
