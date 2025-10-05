/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginUI(): Chainable<void>;
    }
  }
}

/**
 * Logs in through the UI using creds from cypress.env.json
 */
Cypress.Commands.add("loginUI", () => {
  const email = Cypress.env("USER_EMAIL");
  const password = Cypress.env("USER_PASSWORD");

  cy.visit("/login");
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password, { log: false });
  cy.contains("button", /sign in/i).click();

  // Wait for a page that indicates we’re in (dashboard or pets)
  cy.contains(/dashboard|pets/i, { timeout: 15000 }).should("be.visible");
});

export {};
