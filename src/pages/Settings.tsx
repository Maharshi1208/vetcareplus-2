// src/pages/Settings.tsx
import React, { useState, useEffect } from "react";
import Button from "../components/ui/Button";

export default function SettingsPage() {
  const [clinicName, setClinicName] = useState("VetCare+ Clinic");
  const [contactEmail, setContactEmail] = useState("contact@vetcare.local");
  const [phone, setPhone] = useState("(555) 123-4567");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // ✅ Apply theme
  const applyTheme = (t: "light" | "dark") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // ✅ Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const handleProfileSave = () => {
    alert("Profile saved (UI-only).");
  };

  return (
    <div className="space-y-6">
      {/* Organization Profile */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Organization Profile
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Clinic Name
            </label>
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Email
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleProfileSave}>Save Profile</Button>
        </div>
      </section>

      {/* Preferences */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Preferences
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => {
              const t = e.target.value as "light" | "dark";
              setTheme(t);
              applyTheme(t); // ✅ immediately apply theme
            }}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="mt-4">
          <Button onClick={() => applyTheme(theme)}>Save Preferences</Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Placeholder for data export/import, account deletion, etc. (UI-only).
        </p>
        <div className="flex gap-2">
          <Button variant="secondary">Export data (UI-only)</Button>
          <Button variant="secondary">Import data (UI-only)</Button>
          <Button variant="danger">Delete account (disabled)</Button>
        </div>
      </section>
    </div>
  );
}
