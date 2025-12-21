import { Favorite, FavoriteClub, FriendWhoFavoritedClub } from "../types";
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
      clubs:club_id (
        *,
        club_images (
          id,
          url,
          type
        )
      )
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

export async function getFriendsWhoFavoritedClub(
  userId: string,
  clubId: string
): Promise<FriendWhoFavoritedClub[]> {
  try {
    // Get the user's friends
    const { data: friendships, error: friendsError } = await supabase
      .from("friends")
      .select("user_id, friend_id, status")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    if (friendsError) throw friendsError;
    if (!friendships || friendships.length === 0) return [];

    // Extract friend IDs
    const friendIds = friendships.map((friendship) =>
      friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    );

    // Get friends who have favorited this club
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("user_id, club_id")
      .eq("club_id", clubId)
      .in("user_id", friendIds);

    if (favError) throw favError;
    if (!favorites || favorites.length === 0) return [];

    // Get profile data for these users
    const favoritedUserIds = favorites.map((fav) => fav.user_id);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, first_name, last_name")
      .in("id", favoritedUserIds);

    if (profilesError) throw profilesError;

    // Map profiles to match the expected structure
    return (
      profiles?.map((profile) => ({
        user_id: profile.id,
        profiles: profile,
      })) || []
    );
  } catch (error) {
    console.error("Error getting friends who favorited club:", error);
    return [];
  }
}
