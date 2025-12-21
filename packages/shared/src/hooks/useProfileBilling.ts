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
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(user?.id || "");
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  

  // Extract billing details from user profile
  useEffect(() => {
    if (userProfile || user) {
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
    }
  }, [userProfile, user]);

  // Check if all required billing fields are present
  const hasCompleteBillingInfo = useCallback(() => {
    if (!billingDetails) return false;
    return !!(
      billingDetails.name &&
      billingDetails.email &&
      billingDetails.address?.line1
    );
  }, [billingDetails]);

  // Get missing fields for billing
  const getMissingBillingFields = useCallback(() => {
    if (!billingDetails) return ['Namn', 'E-post', 'Adress'];
    const missing: string[] = [];
    if (!billingDetails.name) missing.push('Namn');
    if (!billingDetails.email) missing.push('E-post');
    if (!billingDetails.address?.line1) missing.push('Adress');
    return missing;
  }, [billingDetails]);

  // Simulate autofill from profile
  const createCustomerFromProfile = useCallback(async () => {
    setIsUpdating(true);
    // Simulate async update
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsUpdating(false);
    setBillingDetails((prev) => ({ ...prev }));
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

