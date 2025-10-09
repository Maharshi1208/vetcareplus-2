import React, { useMemo, useState } from "react";
import Button from "../components/ui/Button";

export default function SettingsPage() {
  const [clinicName, setClinicName] = useState("VetCare+ Clinic");
  const [contactEmail, setContactEmail] = useState("contact@vetcare.local");
  const [phone, setPhone] = useState("(555) 123-4567");

  // Read theme once for the select’s initial value
  const initialTheme = useMemo<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  }, []);
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);

  const handleProfileSave = () => {
    alert("Profile saved (UI-only).");
  };

  const handlePreferencesSave = () => {
    try {
      localStorage.setItem("theme", theme);
      // Apply immediately on this tab
      document.documentElement.classList.toggle("dark", theme === "dark");
      // Let main.tsx (and other tabs) react too
      window.dispatchEvent(new Event("themechange"));
      alert("Preferences saved (UI-only).");
    } catch {
      alert("Failed to save preferences.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Profile */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
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
              className="mt-1 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Email
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleProfileSave}>Save Profile</Button>
        </div>
      </section>

      {/* Preferences */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Preferences
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="mt-4">
          <Button onClick={handlePreferencesSave}>Save Preferences</Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">
          Placeholder for data export/import, account deletion, etc. 
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
