import { Club } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReview,
  deleteReview,
  getAllCategories,
  getAllClubs,
  getClassesRelatedToClub,
  getClub,
  getClubReviews,
  getClubs,
  getClubsByUser,
  getMostPopularClubs,
  getUserReview
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
    mutationFn: async ({
      clubId,
      clubData,
    }: {
      clubId: string;
      clubData: Partial<Club>;
    }) => {
      // REAL IMPLEMENTATION - Now using actual database
      console.log("🚀 Database: Updating club with ID:", clubId, "Data:", clubData);
      
      const { data, error } = await supabase
        .from("clubs")
        .update(clubData)
        .eq("id", clubId)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }
      
      console.log("✅ Database: Club updated successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("🎉 Database: Club update successful, invalidating queries");
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

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, userId, clubId }: { reviewId: string; userId: string; clubId: string }) =>
      deleteReview(reviewId, userId),
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

export const useCreateClub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clubData: Partial<Club>) => {
      // REAL IMPLEMENTATION - Now using actual database
      console.log("🚀 Database: Creating club with data:", clubData);
      console.log("🔐 User attempting to create club:", clubData.user_id);
      
      // Debug: Check current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("🔍 Current authenticated user:", user?.id);
      console.log("🔍 User email:", user?.email);
      
      if (!user) {
        throw new Error("No authenticated user found");
      }
      
      if (user.id !== clubData.user_id) {
        console.warn("⚠️ User ID mismatch:", { authId: user.id, clubUserId: clubData.user_id });
      }
      
      const { data, error } = await supabase.from("clubs").insert([clubData]).select().single();
      if (error) {
        console.error("❌ Database error:", error);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error message:", error.message);
        
        // Check if it's an RLS policy error
        if (error.code === "42501") {
          throw new Error("Permission denied: Your account may not have the required role to create clubs. Please check with the administrator or verify your RLS policies.");
        }
        
        throw error;
      }
      
      console.log("✅ Database: Club created successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("🎉 Database: Club creation successful, invalidating queries");
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
