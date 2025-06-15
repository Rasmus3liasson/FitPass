import { FavoriteClub } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getUserFavorites } from "../lib/integrations/supabase/queries/favoriteQueries";

export const useFavorites = (userId: string) => {
  return useQuery<FavoriteClub[]>({
    queryKey: ["favorites", userId],
    queryFn: () => getUserFavorites(userId),
    enabled: !!userId,
  });
}; 