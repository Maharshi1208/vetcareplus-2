// src/pages/AddAppointment.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchVets,
  fetchOwners,
  fetchOwnerPets,
  type VetOption,
  type OwnerOption,
  type PetOption,
} from "../services/dropdowns";

type ApptStatus = "Booked" | "Rescheduled" | "Cancelled" | "Completed";

export default function AddAppointmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // expects { role: 'OWNER' | 'ADMIN' | 'VET', ... }

  // --- real data (was mock arrays) ---
  const [vets, setVets] = useState<VetOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);

  const [form, setForm] = useState({
    date: "",
    start: "",
    end: "",
    petId: "",
    ownerId: "", // 'me' for OWNER users
    vetId: "",
    reason: "",
    status: "Booked" as ApptStatus,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Load vets once
  useEffect(() => {
    fetchVets().then(setVets).catch(console.error);
  }, []);

  // Load owners depending on role: OWNER -> fixed "me"; ADMIN/VET -> fetch list
  useEffect(() => {
    if (user?.role === "OWNER") {
      // keep design (select remains), but prefill and lock to "me"
      setOwners([{ id: "me", name: "Me", email: "" } as OwnerOption]);
      setForm((f) => (f.ownerId ? f : { ...f, ownerId: "me" }));
    } else {
      fetchOwners()
        .then(setOwners)
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Load pets whenever ownerId changes (ownerId can be 'me' or a UUID)
  useEffect(() => {
    if (!form.ownerId) {
      setPets([]);
      setForm((f) => ({ ...f, petId: "" }));
      return;
    }
    fetchOwnerPets(form.ownerId)
      .then((items) => {
        setPets(items);
        // if current petId no longer valid, clear it
        if (items.every((p) => p.id !== form.petId)) {
          setForm((f) => ({ ...f, petId: "" }));
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ownerId]);

  const canSubmit = useMemo(() => {
    return (
      form.date.trim() &&
      form.start.trim() &&
      form.end.trim() &&
      form.petId &&
      form.ownerId &&
      form.vetId
    );
  }, [form]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.date) e.date = "Select a date.";
    if (!form.start) e.start = "Start time is required.";
    if (!form.end) e.end = "End time is required.";
    if (!form.petId) e.petId = "Select a pet.";
    if (!form.ownerId) e.ownerId = "Select an owner.";
    if (!form.vetId) e.vetId = "Select a vet.";

    // basic HH:mm check + start < end
    const tOk = /^\d{2}:\d{2}$/;
    if (form.start && !tOk.test(form.start)) e.start = "Use HH:mm format.";
    if (form.end && !tOk.test(form.end)) e.end = "Use HH:mm format.";
    if (tOk.test(form.start) && tOk.test(form.end)) {
      if (form.start >= form.end) e.end = "End time must be after start time.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    // UI-only: mock “save”, then go back with a flash banner
    // eslint-disable-next-line no-console
    console.log("AddAppointment (UI-only) submit:", form);

    navigate("/appointments", {
      state: { flash: { type: "success", message: "Appointment created" } },
    });
  }

  function onReset() {
    setForm({
      date: "",
      start: "",
      end: "",
      petId: "",
      ownerId: user?.role === "OWNER" ? "me" : "",
      vetId: "",
      reason: "",
      status: "Booked",
      notes: "",
    });
    setErrors({});
  }

  const ownerSelectDisabled = user?.role === "OWNER";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
          <p className="text-sm text-gray-500">Create a booking (UI-only).</p>
        </div>
        <Link to="/appointments" className="text-sm underline">
          ← Back to Appointments
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Appointment Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Date / Time */}
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div>
                <label className="block text-sm font-medium">Start *</label>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => set("start", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.start && <p className="mt-1 text-sm text-red-600">{errors.start}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">End *</label>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => set("end", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.end && <p className="mt-1 text-sm text-red-600">{errors.end}</p>}
              </div>
            </div>

            {/* Pet / Owner / Vet */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Pet *</label>
                <select
                  value={form.petId}
                  onChange={(e) => set("petId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">Select pet…</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Owner *</label>
                <select
                  value={form.ownerId}
                  onChange={(e) => set("ownerId", e.target.value)}
                  disabled={ownerSelectDisabled}
                  className={`mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400 ${
                    ownerSelectDisabled ? "bg-gray-100 text-gray-500" : ""
                  }`}
                >
                  <option value="">{ownerSelectDisabled ? "Me" : "Select owner…"}</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.email || o.id}
                    </option>
                  ))}
                </select>
                {errors.ownerId && <p className="mt-1 text-sm text-red-600">{errors.ownerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Vet *</label>
                <select
                  value={form.vetId}
                  onChange={(e) => set("vetId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">Select vet…</option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {errors.vetId && <p className="mt-1 text-sm text-red-600">{errors.vetId}</p>}
              </div>
            </div>

            {/* Reason / Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Reason</label>
                <input
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="e.g., Checkup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  {(["Booked", "Rescheduled", "Cancelled", "Completed"] as ApptStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Any special instructions…"
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
              Save Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
