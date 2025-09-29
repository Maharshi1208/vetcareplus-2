// src/services/dropdowns.ts
import { apiGet } from "./api";

// ---- simple dropdown types ----
export type VetOption   = { id: string; name: string };
export type PetOption   = { id: string; name: string; ownerId: string };
export type OwnerOption = { id: string; name: string; email: string };

// ---- simple dropdown fetchers (unchanged) ----
export const fetchVets      = () => apiGet<VetOption[]>("/vets/select");
export const fetchOwnerPets = (ownerId: "me" | string = "me") =>
  apiGet<PetOption[]>(`/pets/select?ownerId=${ownerId}`);
export const fetchOwners    = () => apiGet<OwnerOption[]>("/owners/select");

// ---- owners: full rows for list/detail pages ----
export type OwnerFull = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  suspended?: boolean | null;
  address?: string | null;
  notes?: string | null;
};

/** Owners list for Admin page. Tries /owners, falls back to /owners/select. */
export async function fetchOwnersFull(): Promise<OwnerFull[]> {
  try {
    const res = await apiGet<{ ok: boolean; owners: OwnerFull[] }>("/owners");
    if (res?.ok && Array.isArray(res.owners)) return res.owners;
  } catch {
    // ignore and fall back
  }
  const sel = await fetchOwners(); // name/email only
  return sel.map((o) => ({
    id: o.id,
    name: o.name ?? null,
    email: o.email,
    phone: null,
    suspended: false,
    address: null,
    notes: null,
  }));
}

/** Single owner for details page. Tries /owners/:id, falls back to /owners/select. */
export async function fetchOwnerDetail(id: string): Promise<OwnerFull> {
  try {
    const res = await apiGet<{ ok: boolean; owner: OwnerFull }>(`/owners/${id}`);
    if (res?.ok && res.owner) return res.owner;
  } catch {
    // ignore and fall back
  }
  const sel = await fetchOwners();
  const m = sel.find((x) => x.id === id);
  if (!m) throw new Error("Owner not found");
  return {
    id: m.id,
    name: m.name ?? null,
    email: m.email,
    phone: null,
    suspended: false,
    address: null,
    notes: null,
  };
}
