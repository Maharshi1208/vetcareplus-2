import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock AuthContext so .Provider is defined in this test file
vi.mock("../../context/AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext(null);
  return { AuthContext };
});

import { AuthContext } from "../../context/AuthContext";
import Appointments from "../Appointments";

function renderAsAdmin(ui: React.ReactElement, initialPath = "/appointments") {
  const authValue = {
    user: { id: "admin-1", role: "admin", email: "admin@clinic.com" },
    token: "test-token",
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue as any}>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("Appointments page", () => {
  it("shows the empty-state when API returns no data (200)", async () => {
    renderAsAdmin(<Appointments />);

    // Wait for the table to appear
    const table = await screen.findByRole("table");

    // The "Total: 0" badge text is split across nodes and may render multiple times
    const totalBadges = screen.getAllByText((_, node) => {
      if (!node) return false;
      const text = (node as HTMLElement).textContent ?? "";
      return /Total:\s*0/i.test(text);
    });
    expect(totalBadges.length).toBeGreaterThan(0);

    // Header row + one empty-state row
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBe(2);

    // Empty-state message
    expect(
      screen.getByText(/No appointments match your filters/i)
    ).toBeInTheDocument();
  });
});
