import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SubscriptionWithDetails } from '@/types/stripe';

export const useStripeSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stripe/get-subscription?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (email: string, name?: string) => {
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, userId: user.id }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create customer');
    }

    return data;
  };

  const createSubscription = async (priceId: string) => {
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId: user.id }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create subscription');
    }

    // Refresh subscription data
    await fetchSubscription();
    
    return data;
  };

  const cancelSubscription = async (immediate = false) => {
    if (!user) throw new Error('User not authenticated');

    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, immediate }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel subscription');
    }

    // Refresh subscription data
    await fetchSubscription();
    
    return data;
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return {
    subscription,
    loading,
    error,
    createCustomer,
    createSubscription,
    cancelSubscription,
    refreshSubscription: fetchSubscription,
    formatPrice,
    formatDate,
  };
};