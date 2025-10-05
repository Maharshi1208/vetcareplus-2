import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",        // change if your dev server uses another port
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
    viewportWidth: 1440,
    viewportHeight: 900,
    video: true,
    screenshotsFolder: "qa/artifacts/cypress/screenshots",
    videosFolder: "qa/artifacts/cypress/videos",
    downloadsFolder: "qa/artifacts/cypress/downloads",
  },
  reporter: "junit",
  reporterOptions: {
    mochaFile: "qa/artifacts/cypress/junit/results-[hash].xml",
    toConsole: true,
  },
});
