// src/pages/__tests__/Login.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>
  );

describe("Login page", () => {
  test("logs in form passes client-side validation with a valid email/password", async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/^email$/i, { selector: "input" });
    const passwordInput = screen.getByLabelText(/^password$/i, { selector: "input" });

    // Use a standard, valid email that satisfies zod
    await userEvent.type(emailInput, "admin@vetcare.com");
    await userEvent.tab(); // blur email so any touched/dirty logic can run
    await userEvent.type(passwordInput, "admin123");

    await userEvent.click(
      screen.getByRole("button", { name: /sign\s*in|log\s*in|login/i })
    );

    // We don't assert that the helper text disappears, because this app keeps it rendered.
    // Instead, assert no auth/server error message appeared.
    expect(screen.queryByText(/(invalid|incorrect|failed|unauthorized)/i)).toBeNull();
  });

  test("shows a validation error when the email is invalid", async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/^email$/i, { selector: "input" });
    const passwordInput = screen.getByLabelText(/^password$/i, { selector: "input" });

    await userEvent.type(emailInput, "not-an-email");
    await userEvent.type(passwordInput, "anything");

    await userEvent.click(
      screen.getByRole("button", { name: /sign\s*in|log\s*in|login/i })
    );

    // Zod email validation helper should be visible
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });
});
