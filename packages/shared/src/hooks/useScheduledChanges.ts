import { useQuery } from '@tanstack/react-query';
import { scheduledChangeService } from '../services/ScheduledChangeService';

export const useScheduledChanges = (userId: string | null) => {
  const {
    data: scheduledChangeData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['scheduledChanges', userId],
    queryFn: () => scheduledChangeService.getScheduledChanges(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    scheduledChangeData: scheduledChangeData || null,
    hasScheduledChange: scheduledChangeData?.hasScheduledChange || false,
    scheduledChange: scheduledChangeData?.scheduledChange || null,
    membership: scheduledChangeData?.membership || null,
    loading,
    error: error?.message || null,
    refetch
  };
};

export default useScheduledChanges;