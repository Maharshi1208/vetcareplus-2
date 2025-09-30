// src/context/PetsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { API_URL, authHeaders } from "../services/api";

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  dob?: string | null;
  ageYears?: number | null;
  ageMonths?: number | null;
  ownerName?: string | null; // UI-facing convenience
  color?: string | null;
  microchipId?: string | null;
  weightKg?: number | null;
  vaccinated?: boolean;
  neutered?: boolean;
  notes?: string | null;

  // When backend includes relations (non-breaking)
  owner?: { id: string; name?: string | null; email?: string | null } | null;
};

type PetsContextValue = {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  addPet: (data: Partial<Pet>) => Promise<Pet | null>;
  updatePet: (id: string, data: Partial<Pet>) => Promise<Pet | null>;
  removePet: (id: string) => Promise<void>;
  reloadPets: (signal?: AbortSignal) => Promise<void>;
};

const PetsContext = createContext<PetsContextValue | undefined>(undefined);

// Normalize server pet → ensure ownerName is present for UI
function normalizePet(p: any): Pet {
  return {
    ...p,
    ownerName: p?.owner?.name ?? p?.ownerName ?? null,
  };
}

export function PetsProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadPets = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/pets`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        signal,
      });

      const body = await res.json();
      if (res.ok) {
        if (Array.isArray(body)) {
          setPets(body.map(normalizePet));
        } else if (Array.isArray(body?.pets)) {
          setPets(body.pets.map(normalizePet));
        } else {
          setPets([]);
          console.error("Unexpected pets response:", body);
        }
      } else {
        setPets([]);
        setError(body?.error || `Error ${res.status}`);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err?.message || "Failed to load pets");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addPet = useCallback(async (data: Partial<Pet>) => {
    try {
      const res = await fetch(`${API_URL}/pets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to add pet");
      const newPet = normalizePet(body?.pet ?? body);
      setPets((old) => [newPet, ...old]);
      return newPet;
    } catch (err) {
      console.error("addPet error:", err);
      return null;
    }
  }, []);

  const updatePet = useCallback(async (id: string, data: Partial<Pet>) => {
    try {
      // Backend uses PATCH /pets/:id
      const res = await fetch(`${API_URL}/pets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to update pet");
      const updatedPet = normalizePet(body?.pet ?? body);
      setPets((old) => old.map((p) => (p.id === id ? { ...p, ...updatedPet } : p)));
      return updatedPet;
    } catch (err) {
      console.error("updatePet error:", err);
      return null;
    }
  }, []);

  const removePet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/pets/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to delete pet");
      }
      setPets((old) => old.filter((p) => p.id !== id));
    } catch (err) {
      console.error("removePet error:", err);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    reloadPets(ctrl.signal);
    return () => ctrl.abort();
  }, [reloadPets]);

  return (
    <PetsContext.Provider
      value={{ pets, loading, error, addPet, updatePet, removePet, reloadPets }}
    >
      {children}
    </PetsContext.Provider>
  );
}

export function usePets() {
  const ctx = useContext(PetsContext);
  if (!ctx) throw new Error("usePets must be used inside <PetsProvider>");
  return ctx;
}
