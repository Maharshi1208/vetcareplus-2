// src/context/PetsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { API_URL, authHeaders } from "../services/api"; // ⬅️ NEW

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dob?: string;
  ageYears?: number;
  ageMonths?: number;
  ownerName?: string;
  color?: string;
  microchipId?: string;
  weightKg?: number;
  vaccinated?: boolean;
  neutered?: boolean;
  notes?: string;
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
          ...authHeaders(), // ⬅️ uses 'access' (and falls back)
        },
        signal,
      });

      // tolerate both shapes: [] or { pets: [] }
      const body = await res.json();
      if (res.ok) {
        if (Array.isArray(body)) setPets(body as Pet[]);
        else if (Array.isArray(body?.pets)) setPets(body.pets as Pet[]);
        else {
          setPets([]);
          console.error("Unexpected pets response:", body);
        }
      } else {
        setPets([]);
        setError(body?.error || `Error ${res.status}`);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "Failed to load pets");
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
          ...authHeaders(), // ⬅️
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to add pet");
      const newPet = body?.pet ?? body;
      setPets((old) => [newPet, ...old]);
      return newPet as Pet;
    } catch (err) {
      console.error("addPet error:", err);
      return null;
    }
  }, []);

  const updatePet = useCallback(async (id: string, data: Partial<Pet>) => {
    try {
      // If your backend expects PATCH (common), change method to "PATCH"
      const res = await fetch(`${API_URL}/pets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(), // ⬅️
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to update pet");
      const updatedPet = body?.pet ?? body;
      setPets((old) => old.map((p) => (p.id === id ? { ...p, ...updatedPet } : p)));
      return updatedPet as Pet;
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
          ...authHeaders(), // ⬅️
        },
      });
      if (!res.ok) throw new Error("Failed to delete pet");
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
