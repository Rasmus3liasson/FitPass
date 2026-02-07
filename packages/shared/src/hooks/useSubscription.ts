import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSubscription,
  getUserStripeCustomerId,
  updateSubscriptionStatus,
} from '../lib/integrations/supabase/queries/subscriptionQueries';
import { StripeService } from '../services/StripeService';
import { MembershipPlan } from '../types';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const url = `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${user.id}/subscription`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return data.subscription;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plan: MembershipPlan) => {
      if (!user) throw new Error('User not authenticated');

      const stripeService = StripeService.getInstance();

      // Get or create Stripe customer
      let customerId = await getUserStripeCustomerId(user.id);

      if (!customerId) {
        customerId = await stripeService.createCustomer(
          user.email || '',
          user.user_metadata?.display_name || user.user_metadata?.full_name || 'User',
          user.id
        );
      }

      // Create Stripe subscription
      if (!plan.stripe_price_id) {
        throw new Error('Plan does not have a Stripe price ID configured');
      }

      const stripeSubscription = await stripeService.createSubscription(
        customerId,
        plan.stripe_price_id,
        user.id,
        plan.id
      );

      // The backend now handles creating the subscription record in database
      // Just return the Stripe subscription data
      return {
        stripeSubscription,
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      cancelAtPeriodEnd = true,
    }: {
      subscriptionId: string;
      cancelAtPeriodEnd?: boolean;
    }) => {
      const stripeService = StripeService.getInstance();

      // Cancel in Stripe
      const canceledSubscription = await stripeService.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd
      );

      // Update local database
      if (!cancelAtPeriodEnd) {
        await cancelSubscription(subscriptionId);
      } else {
        await updateSubscriptionStatus(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return canceledSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      newPlan,
    }: {
      subscriptionId: string;
      newPlan: MembershipPlan;
    }) => {
      if (!newPlan.stripe_price_id) {
        throw new Error('New plan does not have a Stripe price ID configured');
      }

      const stripeService = StripeService.getInstance();

      // Update subscription in Stripe
      const updatedSubscription = await stripeService.updateSubscription(
        subscriptionId,
        newPlan.stripe_price_id
      );

      // Update local database
      await updateSubscriptionStatus(subscriptionId, {
        status: updatedSubscription.status,
        current_period_start: new Date(
          updatedSubscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      });

      return updatedSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });
};
