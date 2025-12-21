import { supabase } from '../lib/integrations/supabase/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CreditUsage {
  gym_id: string;
  gym_name: string;
  credits_allocated: number;
  credits_used: number;
  credits_remaining: number;
  billing_period_start: string;
  billing_period_end: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  gym_id: string;
  credits_consumed: number;
  transaction_type: string;
  transaction_date: string;
  created_at: string;
  booking_id?: string;
}

// Hook to get real-time credit usage for a user
export function useCreditUsage(userId: string | undefined) {
  return useQuery({
    queryKey: ['creditUsage', userId],
    queryFn: async (): Promise<CreditUsage[]> => {
      if (!userId) return [];

      try {
        // Try using the database function first
        const { data, error } = await supabase
          .rpc('get_user_credit_usage', { user_id_param: userId });

        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.warn('Database function not available, using fallback approach:', functionError);
      }

      // Fallback: Get data manually using direct queries
      try {
        // Get user's active membership to determine billing period
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('start_date, end_date, created_at')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get user's selected gyms
        const { data: selectedGyms, error: gymsError } = await supabase
          .from('user_selected_gyms')
          .select('club_id')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (gymsError) {
          throw new Error(`Failed to get selected gyms: ${gymsError.message}`);
        }

        if (!selectedGyms || selectedGyms.length === 0) {
          return [];
        }

        // Calculate credit distribution
        const gymCount = selectedGyms.length;
        const creditsPerGym = gymCount === 1 ? 30 : gymCount === 2 ? 15 : gymCount === 3 ? 10 : 30;

        // Determine billing period boundaries
        let periodStart: string;
        let periodEnd: string;

        if (membership && !membershipError) {
          // Use membership dates if available
          periodStart = membership.start_date ? new Date(membership.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          periodEnd = membership.end_date ? new Date(membership.end_date).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else {
          // Fallback to current month
          const now = new Date();
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        // Get club names separately to avoid join issues
        const clubIds = selectedGyms.map(gym => gym.club_id);
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name')
          .in('id', clubIds);

        const clubsMap = new Map(clubs?.map(club => [club.id, club.name]) || []);

        // Get credit usage for each gym
        const creditUsagePromises = selectedGyms.map(async (gym) => {
          const { data: transactions } = await supabase
            .from('daily_access_transactions')
            .select('credits_consumed')
            .eq('user_id', userId)
            .eq('gym_id', gym.club_id)
            .gte('transaction_date', periodStart)
            .lte('transaction_date', periodEnd);

          const creditsUsed = transactions?.reduce((sum, t) => sum + (t.credits_consumed || 0), 0) || 0;

          return {
            gym_id: gym.club_id,
            gym_name: clubsMap.get(gym.club_id) || `Club ${gym.club_id}`,
            credits_allocated: creditsPerGym,
            credits_used: creditsUsed,
            credits_remaining: creditsPerGym - creditsUsed,
            billing_period_start: periodStart,
            billing_period_end: periodEnd,
          };
        });

        const creditUsage = await Promise.all(creditUsagePromises);
        return creditUsage;

      } catch (error) {
        console.error('Error in fallback credit usage query:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}

// Hook to get credit transactions history
export function useCreditTransactions(userId: string | undefined, gymId?: string) {
  return useQuery({
    queryKey: ['creditTransactions', userId, gymId],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!userId) return [];

      let query = supabase
        .from('daily_access_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (gymId) {
        query = query.eq('gym_id', gymId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching credit transactions:', error);
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!userId,
  });
}

// Mutation hook to record a gym visit
export function useRecordGymVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      gymId,
      credits = 1,
      bookingId,
    }: {
      userId: string;
      gymId: string;
      credits?: number;
      bookingId?: string;
    }) => {
      const { data, error } = await supabase
        .from('daily_access_transactions')
        .insert({
          user_id: userId,
          gym_id: gymId,
          credits_consumed: credits,
          transaction_type: 'gym_visit',
          booking_id: bookingId,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record gym visit: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['creditUsage', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions', data.user_id, data.gym_id] });
    },
  });
}

// Hook to get credit summary for a user
export function useCreditSummary(userId: string | undefined) {
  const { data: creditUsage, isLoading } = useCreditUsage(userId);

  return {
    data: creditUsage ? {
      totalCreditsAllocated: creditUsage.reduce((sum, usage) => sum + usage.credits_allocated, 0),
      totalCreditsUsed: creditUsage.reduce((sum, usage) => sum + usage.credits_used, 0),
      totalCreditsRemaining: creditUsage.reduce((sum, usage) => sum + usage.credits_remaining, 0),
      gymCount: creditUsage.length,
      gyms: creditUsage,
    } : null,
    isLoading,
  };
}

// Hook to check if user has enough credits for a gym visit
export function useCanVisitGym(userId: string | undefined, gymId: string | undefined) {
  const { data: creditUsage } = useCreditUsage(userId);

  return {
    canVisit: creditUsage?.find(usage => usage.gym_id === gymId)?.credits_remaining ?? 0 > 0,
    remainingCredits: creditUsage?.find(usage => usage.gym_id === gymId)?.credits_remaining ?? 0,
    allocatedCredits: creditUsage?.find(usage => usage.gym_id === gymId)?.credits_allocated ?? 0,
  };
}

// Function to manually refresh credit data (useful after booking or gym selection changes)
export function useRefreshCreditData() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['creditUsage', userId] });
    queryClient.invalidateQueries({ queryKey: ['creditTransactions', userId] });
  };
}