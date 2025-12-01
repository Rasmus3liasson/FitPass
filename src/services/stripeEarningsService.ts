import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";

const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
};

export interface EarningsBreakdown {
  planName: string;
  visitCount: number;
  estimatedRevenue: number;
  uniqueUsers: number;
}

export interface ClubEarnings {
  totalAmount: number;
  totalPayouts: number;
  availableBalance: number;
  currency: string;
  period: string;
  breakdown: EarningsBreakdown[];
  uniqueUsers: number;
  totalVisits: number;
  transferCount: number;
  payoutCount: number;
}

export interface StripeInvoice {
  id: string;
  amount: number;
  currency: string;
  type: string;
  description: string | null;
  created: number;
  fee: number;
  net: number;
  status: string;
  availableOn: number;
}

export async function getClubEarnings(
  clubId: string,
  period: "week" | "month" | "quarter" | "year" = "month"
): Promise<{
  success: boolean;
  hasStripeAccount: boolean;
  earnings?: ClubEarnings;
  message?: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${getApiUrl()}/api/stripe/earnings/${clubId}?period=${period}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch earnings");
  }

  return data;
}

export async function getClubInvoices(
  clubId: string,
  limit: number = 12
): Promise<{
  success: boolean;
  hasStripeAccount: boolean;
  invoices: StripeInvoice[];
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${getApiUrl()}/api/stripe/earnings/${clubId}/invoices?limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch invoices");
  }

  return data;
}

export async function getInvoiceDetails(
  clubId: string,
  invoiceId: string
): Promise<{
  success: boolean;
  transaction: any;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${getApiUrl()}/api/stripe/earnings/${clubId}/invoice/${invoiceId}/download`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch invoice details");
  }

  return data;
}
