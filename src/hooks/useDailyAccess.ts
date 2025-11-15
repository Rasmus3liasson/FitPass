import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/integrations/supabase/supabaseClient";

export interface SelectedGym {
  id: string;
  gym_id: string;
  gym_name: string;
  gym_address?: string;
  gym_image?: string;
  added_at: string;
  effective_from: string;
  status: "pending" | "active" | "removed" | "pending_removal" | "pending_replacement";
}

export interface DailyAccessStatus {
  hasDailyAccess: boolean;
  maxSlots: number;
  subscription?: any;
}

export interface DailyAccessData {
  current: SelectedGym[];
  pending: SelectedGym[];
  maxSlots: number;
}

// Hook to check if user has Daily Access membership
export function useDailyAccessStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["dailyAccessStatus", userId],
    queryFn: async (): Promise<DailyAccessStatus> => {
      if (!userId) {
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      // First check if user has any membership
      const { data: allMemberships, error: membershipError } = await supabase
        .from("memberships")
        .select(
          `
          *,
          membership_plans (
            id,
            title,
            price,
            max_daily_gyms
          )
        `
        )
        .eq("user_id", userId)
        .eq("is_active", true);

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError);
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      // Find membership with Daily Access (max_daily_gyms > 0)
      const membership = allMemberships?.find(
        (m) =>
          m.membership_plans?.max_daily_gyms &&
          m.membership_plans.max_daily_gyms > 0
      );

      if (!membership) {
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      const hasDailyAccess = !!membership?.membership_plans?.max_daily_gyms;
      const maxSlots = membership?.membership_plans?.max_daily_gyms || 0;

      // TEMPORARY: Enable for all users during testing
      const enableForTesting = true;

      return {
        hasDailyAccess: enableForTesting || hasDailyAccess,
        maxSlots: enableForTesting ? 3 : maxSlots,
        subscription: membership || null,
      };
    },
    enabled: !!userId,
  });
}

// Hook to get user's selected gyms
export function useDailyAccessGyms(userId: string | undefined) {
  return useQuery({
    queryKey: ["dailyAccessGyms", userId],
    queryFn: async (): Promise<DailyAccessData> => {
      if (!userId) {
        return { current: [], pending: [], maxSlots: 0 };
      }

      // Use same logic as useDailyAccessStatus for consistency
      const { data: allMemberships, error: membershipError } = await supabase
        .from("memberships")
        .select(
          `
          *,
          membership_plans (
            id,
            title,
            price,
            max_daily_gyms
          )
        `
        )
        .eq("user_id", userId)
        .eq("is_active", true);

      

      if (membershipError) {
        console.error(
          "Error fetching memberships in useDailyAccessGyms:",
          membershipError
        );
      }

      // Find membership with Daily Access (max_daily_gyms > 0)
      const membership = allMemberships?.find(
        (m) =>
          m.membership_plans?.max_daily_gyms &&
          m.membership_plans.max_daily_gyms > 0
      );

      const maxSlots = membership?.membership_plans?.max_daily_gyms || 0;

      // TEMPORARY: Enable for all users during testing (same as useDailyAccessStatus)
      const enableForTesting = true;
      const finalMaxSlots = enableForTesting ? 3 : maxSlots;

      // Continue even if no membership found (for testing)
      if (!enableForTesting && !maxSlots) {
        return { current: [], pending: [], maxSlots: 0 };
      }

      const { data: selectedGyms, error } = await supabase
        .from("user_selected_gyms")
        .select(
          `
          id,
          club_id,
          added_at,
          effective_from,
          status,
          clubs (
            id,
            name,
            address,
            image_url
          )
        `
        )
        .eq("user_id", userId)
        .in("status", ["active", "pending", "pending_removal", "pending_replacement"]);

      if (error) {
        console.error("Error fetching selected gyms:", error);
        console.error("Query details - userId:", userId);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        return { current: [], pending: [], maxSlots: finalMaxSlots };
      }

      console.log("Raw selected gyms data:", selectedGyms);

      // Transform the data
      const transformedGyms: SelectedGym[] = (selectedGyms || []).map(
        (gym: any) => ({
          id: gym.id,
          gym_id: gym.club_id,
          gym_name: gym.clubs.name,
          gym_address: gym.clubs.address,
          gym_image: gym.clubs.image_url,
          added_at: gym.added_at,
          effective_from: gym.effective_from,
          status: gym.status,
        })
      );

      // Separate current and pending
      // Current includes active, pending_removal, and pending_replacement (still active until next billing)
      const current = transformedGyms.filter((gym) => 
        gym.status === "active" || gym.status === "pending_removal" || gym.status === "pending_replacement"
      );
      const pending = transformedGyms.filter((gym) => gym.status === "pending");

      console.log(
        "Transformed gyms - current:",
        current.length,
        "pending:",
        pending.length
      );

      return {
        current,
        pending,
        maxSlots: finalMaxSlots,
      };
    },
    enabled: !!userId,
  });
}

