import { Favorite, FavoriteClub } from "@/types";
import { supabase } from "../supabaseClient";

// Favorites functions
export async function getUserFavorites(
  userId: string
): Promise<FavoriteClub[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select(
      `
      *,
      clubs:club_id (*)
    `
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data as unknown as FavoriteClub[];
}

export async function addFavorite(
  userId: string,
  clubId: string
): Promise<Favorite[]> {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: userId,
        club_id: clubId,
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
}

export async function removeFavorite(
  userId: string,
  clubId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("club_id", clubId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
}

export async function checkIsFavorite(
  userId: string,
  clubId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("club_id", clubId);

    if (error && error.code !== "PGRST116") throw error;

    return Array.isArray(data) && data.length > 0; // 👈 fixed
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

