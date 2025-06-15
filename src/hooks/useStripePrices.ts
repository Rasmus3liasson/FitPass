import { useState, useEffect } from 'react';
import { StripePrice, StripeProduct } from '@/types/stripe';

interface PriceWithProduct extends StripePrice {
  product: StripeProduct;
}

export const useStripePrices = () => {
  const [prices, setPrices] = useState<PriceWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/get-prices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prices');
      }

      setPrices(data.prices);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'per month';
      case 'year':
        return 'per year';
      default:
        return `per ${interval}`;
    }
  };

  return {
    prices,
    loading,
    error,
    refreshPrices: fetchPrices,
    formatPrice,
    getIntervalText,
  };
};