// src/context/PetsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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

const API_BASE = "http://localhost:4000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function PetsProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadPets = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/pets`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        signal,
      });

      const body = await res.json();

      if (res.ok) {
        if (Array.isArray(body)) {
          setPets(body);
        } else if (Array.isArray(body.pets)) {
          setPets(body.pets);
        } else {
          setPets([]);
          console.error("Unexpected pets response:", body);
        }
      } else {
        setPets([]);
        setError(body.error || `Error ${res.status}`);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addPet = useCallback(async (data: Partial<Pet>) => {
    try {
      const res = await fetch(`${API_BASE}/pets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add pet");
      const newPet = body.pet ?? body;
      setPets((old) => [newPet, ...old]);
      return newPet;
    } catch (err) {
      console.error("addPet error:", err);
      return null;
    }
  }, []);

  const updatePet = useCallback(async (id: string, data: Partial<Pet>) => {
    try {
      const res = await fetch(`${API_BASE}/pets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update pet");
      const updatedPet = body.pet ?? body;
      setPets((old) =>
        old.map((p) => (p.id === id ? { ...p, ...updatedPet } : p))
      );
      return updatedPet;
    } catch (err) {
      console.error("updatePet error:", err);
      return null;
    }
  }, []);

  const removePet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/pets/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
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