import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReview,
  deleteReview,
  getAllCategories,
  getAllClubs,
  getClassesRelatedToClub,
  getClub,
  getClubs,
  getClubsByUser,
  getMostPopularClubs,
  getUserReview,
} from "../lib/integrations/supabase/queries/clubQueries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { BookingStatus, Club } from "../types";

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

export const useMostPopularClubs = (limit: number = 10) => {
  return useQuery({
    queryKey: ["mostPopularClubs", limit],
    queryFn: () => getMostPopularClubs(limit),
  });
};

export const useUserClubs = (userId: string) => {
  return useQuery({
    queryKey: ["userClubs", userId],
    queryFn: () => getClubsByUser(userId),
    enabled: !!userId,
  });
};

export const useClubByUserId = (userId: string) => {
  return useQuery({
    queryKey: ["clubByUserId", userId],
    queryFn: async () => {
      const clubs = await getClubsByUser(userId);
      return clubs?.[0] || null;
    },
    enabled: !!userId,
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Accepts images as an optional array
    mutationFn: async ({
      clubId,
      clubData,
      images,
    }: {
      clubId: string;
      clubData: Partial<Club>;
      images?: Array<{ url: string; type?: string; caption?: string }>;
    }) => {
      // If images array contains a 'poster' type, set image_url in clubData
      let clubDataToUpdate = { ...clubData };
      if (images && images.length > 0) {
        const posterImg = images.find((img) => img.type === "poster");
        if (posterImg) {
          clubDataToUpdate.image_url = posterImg.url;
        }
      }

      // Update club data (with image_url if poster present)
      const { data, error } = await supabase
        .from("clubs")
        .update(clubDataToUpdate)
        .eq("id", clubId)
        .select();

      if (error) {
        throw error;
      }

      // Handle case where no rows were updated (e.g., same value already exists)
      if (!data || data.length === 0) {
        // Fetch the club data to return
        const { data: clubData, error: fetchError } = await supabase
          .from("clubs")
          .select()
          .eq("id", clubId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        return clubData;
      }

      // Return the first updated row
      const updatedClub = Array.isArray(data) ? data[0] : data;

      if (images) {
        // Fetch current images for the club
        const { data: existingImages, error: fetchError } = await supabase
          .from("club_images")
          .select("id, url")
          .eq("club_id", clubId);
        if (fetchError) throw fetchError;

        const existingUrls = (existingImages || []).map((img) => img.url);
        // Only insert images that are not already present (by URL)
        const newImages = images.filter(
          (img) => !existingUrls.includes(img.url),
        );

        if (newImages.length > 0) {
          const imageRows = newImages.map((img) => ({
            club_id: clubId,
            url: img.url,
            type: img.type || "gallery",
            caption: img.caption || null,
          }));
          const { error: imgError } = await supabase
            .from("club_images")
            .insert(imageRows);
          if (imgError) throw imgError;
        }

        // Optionally: Delete images that are no longer present in the new images array
        const newUrls = images.map((img) => img.url);
        const toDelete = (existingImages || []).filter(
          (img) => !newUrls.includes(img.url),
        );
        if (toDelete.length > 0) {
          const idsToDelete = toDelete.map((img) => img.id);
          const { error: delError } = await supabase
            .from("club_images")
            .delete()
            .in("id", idsToDelete);
          if (delError) throw delError;
        }
      }

      return updatedClub;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["club", data.id] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
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
        const sum = allReviews.reduce(
          (acc: number, curr: { rating: number }) => acc + curr.rating,
          0,
        );
        const avgRating = Number((sum / allReviews.length).toFixed(1));

        // Update club with new average rating and wait for it to complete
        const updatedClub = await updateClub.mutateAsync({
          clubId,
          clubData: { avg_rating: avgRating },
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

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      userId,
      clubId,
    }: {
      reviewId: string;
      userId: string;
      clubId: string;
    }) => deleteReview(reviewId, userId),
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
      creditsToUse = 1,
    }: {
      userId: string;
      classId: string;
      clubId: string;
      creditsToUse?: number;
    }) => {
      // Increment booked_spots FIRST
      const { error: updateError } = await supabase.rpc(
        "increment_class_booked_spots_manual",
        { class_id: classId },
      );

      if (updateError) throw updateError;

      // Then create the booking
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: userId,
            class_id: classId,
            club_id: clubId,
            credits_used: creditsToUse,
            status: BookingStatus.PENDING,
          },
        ])
        .select()
        .single();

      if (error) {
        // Rollback the increment if booking creation fails
        await supabase.rpc("decrement_class_booked_spots_manual", {
          class_id: classId,
        });
        throw error;
      }

      const { data: updatedBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", data.id)
        .single();

      if (fetchError) throw fetchError;

      return updatedBooking;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["allClasses"] });
      await queryClient.invalidateQueries({
        queryKey: ["classesByClub", variables.clubId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["userBookings", variables.userId],
      });
      await queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
};

export const useCreateClub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clubData: Partial<Club>) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { data, error } = await supabase
        .from("clubs")
        .insert([clubData])
        .select()
        .single();
      if (error) {
        // Check if it's an RLS policy error
        if (error.code === "42501") {
          throw new Error(
            "Permission denied: Your account may not have the required role to create clubs. Please check with the administrator or verify your RLS policies.",
          );
        }

        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clubByUserId"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });
};

// Re-export from useClubAnalytics for backwards compatibility
export { useClubReviews } from "./useClubAnalytics";
