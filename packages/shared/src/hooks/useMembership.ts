import { Membership } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  cancelScheduledMembershipChange,
  createUserMembership,
  updateMembershipPlan,
} from "../lib/integrations/supabase/queries/membershipQueries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";

/**
 * Fetch membership data directly from Stripe for real-time updates
 * 
 * WHY: Database is a read-only projection synced via webhooks.
 * Webhooks can take 1-2 seconds, so we fetch directly from Stripe
 * to show users their current subscription status immediately.
 * 
 * This ensures UI updates instantly after subscription changes.
 */
const fetchMembership = async (): Promise<Membership | null> => {
  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch membership data directly from Stripe (real-time)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/stripe/user/${user.id}/subscription`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.membership) {
      return result.membership;
    }

    return null;
  } catch (error) {
    console.error("Error fetching from Stripe, falling back to DB:", error);
    
    // Fallback to database if Stripe fetch fails
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
  }
};

export const useMembership = () => {
  const query = useQuery({
    queryKey: ["membership"],
    queryFn: fetchMembership,
    staleTime: 0,
    gcTime: 0,
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
    refetch: query.refetch,
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
    onSuccess: async (data, { userId }) => {
      /**
       * WEBHOOK-AWARE SUCCESS HANDLER FOR NEW SUBSCRIPTIONS
       * 
       * If data.webhookPending is true:
       * - Stripe subscription was created successfully
       * - Database sync is pending (waiting for customer.subscription.created webhook)
       * - We poll for sync completion before showing final success
       */
      if (data.webhookPending && data.subscriptionId) {
        console.log("⏳ New subscription created, polling for webhook sync...");
        
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
          const pollResponse = await fetch(
            `${apiUrl}/api/stripe/subscription/${data.subscriptionId}/wait-for-sync?timeout=10`,
            { method: 'GET' }
          );
          
          if (pollResponse.ok) {
            const pollResult = await pollResponse.json();
            if (pollResult.synced) {
              console.log("✅ Webhook sync confirmed, refetching data");
            } else {
              console.log("⏱️ Webhook poll timeout, data may sync shortly");
            }
          }
        } catch (pollError) {
          console.warn("⚠️ Webhook polling failed, data may sync shortly:", pollError);
        }
      } else {
        console.log("✅ Membership created successfully:", data.id);
      }
      
      // Always refetch to get latest state from database
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
    onSuccess: async (data, { userId }) => {
      /**
       * WEBHOOK-AWARE SUCCESS HANDLER
       * 
       * If data.webhookPending is true, it means:
       * - Stripe was updated successfully
       * - Database update is pending (webhook not fired yet)
       * - We should poll for sync completion
       * 
       * For immediate updates (dev mode without Stripe):
       * - Database is already updated
       * - Just invalidate queries
       */
      
      // Always invalidate queries first
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["scheduledChanges", userId] });
      queryClient.invalidateQueries({ queryKey: ["dailyAccessStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["dailyAccessGyms", userId] });
      
      // If webhook pending, poll for sync completion
      if (data.webhookPending && data.subscriptionId) {
        console.log('⏳ Webhook pending, polling for sync completion...');
        
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
          
          // Poll with 10 second timeout
          const pollResponse = await fetch(
            `${apiUrl}/api/stripe/subscription/${data.subscriptionId}/wait-for-sync?timeout=10`,
            { method: 'GET' }
          );
          
          if (pollResponse.ok) {
            console.log('✅ Webhook sync confirmed, refetching data');
            
            // Force refetch all queries after webhook confirmation
            await Promise.all([
              queryClient.refetchQueries({ queryKey: ["membership"] }),
              queryClient.refetchQueries({ queryKey: ["subscription"] }),
              queryClient.refetchQueries({ queryKey: ["scheduledChanges", userId] }),
              queryClient.refetchQueries({ queryKey: ["dailyAccessStatus", userId] }),
              queryClient.refetchQueries({ queryKey: ["dailyAccessGyms", userId] })
            ]);
          } else {
            console.warn('⚠️ Webhook sync timeout, data may update shortly');
            // Still refetch, user can try again if needed
            await queryClient.refetchQueries({ queryKey: ["membership"] });
          }
        } catch (pollError) {
          console.error('❌ Error polling for webhook sync:', pollError);
          // Fallback: just refetch normally
          await queryClient.refetchQueries({ queryKey: ["membership"] });
        }
      } else {
        // Immediate update or scheduled change - refetch normally
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["membership"] }),
          queryClient.refetchQueries({ queryKey: ["scheduledChanges", userId] }),
          queryClient.refetchQueries({ queryKey: ["dailyAccessStatus", userId] }),
          queryClient.refetchQueries({ queryKey: ["dailyAccessGyms", userId] })
        ]);
      }
    },
    onError: (error) => {
      console.error("❌ Membership update failed:", error);
    },
  });
};

export const useCancelScheduledChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, scheduleId }: { membershipId: string; scheduleId?: string }) =>
      cancelScheduledMembershipChange(membershipId, scheduleId),
    onSuccess: () => {
      // Invalidate membership and subscription queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("❌ Cancel scheduled change failed:", error);
    },
  });
};

export const usePauseMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${userId}/subscription/pause`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
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
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${userId}/subscription/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
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

export const useResumeMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${userId}/subscription/resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resume membership");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Membership resumed successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.refetchQueries({ queryKey: ["membership"] });
      queryClient.refetchQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("❌ Membership resume failed:", error);
    },
  });
};
