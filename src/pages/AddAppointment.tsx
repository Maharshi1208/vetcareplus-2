// src/pages/AddAppointment.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../services/api";
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
  const { user } = useAuth(); // { role: 'OWNER' | 'ADMIN' | 'VET', ... }

  // dropdown data
  const [vets, setVets] = useState<VetOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);

  // form
  const [form, setForm] = useState({
    petId: "",
    vetId: "",
    ownerId: "", // 'me' for owners; real id for admins (if we show owner select)
    start: "",
    end: "",
    reason: "",
    status: "Booked" as ApptStatus, // UI-only; backend sets BOOKED on create
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.role === "OWNER";
  const showOwnerSelect = !isOwner; // keep UI minimal: only admins see Owner select

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ---- load dropdowns ----
  useEffect(() => {
    fetchVets().then(setVets).catch(() => setVets([]));
  }, []);

  useEffect(() => {
    if (isOwner) {
      setOwners([{ id: "me", name: "Me", email: "" } as OwnerOption]);
      setForm((f) => (f.ownerId ? f : { ...f, ownerId: "me" }));
    } else {
      fetchOwners()
        .then(setOwners)
        .catch(() => setOwners([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  useEffect(() => {
    if (!form.ownerId) {
      setPets([]);
      set("petId", "");
      return;
    }
    fetchOwnerPets(form.ownerId)
      .then((p) => {
        setPets(p);
        if (p.every((x) => x.id !== form.petId)) set("petId", "");
      })
      .catch(() => setPets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ownerId]);

  // ---- validation ----
  const canSubmit = useMemo(() => {
    return (
      form.petId &&
      form.vetId &&
      form.start.trim() &&
      form.end.trim() &&
      (!showOwnerSelect || form.ownerId)
    );
  }, [form, showOwnerSelect]);

  function validate() {
    const e: Record<string, string> = {};
    if (showOwnerSelect && !form.ownerId) e.ownerId = "Select an owner.";
    if (!form.petId) e.petId = "Select a pet.";
    if (!form.vetId) e.vetId = "Select a vet.";
    if (!form.start) e.start = "Start date/time is required.";
    if (!form.end) e.end = "End date/time is required.";
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) {
      e.end = "End must be after start.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ---- submit ----
  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; error?: string }>(
        "/appointments",
        {
          petId: form.petId,
          vetId: form.vetId,
          start: new Date(form.start).toISOString(),
          end: new Date(form.end).toISOString(),
          reason: form.reason || undefined,
        }
      );
      if (!res?.ok) throw new Error(res?.error || "Failed to create appointment");

      navigate("/appointments", {
        state: { flash: { type: "success", message: "Appointment created" } },
      });
    } catch (err: any) {
      alert(err?.message || "Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  }

  function onReset() {
    setForm({
      petId: "",
      vetId: "",
      ownerId: isOwner ? "me" : "",
      start: "",
      end: "",
      reason: "",
      status: "Booked",
      notes: "",
    });
    setErrors({});
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
        <Link to="/appointments" className="text-sm underline">← Back</Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Appointment Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Row 1: Pet / Vet / Status */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Pet *</label>
                <select
                  value={form.petId}
                  onChange={(e) => set("petId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">
                    {pets.length ? "Select pet…" : "— No pets found —"}
                  </option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Vet *</label>
                <select
                  value={form.vetId}
                  onChange={(e) => set("vetId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">
                    {vets.length ? "Select vet…" : "— No vets available —"}
                  </option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {errors.vetId && <p className="mt-1 text-sm text-red-600">{errors.vetId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  {(["Booked", "Rescheduled", "Cancelled", "Completed"] as ApptStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Owner (admins only) */}
            {showOwnerSelect && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">Owner *</label>
                  <select
                    value={form.ownerId}
                    onChange={(e) => set("ownerId", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  >
                    <option value="">Select owner…</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name || o.email}
                      </option>
                    ))}
                    <option value="me">Me (self)</option>
                  </select>
                  {errors.ownerId && <p className="mt-1 text-sm text-red-600">{errors.ownerId}</p>}
                </div>
              </div>
            )}

            {/* Row 2: Start / End / Reason */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium">Start *</label>
                <input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => set("start", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.start && <p className="mt-1 text-sm text-red-600">{errors.start}</p>}
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium">End *</label>
                <input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => set("end", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                />
                {errors.end && <p className="mt-1 text-sm text-red-600">{errors.end}</p>}
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium">Reason</label>
                <input
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="e.g., Checkup"
                />
              </div>
            </div>

            {/* Notes (UI only) */}
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Add notes (UI-only for now)"
              />
            </div>

            <p className="text-xs text-gray-500">
              Keep times within the vet’s availability to avoid conflicts.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`rounded-xl px-5 py-2 text-white shadow-sm ${
                canSubmit && !submitting ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
              }`}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
