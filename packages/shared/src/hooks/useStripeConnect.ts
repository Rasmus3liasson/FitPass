import {
    createStripeOnboarding,
    createStripeUpdateLink,
    getMyClub,
    getStripeConnectStatus,
    refreshClubData,
} from '../services/stripeConnectService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';

/**
 * Hook to get the authenticated user's club
 */
export const useMyClub = () => {
  return useQuery({
    queryKey: ['myClub'],
    queryFn: getMyClub,
  });
};

/**
 * Hook to get Stripe Connect status
 */
export const useStripeConnectStatus = () => {
  return useQuery({
    queryKey: ['stripeConnectStatus'],
    queryFn: getStripeConnectStatus,
  });
};

/**
 * Hook to create Stripe Connect onboarding
 */
export const useCreateStripeOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnUrl,
      refreshUrl,
    }: {
      returnUrl: string;
      refreshUrl: string;
    }) => {
      const result = await createStripeOnboarding(returnUrl, refreshUrl);
      // Open the Stripe onboarding URL
      await Linking.openURL(result.url);
      return result;
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['myClub'] });
      queryClient.invalidateQueries({ queryKey: ['stripeConnectStatus'] });
    },
  });
};

/**
 * Hook to create Stripe Connect update link
 */
export const useCreateStripeUpdateLink = () => {
  return useMutation({
    mutationFn: async ({
      returnUrl,
      refreshUrl,
    }: {
      returnUrl: string;
      refreshUrl: string;
    }) => {
      const result = await createStripeUpdateLink(returnUrl, refreshUrl);
      // Open the Stripe update URL
      await Linking.openURL(result.url);
      return result;
    },
  });
};

/**
 * Hook to refresh club data
 */
export const useRefreshClubData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshClubData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myClub'] });
      queryClient.invalidateQueries({ queryKey: ['stripeConnectStatus'] });
    },
  });
};
