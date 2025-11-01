import { Membership } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  createUserMembership,
  updateMembershipPlan,
} from "../lib/integrations/supabase/queries/membershipQueries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";

const fetchMembership = async (): Promise<Membership | null> => {
  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch membership data
  const { data, error: membershipError } = await supabase
    .from("memberships")
    .select(
      `
      *,
      membership_plans:plan_id (
        price
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError) {
    console.error("❌ Membership fetch error:", membershipError);
    throw membershipError;
  }

  // Count active bookings
  const { count, error: bookingsError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "confirmed");

  if (bookingsError) {
    throw bookingsError;
  }

  if (data) {
    return {
      ...data,
      active_bookings: count || 0,
    };
  }

  return null;
};

export const useMembership = () => {
  const query = useQuery({
    queryKey: ["membership"],
    queryFn: fetchMembership,
  });

  // Function to format date in a readable format
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid Date";
    }
  };

  return {
    membership: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    formatDate,
  };
};

export const useCreateMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      planId,
    }: {
      userId: string;
      planId: string;
    }) => {
      console.log("🎯 useCreateMembership called with:", { userId, planId });
      console.log(
        "⚠️ WARNING: This should only be called for users without existing memberships"
      );
      return await createUserMembership(userId, planId);
    },
    onSuccess: (data) => {
      console.log("✅ Membership created successfully:", data.id);
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("❌ Membership creation failed:", error);
    },
  });
};

export const useUpdateMembershipPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      updateMembershipPlan(userId, planId),
    onSuccess: (data) => {
      console.log("✅ Membership updated successfully:", data);
      // Invalidate both membership and subscription queries
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ["membership"] });
    },
    onError: (error) => {
      console.error("❌ Membership update failed:", error);
    },
  });
};

export const usePauseMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId }: { subscriptionId: string }) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/pause-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscriptionId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to pause membership");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Membership paused successfully:", data);
      // Invalidate both membership and subscription queries
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ["membership"] });
      queryClient.refetchQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("❌ Membership pause failed:", error);
    },
  });
};

export const useCancelMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subscriptionId,
      cancelAtPeriodEnd = true,
    }: {
      subscriptionId: string;
      cancelAtPeriodEnd?: boolean;
    }) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscriptionId, cancelAtPeriodEnd }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel membership");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Membership canceled successfully:", data);
      // Invalidate both membership and subscription queries
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ["membership"] });
      queryClient.refetchQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("❌ Membership cancel failed:", error);
    },
  });
};
