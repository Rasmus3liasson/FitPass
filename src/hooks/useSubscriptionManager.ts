import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SubscriptionSyncService, {
    SyncResult,
} from "../services/SubscriptionSyncService";
import { useAuth } from "./useAuth";

// Hook för att synka prenumerationer från Stripe
export const useSyncSubscriptions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SubscriptionSyncService.syncSubscriptionsFromStripe(),
    onSuccess: (result: SyncResult) => {
      // Uppdatera cache för användarens medlemskap efter sync
      queryClient.invalidateQueries({ queryKey: ["user-membership"] });
      console.log("✅ Subscription sync completed:", result);
    },
    onError: (error: Error) => {
      console.error("❌ Subscription sync failed:", error);
    },
  });
};

// Hook för att hämta användarens aktiva medlemskap
export const useUserMembership = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available for membership query');
        return null;
      }
      
      // Validera att user.id är ett giltigt UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
        console.error('❌ Invalid UUID format for user ID:', user.id);
        return null;
      }

      console.log('🔍 Fetching membership for user:', user.id);
      try {
        const result = await SubscriptionSyncService.getUserMembership(user.id);
        console.log('✅ Membership result:', result);
        return result;
      } catch (error: any) {
        console.error('❌ Error fetching membership:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minuter
    gcTime: 10 * 60 * 1000, // 10 minuter
    retry: (failureCount, error: any) => {
      // Försök inte igen om det är UUID validerings fel
      if (error?.message?.includes('invalid input syntax for type uuid')) {
        console.log('❌ UUID validation error, not retrying');
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook för att hämta alla membership plans
export const useMembershipPlans = () => {
  return useQuery({
    queryKey: ["membership-plans"],
    queryFn: () => SubscriptionSyncService.getMembershipPlans(),
    staleTime: 10 * 60 * 1000, // 10 minuter
    gcTime: 30 * 60 * 1000, // 30 minuter
  });
};

// Hook för att synka produkter till Stripe
export const useSyncProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SubscriptionSyncService.syncProductsToStripe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
      console.log("✅ Products sync completed");
    },
    onError: (error: Error) => {
      console.error("❌ Products sync failed:", error);
    },
  });
};

// Kombinerad hook som gör båda operationerna
export const useSubscriptionManager = () => {
  const syncMutation = useSyncSubscriptions();
  const membershipQuery = useUserMembership();
  const plansQuery = useMembershipPlans();
  const syncProductsMutation = useSyncProducts();

  const syncAndRefresh = async () => {
    try {
      const result = await syncMutation.mutateAsync();

      // Vänta lite för att låta databasen uppdateras
      setTimeout(() => {
        membershipQuery.refetch();
      }, 1000);

      return result;
    } catch (error) {
      throw error;
    }
  };

  const syncProducts = async () => {
    try {
      const result = await syncProductsMutation.mutateAsync();
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    // Sync functions
    syncSubscriptions: syncAndRefresh,
    syncProducts,
    isSyncing: syncMutation.isPending,
    isSyncingProducts: syncProductsMutation.isPending,
    syncError: syncMutation.error,
    syncProductsError: syncProductsMutation.error,

    // Membership data
    membership: membershipQuery.data,
    isLoadingMembership: membershipQuery.isLoading,
    membershipError: membershipQuery.error,
    refreshMembership: membershipQuery.refetch,

    // Plans data
    plans: plansQuery.data,
    isLoadingPlans: plansQuery.isLoading,
    plansError: plansQuery.error,
    refreshPlans: plansQuery.refetch,

    // Combined states
    isLoading: syncMutation.isPending || membershipQuery.isLoading || plansQuery.isLoading,
    hasError: !!(syncMutation.error || membershipQuery.error || plansQuery.error),
  };
};

export default useSubscriptionManager;
