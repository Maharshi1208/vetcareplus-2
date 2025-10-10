// src/pages/AddOwner.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost, ApiError } from "../services/api";  // <-- use your helpers

export default function AddOwnerPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email.";
    if (form.phone && !/^[0-9\-+\s()]{7,}$/.test(form.phone)) e.phone = "Invalid phone.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await apiPost<{ ok: boolean; owner?: any; error?: string }>("/owners", form);
      if (res.ok) {
        navigate("/owners", { state: { flash: { type: "success", message: "Owner saved" } } });
      } else {
        setErrors((e) => ({ ...e, _root: res.error || "Failed to save owner" }));
      }
    } catch (err: any) {
      const msg =
        (err as ApiError)?.data?.error ||
        (err as ApiError)?.message ||
        "Failed to save owner";
      setErrors((e) => ({ ...e, _root: msg }));
    } finally {
      setSubmitting(false);
    }
  }

  function onReset() {
    setForm({ name: "", email: "", phone: "", address: "", notes: "" });
    setErrors({});
  }

  return (
    <div className="p-6">
      {/* Header (unchanged) */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Owner</h1>
          <p className="text-sm text-gray-500">Create a new owner.</p>
        </div>
        <Link to="/owners" className="text-sm underline">← Back to Owners</Link>
      </div>

      {/* Card (design unchanged) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Owner Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {errors._root && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors._root}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Alice Johnson"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email / Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="alice@vetcare.local"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="555-2001"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="12 Maple St"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Preferences, reminders…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2" disabled={submitting}>
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-white shadow hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
