/// <reference types="cypress" />

import "@testing-library/cypress/add-commands";
import "./commands";

afterEach(function () {
  const t = this.currentTest as Mocha.Test | undefined;
  if (!t || t.state !== "passed") return;

  // Build a readable name like: "Suite -- Nested Suite -- Test"
  const parts = typeof t.titlePath === "function" ? t.titlePath() : [t.title];
  const name = parts.join(" -- ");

  // Capture just the viewport for concise screenshots
  cy.screenshot(name, { capture: "viewport" });
});
