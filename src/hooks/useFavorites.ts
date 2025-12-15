import { FavoriteClub, FriendWhoFavoritedClub } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavorite,
  checkIsFavorite,
  getFriendsWhoFavoritedClub,
  getUserFavorites,
  removeFavorite,
} from "../lib/integrations/supabase/queries/favoriteQueries";

export const useFavorites = (userId: string) => {
  return useQuery<FavoriteClub[]>({
    queryKey: ["favorites", userId],
    queryFn: () => getUserFavorites(userId),
    enabled: !!userId,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, clubId }: { userId: string; clubId: string }) =>
      addFavorite(userId, clubId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] });
      queryClient.invalidateQueries({ 
        queryKey: ["isFavorite", variables.userId, variables.clubId] 
      });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, clubId }: { userId: string; clubId: string }) =>
      removeFavorite(userId, clubId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] });
      queryClient.invalidateQueries({ 
        queryKey: ["isFavorite", variables.userId, variables.clubId] 
      });
    },
  });
};

export const useIsFavorite = (userId: string, clubId: string) => {
  return useQuery<boolean>({
    queryKey: ["isFavorite", userId, clubId],
    queryFn: () => checkIsFavorite(userId, clubId),
    enabled: !!userId && !!clubId,
  });
};

export const useFriendsWhoFavoritedClub = (userId: string, clubId: string) => {
  return useQuery<FriendWhoFavoritedClub[]>({
    queryKey: ["friendsWhoFavoritedClub", userId, clubId],
    queryFn: () => getFriendsWhoFavoritedClub(userId, clubId),
    enabled: !!userId && !!clubId,
  });
}; 