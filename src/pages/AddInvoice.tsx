import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type InvoiceStatus = "PAID" | "DUE" | "VOID";

export default function AddInvoicePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    number: "",
    date: "",
    owner: "",
    pet: "",
    amount: "",
    status: "DUE" as InvoiceStatus,
    note: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const canSubmit = useMemo(() => {
    return (
      form.number.trim() &&
      form.date &&
      form.owner.trim() &&
      form.pet.trim() &&
      form.amount.trim() &&
      !Number.isNaN(Number(form.amount))
    );
  }, [form]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.number.trim()) e.number = "Invoice # is required.";
    if (!form.date) e.date = "Date is required.";
    if (!form.owner.trim()) e.owner = "Owner is required.";
    if (!form.pet.trim()) e.pet = "Pet is required.";
    if (!form.amount.trim()) e.amount = "Amount is required.";
    const amt = Number(form.amount);
    if (form.amount.trim() && (!Number.isFinite(amt) || amt < 0)) {
      e.amount = "Enter a valid amount (>= 0).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    // UI-only: mock save
    // eslint-disable-next-line no-console
    console.log("AddInvoice (UI-only):", {
      ...form,
      amount: Number(form.amount),
    });

    navigate("/invoices", {
      state: { flash: { type: "success", message: "Invoice created" } },
    });
  }

  function onReset() {
    setForm({
      number: "",
      date: "",
      owner: "",
      pet: "",
      amount: "",
      status: "DUE",
      note: "",
    });
    setErrors({});
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Invoice</h1>
          <p className="text-sm text-gray-500">Create a new invoice (UI-only).</p>
        </div>
        <Link to="/invoices" className="text-sm underline">
          ← Back to Invoices
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Invoice Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Number / Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Invoice # *</label>
                <input
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  placeholder="INV-1004"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>
            </div>

            {/* Owner / Pet */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Owner *</label>
                <input
                  value={form.owner}
                  onChange={(e) => set("owner", e.target.value)}
                  placeholder="Alice"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.owner && <p className="mt-1 text-sm text-red-600">{errors.owner}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Pet *</label>
                <input
                  value={form.pet}
                  onChange={(e) => set("pet", e.target.value)}
                  placeholder="Buddy"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.pet && <p className="mt-1 text-sm text-red-600">{errors.pet}</p>}
              </div>
            </div>

            {/* Amount / Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Amount (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="120.00"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as InvoiceStatus)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  {(["PAID", "DUE", "VOID"] as InvoiceStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                rows={4}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Optional description or memo…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2">
              Reset
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-xl px-5 py-2 text-white shadow-sm ${
                canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
              }`}
            >
              Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
