import "@testing-library/cypress/add-commands";

// Simple inline login (kept here so the spec is self-contained)
const loginIfNeeded = () => {
  cy.visit("/login");
  cy.findByRole("heading", { name: /sign in/i, timeout: 10000 }).should("exist");

  const email =
    Cypress.env("USER_EMAIL") || (Cypress as any).config("env")?.USER_EMAIL;
  const password =
    Cypress.env("USER_PASSWORD") || (Cypress as any).config("env")?.USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing USER_EMAIL or USER_PASSWORD env vars for login.");
  }

  cy.findByLabelText(/email/i).clear().type(String(email));
  // avoid the “multiple matches” issue on Password by targeting the input directly
  cy.get('input[name="password"]').clear().type(String(password), { log: false });
  cy.findByRole("button", { name: /sign in/i }).click();

  cy.findByRole("heading", { name: /dashboard/i, timeout: 10000 }).should("exist");
};

describe("Appointments – list visibility", () => {
  it("navigates to Appointments via sidebar and (optionally) opens first item", () => {
    loginIfNeeded();

    // Navigate via sidebar, then confirm we're on the page
    cy.findByRole("link", { name: /^appointments$/i, timeout: 10000 }).click();
    cy.findByRole("heading", { name: /^appointments$/i, timeout: 10000 }).should(
      "exist"
    );

    // Basic shell checks
    cy.findByRole("button", { name: /calendar/i }).should("exist");
    cy.findByRole("button", { name: /new appointment/i }).should("exist");

    // Screenshot the list for artifacts
    cy.screenshot("appointments-list", { overwrite: true });

    // If the empty-state text is present, pass gracefully
    cy.contains(/no appointments match/i).then(($empty) => {
      if ($empty.length) {
        cy.log("No appointments found – passing the smoke test gracefully.");
        cy.screenshot("appointments-empty", { overwrite: true });
        return;
      }

      // Otherwise, try to open the first row
      cy.get("tbody tr").then(($rows) => {
        const hasRows = $rows && $rows.length > 0;
        if (!hasRows) {
          cy.log("No <tr> rows were found – passing gracefully.");
          return;
        }

        cy.wrap($rows[0]).within(() => {
          // Prefer a clear action button/link
          cy.contains("a,button", /^(view|details|open)$/i, { timeout: 1000 })
            .then(($btn) => {
              if ($btn && $btn.length) {
                cy.wrap($btn.first()).click({ force: true });
                return;
              }
              // Fallback: any anchor that looks like an appointment details link
              cy.get('a[href*="/appointments/"]', { timeout: 1000 })
                .first()
                .click({ force: true });
            });
        });

        // After click: either URL looks like /appointments/:id or a details heading is visible
        cy.location("pathname", { timeout: 10000 }).then((path) => {
          const looksLikeDetails =
            typeof path === "string" && /\/appointments\/[^/]+$/i.test(path);
          if (!looksLikeDetails) {
            cy.findByRole("heading", { name: /appointment/i, timeout: 5000 }).should(
              "exist"
            );
          }
        });
      });
    });
  });
});
