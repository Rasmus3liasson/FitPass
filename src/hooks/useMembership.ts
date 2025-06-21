import { Membership } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { createUserMembership } from "../lib/integrations/supabase/queries/membershipQueries";
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
    `,
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError) {
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
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      return await createUserMembership(userId, planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
};
