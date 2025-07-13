import { addClubAmenity, getAllAmenities, getClubAmenities, removeClubAmenity } from "@/src/lib/integrations/supabase/queries/amenitiesQueries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch all amenities
export const useAmenities = () => {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: getAllAmenities,
  });
};

// Fetch amenities for a specific club
export const useClubAmenities = (clubId: string) => {
  return useQuery({
    queryKey: ["clubAmenities", clubId],
    queryFn: () => getClubAmenities(clubId),
    enabled: !!clubId,
  });
};

// Add an amenity to a club
export const useAddClubAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, amenityId }: { clubId: string; amenityId: string }) => addClubAmenity(clubId, amenityId),
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["clubAmenities", clubId] });
    },
  });
};

// Remove an amenity from a club
export const useRemoveClubAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, amenityId }: { clubId: string; amenityId: string }) => removeClubAmenity(clubId, amenityId),
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["clubAmenities", clubId] });
    },
  });
}; 