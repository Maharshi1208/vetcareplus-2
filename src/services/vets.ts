// src/services/vets.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

export type Vet = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  bio: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type VetListResponse = { ok: true; vets: Vet[] };
export type VetResponse = { ok: true; vet: Vet };

export async function listVets(): Promise<Vet[]> {
  const data = await apiGet<VetListResponse>("/vets");
  return data.vets;
}

export async function getVet(id: string): Promise<Vet> {
  const data = await apiGet<VetResponse>(`/vets/${id}`);
  return data.vet;
}

// Availability
export type AvailSlot = {
  id: string;
  vetId: string;
  weekday: number;      // 0..6 (0=Sun)
  startMinutes: number; // e.g., 540 = 09:00
  endMinutes: number;   // e.g., 720 = 12:00
  createdAt?: string;
  updatedAt?: string;
};
export type AvailListResponse = { ok: true; availability: AvailSlot[] };
export type AvailResponse = { ok: true; slot: AvailSlot };

export async function listAvailability(vetId: string): Promise<AvailSlot[]> {
  const data = await apiGet<AvailListResponse>(`/vets/${vetId}/availability`);
  return data.availability;
}

export async function createAvailability(
  vetId: string,
  payload: { weekday: number; start: string; end: string }
): Promise<AvailSlot> {
  const data = await apiPost<AvailResponse>(`/vets/${vetId}/availability`, payload);
  return data.slot;
}

export async function deleteAvailability(
  vetId: string,
  slotId: string
): Promise<{ ok: true }> {
  return apiDelete(`/vets/${vetId}/availability/${slotId}`);
}

// Vet CRUD
export async function createVet(input: Partial<Vet>): Promise<Vet> {
  const data = await apiPost<VetResponse>("/vets", input);
  return data.vet;
}

export async function updateVet(id: string, input: Partial<Vet>): Promise<Vet> {
  const data = await apiPatch<VetResponse>(`/vets/${id}`, input);
  return data.vet;
}

export async function deleteVet(
  id: string
): Promise<{ ok: true; vet: { id: string; active: boolean } }> {
  return apiDelete(`/vets/${id}`);
}
