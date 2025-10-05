// cypress/e2e/add-pet.validation.cy.ts

describe("Add Pet – basic validation (safe)", () => {
  const email = Cypress.env("USER_EMAIL") || "admin@example.com";
  const password = Cypress.env("USER_PASSWORD") || "changeme";

  it("keeps you on /pets/add when required fields are empty", () => {
    // 1) Log in via the UI (no backend stubs, no code changes)
    cy.visit("/login");

    // Fill login form (selectors use name attrs from your login page)
    cy.get('input[name="email"]').should("be.visible").type(email);
    cy.get('input[name="password"]').should("be.visible").type(password, { log: false });
    cy.contains("button", /sign in/i).click();

    // Wait until we see the logged-in shell (sidebar or any post-login marker)
    cy.contains(/dashboard|pets|appointments/i, { timeout: 15000 }).should("be.visible");

    // 2) Go to Add Pet
    cy.visit("/pets/add");
    cy.url().should("include", "/pets/add");
    cy.contains(/add pet/i).should("be.visible");

    // 3) Submit immediately with required fields empty
    // Use the primary submit button (more robust than label text)
    cy.get('button[type="submit"]').first().click({ force: true });

    // 4) Expect we’re still on the page (i.e., client-side validation blocked submit)
    cy.url().should("include", "/pets/add");

    // Optional: look for a generic validation cue if your UI shows one
    // This is intentionally broad so it won’t be flaky across themes
    cy.contains(/required|please select|must enter/i).should("exist");
    cy.screenshot("add-pet-validation-page");

  });
});
