// src/context/PetsContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

export type Pet = {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Rabbit" | "Reptile" | "Other" | string;
  breed?: string;
  gender?: "MALE" | "FEMALE" | "UNKNOWN";
  color?: string;               // e.g., Black, Brown, White, Golden, Mixed
  ageYears?: number;            // years part of age
  ageMonths?: number;           // months part of age (0–11)
  weightKg?: number;            // optional decimal
  ownerName?: string;           // chosen from dropdown (or custom)
  microchipId?: string;         // optional
  vaccinated?: boolean;         // Yes/No
  neutered?: boolean;           // Yes/No
  notes?: string;               // free text
  createdAt: string;
  updatedAt: string;
};

type PetsContextType = {
  pets: Pet[];
  addPet: (p: Omit<Pet, "id" | "createdAt" | "updatedAt">) => void;
  removePet: (id: string) => void;
};

const PetsContext = createContext<PetsContextType | null>(null);

export function PetsProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(() => {
    const now = new Date().toISOString();
    return [
      {
        id: crypto.randomUUID(),
        name: "Buddy",
        species: "Dog",
        breed: "Labrador",
        gender: "MALE",
        color: "Golden",
        ageYears: 3,
        ageMonths: 0,
        weightKg: 28.4,
        ownerName: "Alice",
        microchipId: "9851-0034-221A",
        vaccinated: true,
        neutered: true,
        notes: "Friendly with kids.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Mittens",
        species: "Cat",
        breed: "Siamese",
        gender: "FEMALE",
        color: "White",
        ageYears: 2,
        ageMonths: 5,
        weightKg: 4.2,
        ownerName: "Bob",
        microchipId: "",
        vaccinated: true,
        neutered: false,
        notes: "Shy with strangers.",
        createdAt: now,
        updatedAt: now,
      },
    ];
  });

  const addPet: PetsContextType["addPet"] = (p) => {
    const now = new Date().toISOString();
    setPets((old) => [
      { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...p },
      ...old,
    ]);
  };

  const removePet: PetsContextType["removePet"] = (id) => {
    setPets((old) => old.filter((x) => x.id !== id));
  };

  const value = useMemo(() => ({ pets, addPet, removePet }), [pets]);
  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetsContext);
  if (!ctx) throw new Error("usePets must be used inside <PetsProvider>");
  return ctx;
}
