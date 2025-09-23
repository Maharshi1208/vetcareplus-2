import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getVet, updateVet } from "../services/vets"; // ← service layer (keep relative path)

type FormState = {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  active: boolean;
  bio: string;
};

export default function EditVetPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    active: true,
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FormState>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Fetch current vet from backend
  useEffect(() => {
    let mounted = true;
    if (!id) return;

    setLoading(true);
    setLoadError(null);

    getVet(id)
      .then((vet) => {
        if (!mounted) return;
        setForm({
          name: vet.name ?? "",
          specialty: vet.specialty ?? "",
          email: vet.email ?? "",
          phone: vet.phone ?? "",
          active: !!vet.active,
          bio: (vet as any).bio ?? "",
        });
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setLoadError("Failed to load vet. Make sure you are logged in as admin.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email.";
    if (form.phone && !/^[0-9\-+\s()]{7,}$/.test(form.phone)) e.phone = "Invalid phone.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!id) return;
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateVet(id, {
        name: form.name,
        specialty: form.specialty || null,
        email: form.email || null,
        phone: form.phone || null,
        bio: form.bio || null,
        active: form.active,
      });

      navigate("/vets", {
        state: { flash: { type: "success", message: "Vet updated" } },
      });
    } catch (err: any) {
      console.error(err);
      setSaveError("Failed to update vet. Please try again as admin.");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!id) return;
    setLoading(true);
    setErrors({});
    setSaveError(null);
    getVet(id)
      .then((vet) =>
        setForm({
          name: vet.name ?? "",
          specialty: vet.specialty ?? "",
          email: vet.email ?? "",
          phone: vet.phone ?? "",
          active: !!vet.active,
          bio: (vet as any).bio ?? "",
        })
      )
      .finally(() => setLoading(false));
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Vet</h1>
          <p className="text-sm text-gray-500">Update veterinarian profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/vets" className="text-sm underline">← Back to Vets</Link>
          <Link to={`/vets/${id}`} className="text-sm underline">View</Link>
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Vet Details</h2>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-6">
            {loading ? (
              <div className="text-sm text-gray-600">Loading…</div>
            ) : (
              <>
                {/* Name / Specialty */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                      placeholder="Dr. Jane Doe"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Specialty</label>
                    <input
                      value={form.specialty}
                      onChange={(e) => set("specialty", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                      placeholder="Surgery, Dermatology…"
                    />
                  </div>
                </div>

                {/* Email / Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                      placeholder="dr.jane@vetcare.local"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                      placeholder="555-1004"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                {/* Active */}
                <div>
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => set("active", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium">Bio / Notes</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                    placeholder="Short background, areas of interest…"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              disabled={saving || loading}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
