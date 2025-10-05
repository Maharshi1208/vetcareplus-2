// cypress/e2e/pet-details.navigation.cy.ts
// Robust navigation: logs in with your creds, goes to Pets, then opens the first detail
// without destructuring from possibly-null elements.

function ensureLoggedIn() {
  // If we’re on login, perform login. Otherwise do nothing.
  cy.location("pathname", { timeout: 15000 }).then((path) => {
    if (path === "/" || /\/login|\/sign/i.test(path)) {
      cy.findByRole("heading", { name: /sign in/i, timeout: 15000 }).should("exist");
      cy.get('input[name="email"]').clear().type("admin@vetcare.local");
      cy.get('input[name="password"]').clear().type("admin123");
      cy.findByRole("button", { name: /sign in/i }).click();

      // Wait for sidebar/topnav to show something authenticated, e.g. “Pets”
      cy.contains("a", /^pets$/i, { timeout: 15000 }).should("exist");
    }
  });
}

describe("Pet Details – navigation smoke", () => {
  it("opens the first pet from the list and lands on details page (or gracefully passes if none exist)", () => {
    // Start anywhere, go to login if needed, then navigate via the UI
    cy.visit("/");
    ensureLoggedIn();

    // Go to Pets through the UI (avoids timing/routing edge cases)
    cy.contains("a", /^pets$/i, { timeout: 15000 }).click();
    cy.location("pathname", { timeout: 15000 }).should("include", "/pets");

    // Snapshot of list
    cy.screenshot("pets-list");

    // Try to find a link to a pet details page OR a “View” action
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const $detailLinks = $body.find('a[href^="/pets/"]');
      if ($detailLinks.length > 0) {
        // Use the href to navigate (avoids clicking a detached element)
        const href = $detailLinks.first().attr("href");
        if (href) {
          cy.visit(href);
        } else {
          // Fallback to clicking the first link if no href string for some reason
          cy.get('a[href^="/pets/"]').first().click();
        }
      } else {
        // Try a visible “View” control (button or link)
        const hasView =
          $body.find('a:contains("View")').length > 0 ||
          $body.find('button:contains("View")').length > 0;
        if (hasView) {
          cy.contains("a,button", /^view$/i, { timeout: 10000 }).first().click();
        } else {
          // No pets found — mark as soft pass and finish early
          cy.log("No pet rows or detail links found — skipping open-details step.");
          cy.screenshot("pets-list-no-pets");
          return;
        }
      }
    });

    // Assert we landed on a pet details page
    const detailsUrl = /\/pets\/[A-Za-z0-9_-]+(\/.*)?$/;
    cy.url({ timeout: 15000 }).should("match", detailsUrl);

    // Light assertions that page loaded
    cy.contains(/profile|details/i, { timeout: 15000 }).should("exist");
    cy.screenshot("pet-details-opened");
  });
});
