import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type FlashState = { type: "success" | "error" | "info"; message: string };

type Owner = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: "Active" | "Inactive";
};

// UI-only seed data (safe to replace with real data later)
const OWNERS: Owner[] = [
  { id: "o1", name: "Alice Johnson",  email: "alice@vetcare.local",   phone: "555-2001", status: "Active" },
  { id: "o2", name: "Bob Patel",      email: "bob@vetcare.local",     phone: "555-2002", status: "Active" },
  { id: "o3", name: "Charlie Lee",    email: "charlie@vetcare.local", phone: "555-2003", status: "Inactive" },
];

function statusBadge(s: Owner["status"]) {
  const cls =
    s === "Active"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-gray-200 bg-gray-50 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {s}
    </span>
  );
}

export default function OwnersPage() {
  const [q, setQ] = useState("");

  // --- Flash banner (one-time) ---
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      // clear history state so it doesn't reappear on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return OWNERS;
    return OWNERS.filter((o) =>
      [o.name, o.email ?? "", o.phone ?? "", o.status]
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
          <h1 className="text-2xl font-semibold tracking-tight">Owners</h1>
          <p className="text-sm text-gray-500">Manage owner profiles (UI-only).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{OWNERS.length}</span>
          </span>
          <Link
            to="/owners/add"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <span className="mr-2 text-lg leading-none">＋</span>
            Add Owner
          </Link>
        </div>
      </div>

      {/* Flash banner */}
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

      {/* Search */}
      <div className="mt-5">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, phone, status…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-600">No owners found.</p>
              <Link
                to="/owners/add"
                className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
              >
                Add your first owner
              </Link>
            </div>
          ) : (
            <div className="p-2 sm:p-4">
              {/* DESKTOP — table */}
              <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filtered.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{o.name}</td>
                        <td className="px-4 py-3">{o.email ?? "—"}</td>
                        <td className="px-4 py-3">{o.phone ?? "—"}</td>
                        <td className="px-4 py-3">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/owners/${o.id}`}
                              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                            >
                              View
                            </Link>
                            <Link
                              to={`/owners/${o.id}/edit`}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => alert("UI-only: delete not wired")}
                              className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* /DESKTOP */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
