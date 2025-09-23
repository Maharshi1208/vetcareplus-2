import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getVet,
  listAvailability,
  createAvailability,
  deleteAvailability,
} from "../services/vets";

type VetView = {
  id: string;
  name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  bio: string | null;
};

type Slot = {
  id: string;
  vetId: string;
  weekday: number;      // 0..6 (0=Sun)
  startMinutes: number; // e.g., 540
  endMinutes: number;   // e.g., 720
};

function statusBadge(ok: boolean) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (ok
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-50 text-gray-700 border border-gray-200")
      }
    >
      {ok ? "Active" : "Inactive"}
    </span>
  );
}

function mmToHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// UI shows Mon..Sun; backend uses 0=Sun..6
const UI_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const UI_IDX_TO_BACKEND: Record<number, number> = {
  0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0,
};

export default function VetDetailsPage() {
  const { id = "" } = useParams();

  const [vet, setVet] = useState<VetView | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Add-slot mini form
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<{ weekday: number; start: string; end: string }>({
    weekday: 1, // Mon
    start: "09:00",
    end: "12:00",
  });

  const reloadSlots = useCallback(async () => {
    const a = await listAvailability(id);
    setSlots(a);
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const v = await getVet(id);
        const a = await listAvailability(id);

        if (!mounted) return;

        setVet({
          id: v.id,
          name: v.name ?? "",
          specialty: v.specialty ?? null,
          email: v.email ?? null,
          phone: v.phone ?? null,
          active: !!v.active,
          bio: (v as any).bio ?? null,
        });
        setSlots(a);
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Failed to load vet details. Are you logged in as admin?");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  const slotsByDay = useMemo(() => {
    const by: Record<number, Slot[]> = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };
    for (const s of slots) by[s.weekday]?.push(s);
    for (const k of Object.keys(by)) {
      const idx = Number(k);
      by[idx] = by[idx].sort((a, b) => a.startMinutes - b.startMinutes);
    }
    return by;
  }, [slots]);

  async function onAddSlot(e: React.FormEvent) {
    e.preventDefault();
    setAddErr(null);
    setAdding(true);
    try {
      // simple validation (HH:MM strings, start < end)
      if (!addForm.start || !addForm.end) throw new Error("Start and end time are required.");
      if (addForm.start >= addForm.end) throw new Error("End time must be after start time.");

      await createAvailability(id, {
        weekday: addForm.weekday,
        start: addForm.start,
        end: addForm.end,
      });
      await reloadSlots();
    } catch (ex: any) {
      console.error(ex);
      setAddErr(ex?.message || "Failed to add slot.");
    } finally {
      setAdding(false);
    }
  }

  async function onDeleteSlot(slotId: string) {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await deleteAvailability(id, slotId);
      await reloadSlots();
    } catch (ex) {
      console.error(ex);
      alert("Failed to delete slot.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vet?.name || "Vet Details"}</h1>
          <p className="text-sm text-gray-500">Veterinarian profile.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vets" className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">
            ← Back to Vets
          </Link>
          <Link
            to={`/vets/${id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Edit Vet
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Profile</h2>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading…</div>
        ) : vet ? (
          <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Specialty</div>
              <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.specialty ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="mt-1">{statusBadge(vet.active)}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Bio / Notes</div>
              <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2 whitespace-pre-wrap">
                {vet.bio ?? "—"}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-600">No vet found.</div>
        )}
      </div>

      {/* Availability card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Weekly Availability</h2>
        </div>

        {/* Minimal add form (compact, keeps your design) */}
        <form onSubmit={onAddSlot} className="flex flex-wrap items-end gap-3 border-b p-4">
          <div>
            <label className="block text-xs text-gray-500">Day</label>
            <select
              value={addForm.weekday}
              onChange={(e) => setAddForm((f) => ({ ...f, weekday: Number(e.target.value) }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            >
              {UI_DAYS.map((label, uiIdx) => (
                <option key={label} value={UI_IDX_TO_BACKEND[uiIdx]}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Start</label>
            <input
              type="time"
              value={addForm.start}
              onChange={(e) => setAddForm((f) => ({ ...f, start: e.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">End</label>
            <input
              type="time"
              value={addForm.end}
              onChange={(e) => setAddForm((f) => ({ ...f, end: e.target.value }))}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add Slot"}
          </button>

        </form>

        {addErr && (
          <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {addErr}
          </div>
        )}

        {/* Grid of days/slots (click a slot to delete) */}
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading…</div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {UI_DAYS.map((label, uiIdx) => {
                const backendDay = UI_IDX_TO_BACKEND[uiIdx];
                const daySlots = slotsByDay[backendDay] || [];
                return (
                  <div key={label} className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-xs text-gray-500">{label}</div>
                    {daySlots.length === 0 ? (
                      <div className="text-sm mt-1">—</div>
                    ) : (
                      <div className="mt-1 flex flex-col gap-1">
                        {daySlots.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onDeleteSlot(s.id)}
                            title="Click to delete"
                            className="text-left rounded-md border bg-white px-2 py-1 text-sm hover:bg-red-50"
                          >
                            {mmToHHMM(s.startMinutes)}–{mmToHHMM(s.endMinutes)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
