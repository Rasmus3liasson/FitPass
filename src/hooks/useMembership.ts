import { supabase } from "@/integrations/supabase/client";
import { Membership } from "@/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";

export const useMembership = () => {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        setLoading(true);

        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMembership(null);
          setError("User not authenticated");
          return;
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
          setMembership({
            ...data,
            active_bookings: count || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching membership:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, []);

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
    membership,
    loading,
    error,
    formatDate,
  };
};
