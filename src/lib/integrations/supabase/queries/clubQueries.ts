import { Class, Club, Review } from "@/types";
import { supabase } from "../supabaseClient";

// Helper function to convert degrees to radians
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Clubs and ratings functions
export async function getClubs(
  filters: {
    search?: string;
    area?: string;
    type?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  } = {}
): Promise<Club[]> {
  let query = supabase.from("clubs").select("*");

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,area.ilike.%${filters.search}%`
    );
  }

  if (filters.area && filters.area !== "all") {
    query = query.eq("area", filters.area);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  const { data, error } = await query;

  if (error) throw error;

  // If location filtering is requested, process the data client-side
  if (filters.latitude && filters.longitude && filters.radius) {
    // Calculate distances and filter by radius
    const filteredClubs = data
      .map((club) => {
        if (club.latitude && club.longitude) {
          // Calculate Haversine distance
          const R = 6371; // Earth radius in km
          const dLat = toRadians(club.latitude - filters.latitude!);
          const dLon = toRadians(club.longitude - filters.longitude!);
          const lat1 = toRadians(filters.latitude!);
          const lat2 = toRadians(club.latitude);

          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) *
              Math.sin(dLon / 2) *
              Math.cos(lat1) *
              Math.cos(lat2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return { ...club, distance };
        }
        return { ...club, distance: Infinity };
      })
      .filter((club) => club.distance <= filters.radius!)
      .sort((a, b) => a.distance - b.distance);

    return filteredClubs;
  }

  return data;
}

// Get single club details
export async function getClub(clubId: string): Promise<Club> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .single();

  if (error) throw error;
  return data as Club;
}

// Function to get all clubs for admin purposes
export async function getAllClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from("clubs").select("*");

  if (error) throw error;
  return data || [];
}

// Function to get clubs managed by a specific user (for club dashboard)
export async function getClubsByUser(userId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

// Function to update a club
export async function updateClub(
  clubId: string,
  clubData: Partial<Club>
): Promise<Club> {
  const { data, error } = await supabase
    .from("clubs")
    .update(clubData)
    .eq("id", clubId)
    .select();

  if (error) throw error;
  return data as unknown as Club;
}

// Reviews functions
export async function getClubReviews(clubId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    console.log("data", data);
    return data || [];
  } catch (error) {
    console.error("Error getting club reviews:", error);
    return [];
  }
}

export async function getClubAverageRating(clubId: string): Promise<number> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("club_id", clubId);

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  const sum = data.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  return sum / data.length;
}

export async function getUserReview(
  userId: string,
  clubId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function addReview(
  userId: string,
  clubId: string,
  rating: number,
  comment: string
): Promise<Review[]> {
  try {
    const existingReview = await getUserReview(userId, clubId);

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select();

      if (error) throw error;
      return data || [];
    } else {
      // Create new review
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: userId,
          club_id: clubId,
          rating,
          comment,
        })
        .select();

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error("Error adding/updating review:", error);
    throw error;
  }
}

export async function getClassesRelatedToClub(
  clubId: string
): Promise<Class[]> {
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      clubs:club_id (name, image_url),
      instructor:instructor_id (
        id, 
        user_id,
        club_name,
        profiles:user_id (
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("club_id", clubId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data as Class[];
}
