import { useQuery } from "@tanstack/react-query";
import { fetchVets, fetchOwnerPets, fetchOwners, VetOption, PetOption, OwnerOption } from "../services/dropdowns";

export function useVetsSelect() {
  return useQuery<VetOption[]>({ queryKey: ["vets/select"], queryFn: fetchVets, staleTime: 5 * 60_000 });
}
export function useOwnerPetsSelect(ownerId: "me" | string = "me") {
  return useQuery<PetOption[]>({
    queryKey: ["pets/select", ownerId],
    queryFn: () => fetchOwnerPets(ownerId),
    staleTime: 60_000
  });
}
export function useOwnersSelect() {
  return useQuery<OwnerOption[]>({ queryKey: ["owners/select"], queryFn: fetchOwners, staleTime: 5 * 60_000 });
}
