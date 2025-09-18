import React, { useState } from "react";

export default function SettingsPage() {
  // UI-only local state
  const [orgName, setOrgName] = useState("VetCare+ Clinic");
  const [orgEmail, setOrgEmail] = useState("contact@vetcare.local");
  const [orgPhone, setOrgPhone] = useState("(555) 123-4567");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    // UI-only: pretend to save
    // eslint-disable-next-line no-alert
    alert("Saved (UI-only)");
  }

  function onSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    // UI-only: pretend to save
    // eslint-disable-next-line no-alert
    alert(`Theme set to: ${theme} (UI-only)`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500">Manage clinic details and preferences (UI-only).</p>
      </div>

      {/* Organization Profile */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Organization Profile</h2>
        </div>
        <form onSubmit={onSaveProfile} className="p-4 sm:p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Clinic Name</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contact Email</label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                value={orgPhone}
                onChange={(e) => setOrgPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Preferences</h2>
        </div>
        <form onSubmit={onSavePrefs} className="p-4 sm:p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                (UI-only) In a later step, we’ll hook this to Tailwind’s dark mode.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone (placeholder) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Danger Zone</h2>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-sm text-gray-600">
            Placeholder for data export/import, account deletion, etc. (UI-only).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Export data (UI-only)</button>
            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Import data (UI-only)</button>
            <button className="rounded-xl border px-4 py-2 text-rose-700 hover:bg-rose-50">
              Delete account (disabled)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
