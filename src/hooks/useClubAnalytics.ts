import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";
import { useQuery } from "@tanstack/react-query";

// Enhanced data fetching functions
export async function getClubVisits(clubId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClubBookings(clubId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClubReviews(clubId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClubRevenue(clubId: string) {
  // Calculate revenue based on visits and club credits
  const { data: visits, error: visitsError } = await supabase
    .from("visits")
    .select("created_at")
    .eq("club_id", clubId);

  if (visitsError) throw visitsError;

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("credits")
    .eq("id", clubId)
    .single();

  if (clubError) throw clubError;

  return {
    visits: visits || [],
    creditsPerVisit: club?.credits || 1,
  };
}

// Custom hooks
export const useClubVisits = (clubId: string) => {
  return useQuery({
    queryKey: ["clubVisits", clubId],
    queryFn: () => getClubVisits(clubId),
    enabled: !!clubId,
  });
};

export const useClubBookings = (clubId: string) => {
  return useQuery({
    queryKey: ["clubBookings", clubId],
    queryFn: () => getClubBookings(clubId),
    enabled: !!clubId,
  });
};

export const useClubReviews = (clubId: string) => {
  return useQuery({
    queryKey: ["clubReviews", clubId],
    queryFn: () => getClubReviews(clubId),
    enabled: !!clubId,
  });
};

export const useClubRevenue = (clubId: string) => {
  return useQuery({
    queryKey: ["clubRevenue", clubId],
    queryFn: () => getClubRevenue(clubId),
    enabled: !!clubId,
  });
};
