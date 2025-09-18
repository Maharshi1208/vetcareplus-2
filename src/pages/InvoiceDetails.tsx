import React from "react";
import { Link, useParams } from "react-router-dom";

type InvoiceStatus = "PAID" | "DUE" | "VOID";

type Invoice = {
  id: string;
  number: string;
  date: string; // YYYY-MM-DD
  owner: string;
  pet: string;
  amount: number;
  status: InvoiceStatus;
  note?: string;
  lineItems?: Array<{ id: string; label: string; qty: number; price: number }>;
};

// Keep IDs consistent with Invoices list mock
const MOCK: Record<string, Invoice> = {
  "inv-1001": {
    id: "inv-1001",
    number: "INV-1001",
    date: "2025-09-10",
    owner: "Alice",
    pet: "Buddy",
    amount: 120.0,
    status: "PAID",
    note: "General exam + vaccination",
    lineItems: [
      { id: "li1", label: "Consultation", qty: 1, price: 60 },
      { id: "li2", label: "Vaccination", qty: 1, price: 60 },
    ],
  },
  "inv-1002": {
    id: "inv-1002",
    number: "INV-1002",
    date: "2025-09-08",
    owner: "Bob",
    pet: "Milo",
    amount: 68.5,
    status: "DUE",
    note: "Flea prevention",
    lineItems: [
      { id: "li1", label: "Medication", qty: 1, price: 68.5 },
    ],
  },
  "inv-1003": {
    id: "inv-1003",
    number: "INV-1003",
    date: "2025-08-31",
    owner: "Charlie",
    pet: "Luna",
    amount: 0,
    status: "VOID",
    note: "Cancelled appointment",
    lineItems: [],
  },
};

function statusBadge(s: InvoiceStatus) {
  const map = {
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    DUE: "border-amber-200 bg-amber-50 text-amber-700",
    VOID: "border-gray-200 bg-gray-50 text-gray-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[s]}`}>
      {s[0] + s.slice(1).toLowerCase()}
    </span>
  );
}

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const inv: Invoice =
    (id && MOCK[id]) ||
    ({
      id: id ?? "unknown",
      number: "—",
      date: "—",
      owner: "—",
      pet: "—",
      amount: 0,
      status: "DUE",
      note: "Not found (UI-only mock)",
      lineItems: [],
    } as Invoice);

  const total = inv.lineItems?.reduce((sum, li) => sum + li.qty * li.price, 0) ?? inv.amount;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice {inv.number}</h1>
          <p className="text-sm text-gray-500">Read-only UI (no API yet).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/invoices/${inv.id}/edit`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link to="/invoices" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Back to Invoices
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Summary</h2>
        </div>
        <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Invoice #</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{inv.number}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Date</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{inv.date}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Owner</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{inv.owner}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Pet</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{inv.pet}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="mt-1">{statusBadge(inv.status)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Amount</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">${total.toFixed(2)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Notes</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{inv.note ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Line Items</h2>
        </div>
        <div className="p-4 sm:p-6">
          {inv.lineItems && inv.lineItems.length > 0 ? (
            <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-left text-sm text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {inv.lineItems.map((li) => (
                    <tr key={li.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{li.label}</td>
                      <td className="px-4 py-3">{li.qty}</td>
                      <td className="px-4 py-3">${li.price.toFixed(2)}</td>
                      <td className="px-4 py-3">${(li.qty * li.price).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-semibold" colSpan={3}>
                      Total
                    </td>
                    <td className="px-4 py-3 font-semibold">${total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No line items.</div>
          )}
        </div>
      </div>
    </div>
  );
}
