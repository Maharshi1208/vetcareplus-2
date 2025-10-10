// src/pages/Owners.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiGet, apiDelete, ApiError } from "../services/api";

type FlashState = { type: "success" | "error" | "info"; message: string };
type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
};

function statusBadge(s: Row["status"]) {
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
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  async function loadOwners() {
    const res = await apiGet<{ ok: boolean; owners?: any[]; error?: string }>("/owners");
    if (!res.ok || !Array.isArray(res.owners)) {
      throw new Error(res.error || "Failed to load owners");
    }
    const mapped: Row[] = res.owners.map((o: any) => ({
      id: o.id,
      name: (o.name ?? "").trim() || o.email,
      email: o.email,
      phone: (o.phone ?? "").trim() || "—",
      status: o.suspended ? "Inactive" : "Active",
    }));
    setRows(mapped);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadOwners();
      } catch (e: any) {
        console.error("Failed to load owners:", e);
        setRows([]);
        setFlash({ type: "error", message: e?.message ?? "Failed to load owners" });
      }
    })();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this owner?")) return;
    try {
      const res = await apiDelete<unknown>(`/owners/${id}`);
      // 204 has no body; request() already throws on !ok, so reaching here is success
      setRows((r) => r.filter((x) => x.id !== id));
      setFlash({ type: "success", message: "Owner deleted" });
    } catch (err: any) {
      const msg = (err as ApiError)?.data?.error || (err as ApiError)?.message || "Delete failed";
      alert(msg);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((o) =>
      [o.name, o.email, o.phone, o.status].join(" ").toLowerCase().includes(s)
    );
  }, [q, rows]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Owners</h1>
          <p className="text-sm text-gray-500">Manage owner profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{rows.length}</span>
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
        <div className={`mt-4 flex items-start justify-between rounded-xl border p-3 text-sm ${
          flash.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : flash.type === "error"
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-blue-200 bg-blue-50 text-blue-800"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${
              flash.type === "success" ? "bg-green-500" : flash.type === "error" ? "bg-red-500" : "bg-blue-500"
            }`} />
            <span className="font-medium">{flash.message}</span>
          </div>
          <button
            onClick={() => setFlash(null)}
            className="rounded-md px-2 py-1 hover:bg-white/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & table (unchanged visuals) */}
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
                        <td className="px-4 py-3">{o.email}</td>
                        <td className="px-4 py-3">{o.phone}</td>
                        <td className="px-4 py-3">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/owners/${o.id}`}
                              className="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-1 text-sm text-white shadow-sm hover:opacity-90"
                            >
                              View
                            </Link>
                            <Link
                              to={`/owners/${o.id}/edit`}
                              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-sm text-white shadow-sm hover:opacity-90"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(o.id)}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
