import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePets } from "../context/PetsContext";

type SpeciesKey =
  | "Dog"
  | "Cat"
  | "Bird"
  | "Rabbit"
  | "Reptile"
  | "Other"
  | string;

const SPECIES: SpeciesKey[] = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Reptile",
  "Other",
];

const BREEDS: Record<string, string[]> = {
  Dog: [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "Bulldog",
    "Poodle",
    "Beagle",
    "Other",
  ],
  Cat: ["Siamese", "Persian", "Maine Coon", "Bengal", "Sphynx", "Ragdoll", "Other"],
  Bird: ["Parakeet", "Cockatiel", "Canary", "Macaw", "Finch", "Other"],
  Rabbit: ["Holland Lop", "Netherland Dwarf", "Rex", "Lionhead", "Other"],
  Reptile: ["Bearded Dragon", "Leopard Gecko", "Corn Snake", "Turtle", "Other"],
  Other: ["Other"],
};

const COLORS = ["Black", "Brown", "White", "Golden", "Gray", "Cream", "Mixed", "Other"];
const GENDERS: Array<"MALE" | "FEMALE" | "UNKNOWN"> = ["MALE", "FEMALE", "UNKNOWN"];
const OWNERS = ["Alice", "Bob", "Charlie", "Daisy", "Other"];

const SPECIES_TO_API: Record<string, string> = {
  Dog: "Dogs",
  Cat: "Cats",
  Bird: "Birds",
  Rabbit: "Rabbits",
  Reptile: "Reptiles",
  Other: "Other",
};
function toApiSpecies(s: SpeciesKey | ""): string {
  if (!s) return "Other";
  return SPECIES_TO_API[s] ?? String(s);
}

