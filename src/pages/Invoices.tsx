import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useMemo, useState, useEffect } from "react";

type Flash = { type: "success" | "error" | "info"; message: string };

type Invoice = {
  id: string;
  number: string;
  date: string; // YYYY-MM-DD
  owner: string;
  pet: string;
  amount: number;
  status: "PAID" | "DUE" | "VOID";
  note?: string;
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1001",
    number: "INV-1001",
    date: "2025-09-10",
    owner: "Alice",
    pet: "Buddy",
    amount: 120.0,
    status: "PAID",
    note: "General exam + vaccination",
  },
  {
    id: "inv-1002",
    number: "INV-1002",
    date: "2025-09-08",
    owner: "Bob",
    pet: "Milo",
    amount: 68.5,
    status: "DUE",
    note: "Flea prevention",
  },
  {
    id: "inv-1003",
    number: "INV-1003",
    date: "2025-08-31",
    owner: "Charlie",
    pet: "Luna",
    amount: 0,
    status: "VOID",
    note: "Cancelled appointment",
  },
];

function statusBadge(s: Invoice["status"]) {
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

export default function InvoicesPage() {
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<Flash | null>(null);

  // one-time flash (e.g., after Add/Edit)
  useEffect(() => {
    const s = (location.state as any)?.flash as Flash | undefined;
    if (s) {
      setFlash(s);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MOCK_INVOICES;
    return MOCK_INVOICES.filter((i) =>
      [
        i.number,
        i.date,
        i.owner,
        i.pet,
        i.status,
        String(i.amount),
        i.note ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500">Billing records (UI-only).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{MOCK_INVOICES.length}</span>
          </span>
          <Link
            to="/invoices/add"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <span className="mr-2 text-lg leading-none">＋</span>
            Add Invoice
          </Link>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="mt-4 flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">{flash.message}</span>
          </div>
          <button
            onClick={() => setFlash(null)}
            className="rounded-md px-2 py-1 text-green-700 hover:bg-green-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search + table */}
      <div className="mt-5">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by number, owner, pet, amount, status…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-600">No invoices found.</div>
          ) : (
            <div className="p-2 sm:p-4">
              <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Number</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Owner / Pet</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filtered.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{i.number}</td>
                        <td className="px-4 py-3">{i.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800">{i.owner}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-700">{i.pet}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">${i.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">{statusBadge(i.status)}</td>
                        <td className="px-4 py-3">
                          {i.note ? (
                            <span title={i.note}>
                              {i.note.length > 40 ? i.note.slice(0, 40) + "…" : i.note}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/invoices/${i.id}`}
                              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                            >
                              View
                            </Link>
                            <Link
                              to={`/invoices/${i.id}/edit`}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              Edit
                            </Link>
                            <button className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
