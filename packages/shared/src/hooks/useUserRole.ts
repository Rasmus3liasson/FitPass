import { useQuery } from '@tanstack/react-query';

export const useUserRole = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userRole', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // 🚧 TEMPORARY MOCK DATA - Remove when database role is set up
      return 'club'; // Mock role for development

      // Original database query (commented out for now)
      /*
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return profile?.role;
      */
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

// Helper hook to check if user has a specific role
export const useHasRole = (userId: string | undefined, requiredRole: string) => {
  const { data: userRole, isLoading, error } = useUserRole(userId);

  return {
    hasRole: userRole === requiredRole,
    userRole,
    isLoading,
    error,
  };
};
