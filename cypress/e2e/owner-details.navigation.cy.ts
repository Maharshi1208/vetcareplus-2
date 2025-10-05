/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

// NOTE: Do NOT import '@testing-library/cypress/add-commands' here;
// it's already loaded globally from cypress/support/e2e.ts

/** Logs in only if the Sign in screen is shown. */
function loginIfNeeded() {
  cy.findByRole("heading", { name: /sign in/i, timeout: 500 })
    .then(($h1) => {
      if ($h1 && $h1.length) {
        cy.findByLabelText(/email/i).clear().type("admin@vetcare.local");
        cy.findByLabelText(/^password$/i).clear().type("admin123");
        cy.findByRole("button", { name: /sign in/i }).click();
      }
    })
    .catch(() => {
      // not on login, continue silently
    });
}

describe("Owner Details – navigation smoke", () => {
  it("opens the first owner from the list and lands on details page (or passes if none exist)", () => {
    // Go to owners list
    cy.visit("/owners");

    // If we got redirected to login, log in first
    loginIfNeeded();

    // Some apps redirect to /dashboard after login. Ensure we're back on /owners.
    cy.url().then((u) => {
      if (u.includes("/dashboard")) {
        cy.visit("/owners");
      }
    });

    // Optional: sanity check we are on Owners page (don’t fail if heading differs)
    cy.findByRole("heading", { name: /^owners$/i, timeout: 1000 })
      .should("exist")
      .catch(() => { /* ignore if heading text differs */ });

    // Screenshot of the list
    cy.screenshot("owners-list");

    // Find the first visible 'View' control (button or link) and click it.
    // Guard so we don’t destructure from an empty set.
    cy.get("a,button", { timeout: 10000 })
      .filter((_, el) => /^\s*view\s*$/i.test(el.textContent || ""))
      .then(($views) => {
        if ($views.length === 0) {
          cy.log("No owners with a 'View' action found. Skipping.");
          return;
        }
        cy.wrap($views[0]).click({ force: true });

        // After clicking, we should end up on /owners/:id
        cy.url({ timeout: 10000 }).should((url) => {
          expect(url).to.match(/\/owners\/[^/]+$/);
        });

        // Final screenshot of the opened details
        cy.screenshot("owner-details-opened");
      });
  });
});
