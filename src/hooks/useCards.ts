import { addUserCard, deleteUserCard, getUserCards } from "@/src/lib/integrations/supabase/queries/cardQueries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUserCards = (userId: string) => {
  return useQuery({
    queryKey: ["userCards", userId],
    queryFn: () => getUserCards(userId),
    enabled: !!userId,
  });
};

export const useAddUserCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUserCard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userCards", variables.userId] });
    },
  });
};

export const useDeleteUserCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, userId }: { cardId: string; userId: string }) => deleteUserCard(cardId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userCards", variables.userId] });
    },
  });
}; 