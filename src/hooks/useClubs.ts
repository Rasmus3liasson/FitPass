import { Club } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    addReview,
    getAllClubs,
    getClassesRelatedToClub,
    getClub,
    getClubReviews,
    getClubs,
    getClubsByUser,
    getUserReview,
    updateClub,
} from "../lib/integrations/supabase/queries/clubQueries";

export const useClubs = (filters?: {
  search?: string;
  area?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}) => {
  return useQuery({
    queryKey: ["clubs", filters],
    queryFn: () => getClubs(filters),
  });
};

export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ["club", clubId],
    queryFn: () => getClub(clubId),
    enabled: !!clubId,
  });
};

export const useAllClubs = () => {
  return useQuery({
    queryKey: ["allClubs"],
    queryFn: getAllClubs,
  });
};

export const useUserClubs = (userId: string) => {
  return useQuery({
    queryKey: ["userClubs", userId],
    queryFn: () => getClubsByUser(userId),
    enabled: !!userId,
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, clubData }: { clubId: string; clubData: Partial<Club> }) =>
      updateClub(clubId, clubData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["club", data.id] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

export const useClubReviews = (clubId: string) => {
  return useQuery({
    queryKey: ["clubReviews", clubId],
    queryFn: () => getClubReviews(clubId),
    enabled: !!clubId,
  });
};

export const useUserReview = (userId: string, clubId: string) => {
  return useQuery({
    queryKey: ["userReview", userId, clubId],
    queryFn: () => getUserReview(userId, clubId),
    enabled: !!userId && !!clubId,
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      clubId,
      rating,
      comment,
    }: {
      userId: string;
      clubId: string;
      rating: number;
      comment: string;
    }) => addReview(userId, clubId, rating, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clubReviews", variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ["userReview", variables.userId, variables.clubId] });
    },
  });
};

export const useClubClasses = (clubId: string) => {
  return useQuery({
    queryKey: ["clubClasses", clubId],
    queryFn: () => getClassesRelatedToClub(clubId),
    enabled: !!clubId,
  });
}; 