export default function AddPetPage() {
  const navigate = useNavigate();
  const { addPet } = usePets();

  const [form, setForm] = useState({
    name: "",
    species: "" as SpeciesKey | "",
    breed: "",
    customBreed: "",
    gender: "UNKNOWN" as "MALE" | "FEMALE" | "UNKNOWN",
    color: "",
    ageYears: "",
    ageMonths: "",
    weightKg: "",
    ownerName: "",
    customOwner: "",
    microchipId: "",
    vaccinated: false,
    neutered: false,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const speciesBreeds = useMemo<string[]>(() => {
    if (!form.species || !BREEDS[form.species]) return [];
    return BREEDS[form.species];
  }, [form.species]);

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (!form.species) e.species = "Please select a species.";

    if (speciesBreeds.length > 0) {
      if (!form.breed) e.breed = "Please select a breed.";
      if (form.breed === "Other" && form.customBreed.trim().length < 2) {
        e.customBreed = "Enter a custom breed.";
      }
    }

    if (form.ownerName === "Other" && form.customOwner.trim().length < 2) {
      e.customOwner = "Enter owner name.";
    }

    if (form.ageYears !== "") {
      const y = Number(form.ageYears);
      if (!Number.isFinite(y) || y < 0 || y > 40) e.ageYears = "0–40 years.";
    }
    if (form.ageMonths !== "") {
      const m = Number(form.ageMonths);
      if (!Number.isFinite(m) || m < 0 || m > 11) e.ageMonths = "0–11 months.";
    }

    if (form.weightKg !== "") {
      const w = Number(form.weightKg);
      if (!Number.isFinite(w) || w < 0 || w > 120) e.weightKg = "0–120 kg.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const finalBreed =
      form.breed === "Other" ? form.customBreed.trim() : form.breed.trim() || undefined;
    const finalOwner =
      form.ownerName === "Other"
        ? form.customOwner.trim()
        : form.ownerName.trim() || undefined;

    const payload = {
      name: form.name.trim(),
      species: toApiSpecies((form.species as SpeciesKey) || "Other"),
      breed: finalBreed ?? null,
      gender: form.gender,
      color: form.color || undefined,
      ageYears: form.ageYears === "" ? undefined : Number(form.ageYears),
      ageMonths: form.ageMonths === "" ? undefined : Number(form.ageMonths),
      weightKg: form.weightKg === "" ? undefined : Number(form.weightKg),
      ownerName: finalOwner,
      microchipId: form.microchipId || undefined,
      vaccinated: form.vaccinated,
      neutered: form.neutered,
      notes: form.notes.trim() || undefined,
    };

    setSaving(true);
    setApiError(null);
    try {
      await addPet(payload);
      navigate("/pets", {
        state: { flash: { type: "success", message: "Pet saved" } },
      });
    } catch (e: any) {
      setApiError(e.message ?? "Failed to save pet");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setForm({
      name: "",
      species: "",
      breed: "",
      customBreed: "",
      gender: "UNKNOWN",
      color: "",
      ageYears: "",
      ageMonths: "",
      weightKg: "",
      ownerName: "",
      customOwner: "",
      microchipId: "",
      vaccinated: false,
      neutered: false,
      notes: "",
    });
    setErrors({});
    setApiError(null);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Pet</h1>
          <p className="text-sm text-gray-500">Create a new pet profile.</p>
        </div>
        <Link to="/pets" className="text-sm underline">
          ← Back to Pets
        </Link>
      </div>

      {apiError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Pet Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Name / Species */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Buddy"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Species *</label>
                <select
                  value={form.species}
                  onChange={(e) => {
                    set("species", e.target.value as SpeciesKey);
                    set("breed", "");
                    set("customBreed", "");
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">Select species…</option>
                  {SPECIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species}</p>}
              </div>
            </div>

            {/* Breed / Color */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Breed</label>
                {speciesBreeds.length > 0 ? (
                  <>
                    <select
                      value={form.breed}
                      onChange={(e) => set("breed", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                    >
                      <option value="">Select breed…</option>
                      {speciesBreeds.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed}</p>}
                    {form.breed === "Other" && (
                      <>
                        <input
                          value={form.customBreed}
                          onChange={(e) => set("customBreed", e.target.value)}
                          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                          placeholder="Enter custom breed"
                        />
                        {errors.customBreed && (
                          <p className="mt-1 text-sm text-red-600">{errors.customBreed}</p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <input
                    value={form.breed}
                    onChange={(e) => set("breed", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                    placeholder="Enter breed (optional)"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Color</label>
                <select
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">Select color…</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age / Weight */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Age (Years)</label>
                <input
                  value={form.ageYears}
                  onChange={(e) => set("ageYears", e.target.value)}
                  type="number"
                  min={0}
                  max={40}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="0"
                />
                {errors.ageYears && <p className="mt-1 text-sm text-red-600">{errors.ageYears}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Age (Months)</label>
                <input
                  value={form.ageMonths}
                  onChange={(e) => set("ageMonths", e.target.value)}
                  type="number"
                  min={0}
                  max={11}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="0–11"
                />
                {errors.ageMonths && <p className="mt-1 text-sm text-red-600">{errors.ageMonths}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Weight (kg)</label>
                <input
                  value={form.weightKg}
                  onChange={(e) => set("weightKg", e.target.value)}
                  type="number"
                  step="0.1"
                  min={0}
                  max={120}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="e.g., 4.5"
                />
                {errors.weightKg && <p className="mt-1 text-sm text-red-600">{errors.weightKg}</p>}
              </div>
            </div>

            {/* Gender / Owner / Microchip */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g[0] + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Owner</label>
                <select
                  value={form.ownerName}
                  onChange={(e) => {
                    set("ownerName", e.target.value);
                    if (e.target.value !== "Other") set("customOwner", "");
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="">Select owner…</option>
                  {OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {form.ownerName === "Other" && (
                  <>
                    <input
                      value={form.customOwner}
                      onChange={(e) => set("customOwner", e.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                      placeholder="Enter owner name"
                    />
                    {errors.customOwner && (
                      <p className="mt-1 text-sm text-red-600">{errors.customOwner}</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Microchip ID</label>
                <input
                  value={form.microchipId}
                  onChange={(e) => set("microchipId", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="e.g., 9851-0034-221A"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.vaccinated}
                  onChange={(e) => set("vaccinated", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Vaccinated</span>
              </label>

              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.neutered}
                  onChange={(e) => set("neutered", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Neutered / Spayed</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Temperament, allergies, medications…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className="rounded-xl border px-4 py-2 disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}