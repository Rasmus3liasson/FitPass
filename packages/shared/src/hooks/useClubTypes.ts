import { supabase } from '../lib/integrations/supabase/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export interface ClubType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useClubTypes = () => {
  return useQuery({
    queryKey: ['club-types'],
    queryFn: async (): Promise<ClubType[]> => {
      const { data, error } = await supabase
        .from('club_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch club types: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes (renamed from cacheTime in newer versions)
  });
};
