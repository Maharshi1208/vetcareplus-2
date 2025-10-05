describe("Dashboard smoke", () => {
  it("loads the home page", () => {
    // ignore unexpected 3rd-party errors so the smoke still runs
    cy.on("uncaught:exception", () => false);

    cy.visit("/");               // baseUrl comes from cypress.config.ts
    cy.get("body").should("be.visible");
    // take a screenshot artifact for your report
    cy.screenshot("dashboard-home");
  });
});
