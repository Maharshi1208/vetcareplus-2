// src/pages/AppointmentEdit.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPost } from "../services/api";
import { getAppointment, type Appointment } from "../services/appointments";
import {
  fetchVets,
  fetchOwners,
  fetchOwnerPets,
  type VetOption,
  type OwnerOption,
  type PetOption,
} from "../services/dropdowns";

type ApptStatus = "Booked" | "Rescheduled" | "Cancelled" | "Completed";

type Form = {
  petId: string;
  vetId: string;
  status: ApptStatus;
  start: string; // <input type="datetime-local"> value
  end: string;   // <input type="datetime-local"> value
  reason: string;
  notes: string;
};

function toLocalInput(dtISO?: string) {
  if (!dtISO) return "";
  // format to "YYYY-MM-DDTHH:mm" using the user's locale time zone
  const d = new Date(dtISO);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AppointmentEdit() {
  const { id } = useParams();
  const isCreate = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  // dropdown data
  const [vets, setVets] = useState<VetOption[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]); // only used to label pets for ADMIN

  // page state
  const [loading, setLoading] = useState(!isCreate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);

  // form state
  const [form, setForm] = useState<Form>({
    petId: "",
    vetId: "",
    status: "Booked",
    start: "",
    end: "",
    reason: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ---- Load vets always
  useEffect(() => {
    fetchVets().then(setVets).catch(() => setVets([]));
  }, []);

  // ---- Load pets depending on role
  useEffect(() => {
    (async () => {
      try {
        if (role === "OWNER") {
          const myPets = await fetchOwnerPets("me");
          setPets(myPets);
        } else {
          // ADMIN (and others) — build a single dropdown of all pets, labeling with owner name
          const [own, petsResp] = await Promise.all([
            fetchOwners().catch<OwnerOption[]>(() => []),
            apiGet<{ ok: boolean; pets: any[] }>("/pets").catch(() => ({ ok: false, pets: [] })),
          ]);
          setOwners(own);
          const nameByOwner: Record<string, string> = Object.fromEntries(
            own.map((o) => [o.id, o.name || o.email || o.id])
          );
          const options: PetOption[] = (petsResp?.pets ?? []).map((p: any) => ({
            id: p.id,
            ownerId: p.ownerId,
            name: p.name + (p.ownerId ? ` — ${nameByOwner[p.ownerId] ?? p.ownerId}` : ""),
          }));
          setPets(options);
        }
      } catch {
        setPets([]);
      }
    })();
  }, [role]);

  // ---- If editing, load the appointment and prefill
  useEffect(() => {
    if (isCreate) return;
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    getAppointment(id!)
      .then((a) => {
        if (!mounted) return;
        setAppt(a);
        // Try to find usable ids (prefer explicit ids, fallback to nested)
        const petId = (a as any).petId ?? a.pet?.id ?? "";
        const vetId = (a as any).vetId ?? a.vet?.id ?? "";
        setForm({
          petId,
          vetId,
          status: (a.status as ApptStatus) ?? "Booked",
          start: toLocalInput(a.start),
          end: toLocalInput(a.end),
          reason: a.reason ?? "",
          notes: a.notes ?? "",
        });
      })
      .catch(() => setLoadError("Failed to load appointment."))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id, isCreate]);

  // ---- Validate
  const canSubmit = useMemo(() => {
    return (
      form.petId &&
      form.vetId &&
      form.start.trim() &&
      form.end.trim() &&
      new Date(form.end) > new Date(form.start)
    );
  }, [form]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.petId) e.petId = "Select a pet.";
    if (!form.vetId) e.vetId = "Select a vet.";
    if (!form.start) e.start = "Start is required.";
    if (!form.end) e.end = "End is required.";
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) {
      e.end = "End must be after start.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
    }

  // ---- Save
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (!isCreate) {
      // UI-only for edit path here; wire to reschedule/cancel endpoints if desired.
      alert("UI-only: save changes (edit mode).");
      navigate("/appointments");
      return;
    }

    // Create new appointment
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

  const title = useMemo(
    () => (isCreate ? "New Appointment" : "Edit Appointment"),
    [isCreate]
  );

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
            disabled={loading || submitting || !canSubmit}
          >
            {submitting ? "Saving…" : "Save"}
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
          {/* Row 1: Pet / Vet / Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pet</label>
              <select
                value={form.petId}
                onChange={(e) => update("petId", e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="">{pets.length ? "Select pet…" : "— No pets —"}</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.petId && <p className="mt-1 text-sm text-red-600">{errors.petId}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Vet</label>
              <select
                value={form.vetId}
                onChange={(e) => update("vetId", e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="">{vets.length ? "Select vet…" : "— No vets —"}</option>
                {vets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.vetId && <p className="mt-1 text-sm text-red-600">{errors.vetId}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value as ApptStatus)}
                className="w-full rounded-xl border px-3 py-2"
              >
                {(["Booked", "Rescheduled", "Cancelled", "Completed"] as ApptStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Start / End / Reason */}
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
              {errors.start && <p className="mt-1 text-sm text-red-600">{errors.start}</p>}
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
              {errors.end && <p className="mt-1 text-sm text-red-600">{errors.end}</p>}
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
