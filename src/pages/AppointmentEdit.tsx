import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getAppointment,
  listAppointments,
  rescheduleAppointment,
  type Appointment,
} from "../services/appointments";

// ---- helpers to format/parsing Toronto local ----
function toTorontoDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Toronto" }); // YYYY-MM-DD
}
function toTorontoTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }); // HH:mm
}
function toTorontoDateTimeStr(iso: string): string {
  return `${toTorontoDate(iso)} ${toTorontoTime(iso)}`; // "YYYY-MM-DD HH:mm"
}
function splitDateTime(s: string): { date: string; time: string } {
  const m = s.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
  if (!m) throw new Error("Use format: YYYY-MM-DD HH:mm");
  return { date: m[1], time: m[2] };
}

export default function AppointmentEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [startStr, setStartStr] = useState(""); // "YYYY-MM-DD HH:mm"
  const [endStr, setEndStr] = useState("");     // "YYYY-MM-DD HH:mm"

  // ---- load appointment with fallback ----
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        try {
          const a = await getAppointment(id);
          if (!alive) return;
          setAppt(a);
          setStartStr(toTorontoDateTimeStr(a.start));
          setEndStr(toTorontoDateTimeStr(a.end));
        } catch {
          // Fallback via list (note: pageSize <= 100 per backend schema)
          const list = await listAppointments({ page: 1, pageSize: 100 });
          const a = list.appointments.find((x) => x.id === id);
          if (!alive) return;
          if (!a) throw new Error("Not found");
          setAppt(a);
          setStartStr(toTorontoDateTimeStr(a.start));
          setEndStr(toTorontoDateTimeStr(a.end));
        }
      } catch (e) {
        if (alive) setErr("Failed to load appointment.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave() {
    try {
      if (!startStr || !endStr) {
        alert("Please fill both Start and End (YYYY-MM-DD HH:mm)");
        return;
      }
      if (!appt) return;
      if (appt.status !== "BOOKED") {
        alert("Only BOOKED appointments can be rescheduled.");
        return;
      }
      const { date: sDate, time: sTime } = splitDateTime(startStr);
      const { date: eDate, time: eTime } = splitDateTime(endStr);
      if (sDate !== eDate) {
        alert("Start and End must be on the same day.");
        return;
      }
      await rescheduleAppointment(id, { date: sDate, start: sTime, end: eTime });
      navigate("/appointments", {
        state: { flash: { type: "success", message: "Appointment rescheduled" } },
      });
    } catch (e: any) {
      console.error(e);
      alert(
        e?.message ||
          "Reschedule failed. Ensure time is inside the vet's availability and not conflicting."
      );
    }
  }

  const saveDisabled = loading || !appt || appt.status !== "BOOKED";

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/appointments" className="hover:underline">Appointments</Link>
        <span>/</span>
        <span className="text-gray-700">Edit</span>
        {id ? <span className="ml-1 text-gray-400">({id})</span> : null}
      </div>

      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Appointment</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className={`px-4 py-2 rounded-xl ${
              saveDisabled
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
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

      {/* Error banner */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Card — design preserved */}
      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        {/* Row 1: Pet / Vet / Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pet</label>
            <input
              disabled
              value={appt?.pet?.name ?? "(—)"}
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vet</label>
            <input
              disabled
              value={appt?.vet?.name ?? "(—)"}
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <input
              disabled
              value={appt?.status ?? "(—)"}
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
        </div>

        {/* Row 2: Start / End / Reason */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start</label>
            <input
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End</label>
            <input
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reason</label>
            <input
              disabled
              value={appt?.reason ?? "—"}
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
        </div>

        {/* Notes (still disabled) */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea
            disabled
            rows={4}
            className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
            defaultValue="This is a placeholder UI. No API connected for notes."
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Keep times within the vet’s availability to avoid conflicts.
      </p>
    </div>
  );
}
