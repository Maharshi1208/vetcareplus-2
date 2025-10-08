// cypress/e2e/dashboard.cy.ts

const TEST_EMAIL = 'admin@vetcare.local';
const TEST_PASSWORD = 'admin123';

const ensureLoggedIn = () => {
  cy.get('body', { timeout: 15000 }).then(($body) => {
    const onLogin =
      $body.find('input[name="email"]').length > 0 &&
      $body.find('input[name="password"]').length > 0;

    if (!onLogin) return;

    cy.findByLabelText(/email/i, { timeout: 10000 }).clear().type(TEST_EMAIL);
    cy.findByLabelText(/^password$/i, { timeout: 10000 }).clear().type(TEST_PASSWORD);
    cy.findByRole('button', { name: /sign in/i, timeout: 10000 }).click();

    cy.location('pathname', { timeout: 20000 }).should((p) => {
      expect(p).to.not.include('/login');
    });
  });
};

describe('Dashboard – smoke', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('opens /dashboard (after login if needed) and shows core nav links', () => {
    // Go directly
    cy.visit('/dashboard');

    // Login if redirected
    ensureLoggedIn();

    // If we’re not on /dashboard, try visiting it explicitly
    cy.location('pathname', { timeout: 15000 }).then((p) => {
      if (p !== '/dashboard') {
        cy.visit('/dashboard');
      }
    });

    // If the app still didn’t route, try hitting the sidebar/dashboard link if present
    cy.get('body', { timeout: 10000 }).then(($body) => {
      if (cy.$$('a[href^="/dashboard"]', $body).length > 0) {
        cy.get('a[href^="/dashboard"]').first().click({ force: true });
      }
    });

    // Final URL assertion
    cy.location('pathname', { timeout: 15000 }).should('eq', '/dashboard');

    // Core nav links visible
    cy.get('a[href^="/owners"]', { timeout: 10000 }).should('exist');
    cy.get('a[href^="/pets"]', { timeout: 10000 }).should('exist');
    cy.get('a[href^="/appointments"]', { timeout: 10000 }).should('exist');

    // App shell exists
    cy.get('#root', { timeout: 10000 }).should('exist');

    cy.screenshot('dashboard');
  });
});
