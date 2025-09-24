import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getAppointment, type Appointment } from "../services/appointments";

type Form = {
  pet: string;
  vet: string;
  status: string;
  start: string;  // for <input type="datetime-local">  -> "YYYY-MM-DDTHH:mm"
  end: string;    // same as above
  reason: string;
  notes: string;
};

function toLocalInput(dtISO?: string) {
  if (!dtISO) return "";
  const d = new Date(dtISO);
  // format to "YYYY-MM-DDTHH:mm" in Toronto time
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-CA", opts).formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export default function AppointmentEdit() {
  const { id } = useParams();
  const isCreate = !id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);

  // Form state (editable)
  const [form, setForm] = useState<Form>({
    pet: "",
    vet: "",
    status: "",
    start: "",
    end: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (isCreate) return;
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    getAppointment(id!)
      .then((a) => {
        if (!mounted) return;
        setAppt(a);
        setForm({
          pet: a.pet?.name ?? "",
          vet: a.vet?.name ?? "",
          status: a.status ?? "",
          start: toLocalInput(a.start),
          end: toLocalInput(a.end),
          reason: a.reason ?? "",
          notes: a.notes ?? "",
        });
      })
      .catch(() => mounted && setLoadError("Failed to load appointment."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id, isCreate]);

  const title = useMemo(
    () => (isCreate ? "New Appointment" : "Edit Appointment"),
    [isCreate]
  );

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    // UI-only for now. Later:
    //  - create mode -> call createAppointment(...)
    //  - edit mode   -> call reschedule endpoint or update FN
    alert(isCreate ? "UI-only: create flow" : "UI-only: save changes");
    navigate("/appointments");
  }

  return (
    <div className="space-y-4">
      {!isCreate && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Link to="/appointments" className="hover:underline">Appointments</Link>
          <span>/</span>
          <span className="text-gray-700">Edit</span>
          <span className="ml-1 text-gray-400">({id})</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex gap-2">
          <button
            type="submit"
            form="apptForm"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            Save
          </button>
          <Link
            to="/appointments"
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {!isCreate && loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <form id="apptForm" onSubmit={onSave}>
        <div className="rounded-2xl border p-4 md:p-6 space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pet</label>
              <input
                value={form.pet}
                onChange={(e) => update("pet", e.target.value)}
                placeholder="(—)"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Vet</label>
              <input
                value={form.vet}
                onChange={(e) => update("vet", e.target.value)}
                placeholder="(—)"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <input
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                placeholder="(—)"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start</label>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => update("start", e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End</label>
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => update("end", e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Reason</label>
              <input
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Add notes (UI-only for now)"
            />
          </div>
        </div>
      </form>

      <p className="text-xs text-gray-400">
        Keep times within the vet’s availability to avoid conflicts.
      </p>
    </div>
  );
}
