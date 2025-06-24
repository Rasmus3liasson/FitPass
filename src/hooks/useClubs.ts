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
  updateClub
} from "../lib/integrations/supabase/queries/clubQueries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";

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
    mutationFn: ({
      clubId,
      clubData,
    }: {
      clubId: string;
      clubData: Partial<Club>;
    }) => updateClub(clubId, clubData),
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
  const updateClub = useUpdateClub();

  return useMutation({
    mutationFn: async ({
      userId,
      clubId,
      rating,
      comment,
    }: {
      userId: string;
      clubId: string;
      rating: number;
      comment: string;
    }) => {
      // Add/update the review
      const reviews = await addReview(userId, clubId, rating, comment);
      
      // Get all reviews for the club to calculate new average
      const { data: allReviews, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("club_id", clubId);

      if (error) throw error;
      
      if (allReviews && allReviews.length > 0) {
        // Calculate new average rating
        const sum = allReviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
        const avgRating = Number((sum / allReviews.length).toFixed(1));
        
        // Update club with new average rating and wait for it to complete
        const updatedClub = await updateClub.mutateAsync({
          clubId,
          clubData: { avg_rating: avgRating }
        });

        if (!updatedClub) {
          throw new Error("Failed to update club rating");
        }
      }
      
      return reviews;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["clubReviews", variables.clubId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userReview", variables.userId, variables.clubId],
      });
      queryClient.invalidateQueries({
        queryKey: ["club", variables.clubId],
      });
      queryClient.invalidateQueries({
        queryKey: ["clubs"],
      });
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

export const useBookClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      classId,
      clubId,
    }: {
      userId: string;
      classId: string;
      clubId: string;
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: userId,
            class_id: classId,
            club_id: clubId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubClasses"] });
    },
  });
};
