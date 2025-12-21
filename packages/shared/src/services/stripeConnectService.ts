import { supabase } from "../lib/integrations/supabase/supabaseClient";
import type {
    Club,
    StripeConnectOnboardingResponse,
    StripeConnectStatus,
    StripeConnectUpdateLinkResponse,
} from "../types";

const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
};

export async function getMyClub(): Promise<Club | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No club found
    }
    throw error;
  }

  return data;
}

export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  const club = await getMyClub();

  if (!club) {
    return {
      connected: false,
      payoutsEnabled: false,
      onboardingComplete: false,
    };
  }

  return {
    connected: !!club.stripe_account_id,
    accountId: club.stripe_account_id || undefined,
    payoutsEnabled: club.payouts_enabled || false,
    kycStatus: club.kyc_status || undefined,
    onboardingComplete: club.stripe_onboarding_complete || false,
  };
}

export async function createStripeOnboarding(
  returnUrl: string,
  refreshUrl: string
): Promise<StripeConnectOnboardingResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${getApiUrl()}/api/stripe/connect/onboarding`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      returnUrl,
      refreshUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create onboarding link");
  }

  return data;
}

export async function createStripeUpdateLink(
  returnUrl: string,
  refreshUrl: string
): Promise<StripeConnectUpdateLinkResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${getApiUrl()}/api/stripe/connect/update-link`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        returnUrl,
        refreshUrl,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create update link");
  }

  return data;
}

export async function refreshClubData(): Promise<Club | null> {
  return getMyClub();
}
