import { useQuery } from '@tanstack/react-query';
import {
  getMembershipPlans,
  getMembershipPlansWithoutTrial,
} from '../lib/integrations/supabase/queries/membershipQueries';

export const useMembershipPlans = (includeTrial: boolean = true) => {
  return useQuery({
    queryKey: ['membershipPlans', { includeTrial }],
    queryFn: () => (includeTrial ? getMembershipPlans() : getMembershipPlansWithoutTrial()),
  });
};
