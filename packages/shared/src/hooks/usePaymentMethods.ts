import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentMethodService } from '../services/PaymentMethodService';

export function usePaymentMethods(userId: string | undefined, userEmail?: string) {
  return useQuery({
    queryKey: ['paymentMethods', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return await PaymentMethodService.getPaymentMethodsForUser(userId, userEmail);
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    retry: 2,
  });
}

export function useInvalidatePaymentMethods() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['paymentMethods', userId] });
  };
}
