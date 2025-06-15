import { UserProfile } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "../lib/integrations/supabase/queries/profileQueries";

export const useUserProfile = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) => updateUserProfile(userId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["userProfile", userId], data);
    },
  });

  return {
    ...query,
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}; 