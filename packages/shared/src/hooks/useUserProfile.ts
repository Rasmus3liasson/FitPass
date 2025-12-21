import { UserProfile } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserProfile,
  updateUserProfile,
} from "../lib/integrations/supabase/queries/profileQueries";

export const useUserProfile = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["userProfile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const data = await getUserProfile(userId);

      // Handle case where no profile exists
      if (!data) {
        return null;
      }

      // ✅ Fallback: create a placeholder avatar if missing
      if (!data.avatar_url && (data.first_name || data.last_name)) {
        const fullName = `${data.first_name ?? ""} ${
          data.last_name ?? ""
        }`.trim();
        data.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName || "User"
        )}&background=6366F1&color=fff`;
      }

      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) =>
      updateUserProfile(userId, updates),
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
