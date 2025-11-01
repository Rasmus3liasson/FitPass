import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/integrations/supabase/supabaseClient';

export interface SelectedGym {
  id: string;
  gym_id: string;
  gym_name: string;
  gym_address?: string;
  gym_image?: string;
  added_at: string;
  effective_from: string;
  status: 'pending' | 'active' | 'removed';
}

export interface DailyAccessStatus {
  hasDailyAccess: boolean;
  maxSlots: number;
  subscription?: any;
}

export interface DailyAccessData {
  current: SelectedGym[];
  pending: SelectedGym[];
  maxSlots: number;
}

// Hook to check if user has Daily Access membership
export function useDailyAccessStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['dailyAccessStatus', userId],
    queryFn: async (): Promise<DailyAccessStatus> => {
      if (!userId) {
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      // First check if user has any membership
      const { data: allMemberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_plans (
            id,
            title,
            price,
            max_daily_gyms
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      console.log('All memberships for user:', allMemberships);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      // Find membership with Daily Access (max_daily_gyms > 0)
      const membership = allMemberships?.find(m => 
        m.membership_plans?.max_daily_gyms && m.membership_plans.max_daily_gyms > 0
      );

      if (!membership) {
        console.log('No membership with Daily Access found');
        return { hasDailyAccess: false, maxSlots: 0 };
      }

      console.log('Daily Access Status Query Result:', membership);

      const hasDailyAccess = !!membership?.membership_plans?.max_daily_gyms;
      const maxSlots = membership?.membership_plans?.max_daily_gyms || 0;

      // TEMPORARY: Enable for all users during testing
      const enableForTesting = true;

      return {
        hasDailyAccess: enableForTesting || hasDailyAccess,
        maxSlots: enableForTesting ? 3 : maxSlots,
        subscription: membership || null
      };
    },
    enabled: !!userId,
  });
}

// Hook to get user's selected gyms
export function useDailyAccessGyms(userId: string | undefined) {
  return useQuery({
    queryKey: ['dailyAccessGyms', userId],
    queryFn: async (): Promise<DailyAccessData> => {
      if (!userId) {
        return { current: [], pending: [], maxSlots: 0 };
      }

      console.log('Fetching Daily Access gyms for user:', userId);

      // Use same logic as useDailyAccessStatus for consistency
      const { data: allMemberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_plans (
            id,
            title,
            price,
            max_daily_gyms
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      console.log('Memberships in useDailyAccessGyms:', allMemberships);

      if (membershipError) {
        console.error('Error fetching memberships in useDailyAccessGyms:', membershipError);
      }

      // Find membership with Daily Access (max_daily_gyms > 0)
      const membership = allMemberships?.find(m => 
        m.membership_plans?.max_daily_gyms && m.membership_plans.max_daily_gyms > 0
      );

      const maxSlots = membership?.membership_plans?.max_daily_gyms || 0;

      // TEMPORARY: Enable for all users during testing (same as useDailyAccessStatus)
      const enableForTesting = true;
      const finalMaxSlots = enableForTesting ? 3 : maxSlots;

      console.log('Max slots determined:', { maxSlots, enableForTesting, finalMaxSlots });

      // Continue even if no membership found (for testing)
      if (!enableForTesting && !maxSlots) {
        return { current: [], pending: [], maxSlots: 0 };
      }

      // Get user selected gyms directly from the table
      console.log('About to query user_selected_gyms with userId:', userId);
      const { data: selectedGyms, error } = await supabase
        .from('user_selected_gyms')
        .select(`
          id,
          club_id,
          added_at,
          effective_from,
          status,
          clubs (
            id,
            name,
            address,
            image_url
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);

      if (error) {
        console.error('Error fetching selected gyms:', error);
        console.error('Query details - userId:', userId);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return { current: [], pending: [], maxSlots: finalMaxSlots };
      }

      console.log('Raw selected gyms data:', selectedGyms);

      // Transform the data
      const transformedGyms: SelectedGym[] = (selectedGyms || []).map((gym: any) => ({
        id: gym.id,
        gym_id: gym.club_id,
        gym_name: gym.clubs.name,
        gym_address: gym.clubs.address,
        gym_image: gym.clubs.image_url,
        added_at: gym.added_at,
        effective_from: gym.effective_from,
        status: gym.status,
      }));

      // Separate current and pending
      const current = transformedGyms.filter(gym => gym.status === 'active');
      const pending = transformedGyms.filter(gym => gym.status === 'pending');

      console.log('Transformed gyms - current:', current.length, 'pending:', pending.length);

      return {
        current,
        pending,
        maxSlots: finalMaxSlots,
      };
    },
    enabled: !!userId,
  });
}

// Hook to add a gym to Daily Access
export function useAddDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, gymId }: { userId: string; gymId: string }) => {
      console.log('Adding gym to Daily Access:', { userId, gymId });

      // Check current selections count
      const { count } = await supabase
        .from('user_selected_gyms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);

      const maxSlots = 3; // Default max, could be fetched from membership
      if ((count || 0) >= maxSlots) {
        throw new Error('Du har redan nått max antal gym för Daily Access');
      }

      // Check if gym is already selected
      const { data: existing } = await supabase
        .from('user_selected_gyms')
        .select('id')
        .eq('user_id', userId)
        .eq('club_id', gymId)
        .in('status', ['active', 'pending'])
        .single();

      if (existing) {
        throw new Error('Detta gym är redan valt för Daily Access');
      }

      // Calculate effective date (next billing cycle)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Add the gym (will be pending until next billing cycle)
      const { error } = await supabase
        .from('user_selected_gyms')
        .insert({
          user_id: userId,
          club_id: gymId,
          effective_from: nextMonth.toISOString(),
          status: 'pending',
        });

      if (error) {
        console.error('Error adding gym:', error);
        throw new Error('Kunde inte lägga till gym i Daily Access');
      }

      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['dailyAccessGyms', userId] });
    },
  });
}

// Hook to remove a gym from Daily Access
export function useRemoveDailyAccessGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, gymId }: { userId: string; gymId: string }) => {
      console.log('Removing gym from Daily Access:', { userId, gymId });

      const { error } = await supabase
        .from('user_selected_gyms')
        .update({ status: 'removed' })
        .eq('user_id', userId)
        .eq('club_id', gymId)
        .in('status', ['active', 'pending']);

      if (error) {
        console.error('Error removing gym:', error);
        throw new Error('Kunde inte ta bort gym från Daily Access');
      }

      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['dailyAccessGyms', userId] });
    },
  });
}

// Hook to get a single gym's Daily Access status
export function useGymDailyAccessStatus(userId: string | undefined, gymId: string | undefined) {
  return useQuery({
    queryKey: ['gymDailyAccessStatus', userId, gymId],
    queryFn: async () => {
      if (!userId || !gymId) return { isSelected: false, status: null };

      const { data } = await supabase
        .from('user_selected_gyms')
        .select('status')
        .eq('user_id', userId)
        .eq('club_id', gymId)
        .in('status', ['active', 'pending'])
        .single();

      return {
        isSelected: !!data,
        status: data?.status || null,
      };
    },
    enabled: !!userId && !!gymId,
  });
}