import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export interface BillingDetails {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

export function useProfileBilling() {
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(user?.id || '');

  // Initialize as empty object to avoid null spreading issues
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Extract billing details from user profile
  useEffect(() => {
    setBillingDetails({
      name: userProfile?.full_name || '',
      email: user?.email || userProfile?.email || '',
      address: {
        line1: userProfile?.address_line1 || userProfile?.default_location || '',
        city: userProfile?.city || '',
        postal_code: userProfile?.postal_code || '',
        country: userProfile?.country || 'SE',
      },
    });
  }, [userProfile, user]);

  // Check if all required billing fields are present
  const hasCompleteBillingInfo = useCallback(() => {
    return !!(billingDetails.name && billingDetails.email && billingDetails.address?.line1);
  }, [billingDetails]);

  // Get missing fields for billing
  const getMissingBillingFields = useCallback(() => {
    const missing: string[] = [];
    if (!billingDetails.name) missing.push('Namn');
    if (!billingDetails.email) missing.push('E-post');
    if (!billingDetails.address?.line1) missing.push('Adress');
    return missing;
  }, [billingDetails]);

  // Simulate autofill from profile with setTimeout instead of Promise
  const createCustomerFromProfile = useCallback(() => {
    setIsUpdating(true);

    setTimeout(() => {
      setIsUpdating(false);
      // Trigger a re-render without changing data
      setBillingDetails((prev) => ({ ...prev }));
    }, 500);
  }, []);

  return {
    billingDetails,
    hasCompleteBillingInfo,
    getMissingBillingFields,
    createCustomerFromProfile,
    isUpdating,
    userProfile,
    isLoading: profileLoading,
  };
}
