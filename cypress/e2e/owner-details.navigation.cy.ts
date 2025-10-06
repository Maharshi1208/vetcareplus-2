// cypress/e2e/owner-details.navigation.cy.ts

/** Log in only if the Sign-in screen is shown. */
function loginIfNeeded() {
  cy.findByRole('heading', { name: /sign in/i, timeout: 800 }).then(($h) => {
    if (!$h.length) return; // already authenticated
    cy.get('input[name="email"]').clear().type(Cypress.env('USER_EMAIL'));
    cy.get('input[name="password"]')
      .clear()
      .type(Cypress.env('USER_PASSWORD'), { log: false });
    cy.findByRole('button', { name: /sign in/i }).click();
    cy.findByRole('link', { name: /^owners$/i, timeout: 10000 }).should('be.visible');
  });
}

describe('Owner Details – navigation smoke', () => {
  it('opens the first owner, then opens their first pet and lands on pet details', () => {
    // Start safe, authenticate if needed
    cy.visit('/');
    loginIfNeeded();

    // Navigate via UI to Owners list
    cy.findByRole('link', { name: /^owners$/i, timeout: 10000 }).click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/owners');
    cy.screenshot('owners-list');

    // Ensure a table exists and inspect rows
    cy.get('table, [role="table"]', { timeout: 10000 }).should('exist');
    cy.get('tbody tr').then(($rows) => {
      if ($rows.length === 0) {
        cy.log('No owners present — skipping details navigation.');
        return;
      }

      // Open first owner via its "View" action
      cy.wrap($rows[0]).within(() => {
        // Prefer a "View" control; fallback to first owner link if needed
        cy.contains(/^view$/i).click({ force: true });
      });

      // Owner details page assertions (FIXED assertion style)
      cy.location('pathname', { timeout: 10000 }).should((p) => {
        expect(p).to.match(/^\/owners\/[A-Za-z0-9]+/);
      });
      cy.findByRole('button', { name: /back to owners/i, timeout: 10000 }).should('be.visible');
      cy.findByText(/owner profile|owner details/i, { timeout: 10000 }).should('exist');
      cy.screenshot('owner-details-opened');

      // --- Open the first pet from this owner (if any) ---
      // Look for a Pets section; then a "View Pet" control inside it.
      cy.contains(/pets\s*linked to this owner|^pets$/i, { timeout: 10000 })
        .parentsUntil('body')
        .parent()
        .then(($section) => {
          // Within the surrounding container, try to find the first "View Pet" button/link
          const selector = 'button, a';
          const $viewPet = $section.find(selector).filter((_, el) => {
            return /(^|\s)view\s*pet(\s|$)/i.test(el.textContent || '');
          });

          if ($viewPet.length === 0) {
            cy.log('Owner has no linked pets — skipping pet details navigation.');
            return;
          }

          // Click the first "View Pet"
          cy.wrap($viewPet[0]).click();

          // Pet details page assertions (FIXED assertion style)
          cy.location('pathname', { timeout: 10000 }).should((p) => {
            expect(p).to.match(/^\/pets\/[A-Za-z0-9]+/);
          });
          // Check for common UI bits on pet page
          cy.findByRole('button', { name: /back to pets/i, timeout: 10000 }).should('be.visible');
          cy.findByText(/pet profile|profile/i, { timeout: 10000 }).should('exist');
          cy.screenshot('owner-pet-details-opened');
    });
    });
  });
});