// Hook to add a gym to Daily Access
export function useAddDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      gymId,
    }: {
      userId: string;
      gymId: string;
    }) => {
      console.log("Adding gym to Daily Access:", { userId, gymId });

      // Check current selections count
      const { count } = await supabase
        .from("user_selected_gyms")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["active", "pending"]);

      const maxSlots = 3; // Default max, could be fetched from membership
      if ((count || 0) >= maxSlots) {
        throw new Error("Du har redan nått max antal gym för Daily Access");
      }

      // Check if gym is already selected
      const { data: existing } = await supabase
        .from("user_selected_gyms")
        .select("id")
        .eq("user_id", userId)
        .eq("club_id", gymId)
        .in("status", ["active", "pending"])
        .single();

      if (existing) {
        throw new Error("Detta gym är redan valt för Daily Access");
      }

      // Check if user has any existing ACTIVE gym selections (to determine if new to Daily Access)
      const { count: existingActiveCount } = await supabase
        .from("user_selected_gyms")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active");

      // Additional check: if user has active gyms but they were all added recently (within last 5 minutes),
      // still consider them as "new user" to allow batch activation
      let isNewUser = (existingActiveCount || 0) === 0;
      
      if (!isNewUser && existingActiveCount && existingActiveCount > 0) {
        // Check if all active gyms were added in the last 5 minutes (batch selection session)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const { data: recentActiveGyms } = await supabase
          .from("user_selected_gyms")
          .select("added_at")
          .eq("user_id", userId)
          .eq("status", "active")
          .gte("added_at", fiveMinutesAgo.toISOString());
        
        // If all active gyms were added recently, treat as new user session
        if (recentActiveGyms && recentActiveGyms.length === existingActiveCount) {
          isNewUser = true;
        }
      }

      // For new users, activate immediately. For existing users, schedule for next billing cycle
      const now = new Date();
      const effectiveDate = isNewUser
        ? now
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const status = isNewUser ? "active" : "pending";

      console.log("Adding gym:", {
        userId,
        gymId,
        isNewUser,
        existingActiveCount,
        status,
        effectiveDate: effectiveDate.toISOString(),
      });

      // Add the gym
      const { error } = await supabase.from("user_selected_gyms").insert({
        user_id: userId,
        club_id: gymId,
        effective_from: effectiveDate.toISOString(),
        status,
      });

      if (error) {
        console.error("Error adding gym:", error);
        throw new Error("Kunde inte lägga till gym i Daily Access");
      }

      return { success: true };
    },
    onSuccess: (_, { userId, gymId }) => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["dailyAccessGyms", userId] });
      queryClient.invalidateQueries({
        queryKey: ["gymDailyAccessStatus", userId, gymId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailyAccessStatus", userId],
      });
    },
  });
}

// Hook to mark a gym for pending removal (effective next billing cycle)
export function usePendingRemoveDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      gymId,
    }: {
      userId: string;
      gymId: string;
    }) => {
      console.log("Marking gym for pending removal:", { userId, gymId });

      const { error } = await supabase
        .from("user_selected_gyms")
        .update({ status: "pending_removal" })
        .eq("user_id", userId)
        .eq("club_id", gymId)
        .eq("status", "active");

      if (error) {
        console.error("Error marking gym for removal:", error);
        throw new Error("Kunde inte markera gym för borttagning");
      }

      return { success: true };
    },
    onSuccess: (_, { userId, gymId }) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAccessGyms", userId] });
      queryClient.invalidateQueries({
        queryKey: ["gymDailyAccessStatus", userId, gymId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailyAccessStatus", userId],
      });
    },
  });
}

// Hook to mark a gym for pending replacement (effective next billing cycle)
export function usePendingReplaceDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      gymId,
    }: {
      userId: string;
      gymId: string;
    }) => {
      console.log("Marking gym for pending replacement:", { userId, gymId });

      const { error } = await supabase
        .from("user_selected_gyms")
        .update({ status: "pending_replacement" })
        .eq("user_id", userId)
        .eq("club_id", gymId)
        .eq("status", "active");

      if (error) {
        console.error("Error marking gym for replacement:", error);
        throw new Error("Kunde inte markera gym för ersättning");
      }

      return { success: true };
    },
    onSuccess: (_, { userId, gymId }) => {
      queryClient.invalidateQueries({ queryKey: ["dailyAccessGyms", userId] });
      queryClient.invalidateQueries({
        queryKey: ["gymDailyAccessStatus", userId, gymId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailyAccessStatus", userId],
      });
    },
  });
}

// Hook to remove a gym from Daily Access (immediate removal - for admin use)
export function useRemoveDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      gymId,
    }: {
      userId: string;
      gymId: string;
    }) => {
      console.log("Removing gym from Daily Access:", { userId, gymId });

      const { error } = await supabase
        .from("user_selected_gyms")
        .update({ status: "removed" })
        .eq("user_id", userId)
        .eq("club_id", gymId)
        .in("status", ["active", "pending"]);

      if (error) {
        console.error("Error removing gym:", error);
        throw new Error("Kunde inte ta bort gym från Daily Access");
      }

      return { success: true };
    },
    onSuccess: (_, { userId, gymId }) => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["dailyAccessGyms", userId] });
      queryClient.invalidateQueries({
        queryKey: ["gymDailyAccessStatus", userId, gymId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailyAccessStatus", userId],
      });
    },
  });
}

// Hook to get a single gym's Daily Access status
export function useGymDailyAccessStatus(
  userId: string | undefined,
  gymId: string | undefined
) {
  return useQuery({
    queryKey: ["gymDailyAccessStatus", userId, gymId],
    queryFn: async () => {
      if (!userId || !gymId) return { isSelected: false, status: null };

      console.log("🔍 Fetching gym Daily Access status:", { userId, gymId });

      const { data } = await supabase
        .from("user_selected_gyms")
        .select("status")
        .eq("user_id", userId)
        .eq("club_id", gymId)
        .in("status", ["active", "pending"])
        .single();

      const result = {
        isSelected: !!data,
        status: data?.status || null,
      };

      console.log("✅ Gym Daily Access status result:", {
        userId,
        gymId,
        result,
      });

      return result;
    },
    enabled: !!userId && !!gymId,
  });
}
