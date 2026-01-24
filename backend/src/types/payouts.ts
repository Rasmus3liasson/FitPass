// =====================================================
// SUBSCRIPTION PAYOUT SYSTEM TYPES
// =====================================================

export type SubscriptionType = 'unlimited' | 'credits';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

// =====================================================
// DATABASE TYPES
// =====================================================

export interface Visit {
  id: string;
  user_id: string;
  club_id: string;
  created_at: string;
  subscription_type?: SubscriptionType;
  cost_to_club?: number;
  unique_monthly_visit?: boolean;
  payout_processed?: boolean;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  club_id: string;
  subscription_period: string; // YYYY-MM-01
  visit_count: number;
  unique_visit: boolean;
  subscription_type: SubscriptionType;
  created_at: string;
  updated_at: string;
}

export interface PayoutToClub {
  id: string;
  club_id: string;
  payout_period: string; // YYYY-MM-01

  // Payout breakdown
  unlimited_amount: number;
  credits_amount: number;
  total_amount: number;

  // Visit statistics
  unlimited_visits: number;
  credits_visits: number;
  total_visits: number;
  unique_users: number;

  // Stripe transfer info
  status: PayoutStatus;
  stripe_transfer_id?: string | null;
  stripe_payout_id?: string | null;
  transfer_attempted_at?: string | null;
  transfer_completed_at?: string | null;

  // Error handling
  error_message?: string | null;
  retry_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  stripe_account_id?: string | null;
  credits: number; // Credits required per visit
  payouts_enabled?: boolean;
}

export interface UserProfile {
  id: string;
  credits?: number;
  subscription_type?: SubscriptionType;
}

// =====================================================
// CALCULATION TYPES
// =====================================================

export interface ModellCPayoutTier {
  uniqueGyms: number;
  payoutPerGym: number;
}

export const MODELL_C_TIERS: ModellCPayoutTier[] = [
  { uniqueGyms: 1, payoutPerGym: 550 },
  { uniqueGyms: 2, payoutPerGym: 450 },
  { uniqueGyms: 3, payoutPerGym: 350 }, // 3+
];

export const CREDIT_VISIT_PAYOUT = 90; // SEK per credit visit

export interface UserMonthlyUsage {
  userId: string;
  subscriptionType: SubscriptionType;
  uniqueGymsVisited: number;
  gymVisits: {
    clubId: string;
    visitCount: number;
    isUnique: boolean;
  }[];
}

export interface ClubPayoutCalculation {
  clubId: string;
  clubName: string;
  period: string;

  // Unlimited (Modell C) calculations
  unlimitedUsers: {
    userId: string;
    uniqueGymsCount: number;
    payoutPerVisit: number;
    visitCount: number;
    totalPayout: number;
  }[];
  unlimitedAmount: number;
  unlimitedVisits: number;

  // Credit-based calculations
  creditsUsers: {
    userId: string;
    visitCount: number;
    totalPayout: number;
  }[];
  creditsAmount: number;
  creditsVisits: number;

  // Totals
  totalAmount: number;
  totalVisits: number;
  uniqueUsers: number;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface LogVisitRequest {
  userId: string;
  clubId: string;
  subscriptionType: SubscriptionType;
  visitDate?: string; // Optional, defaults to now
}

export interface LogVisitResponse {
  success: boolean;
  visitId: string;
  costToClub: number;
  uniqueMonthlyVisit: boolean;
  subscriptionUsage: SubscriptionUsage;
  creditsRemaining?: number;
}

export interface GeneratePayoutsRequest {
  period?: string; // YYYY-MM-01, defaults to last month
  clubIds?: string[]; // Optional: generate for specific clubs only
}

export interface GeneratePayoutsResponse {
  success: boolean;
  period: string;
  clubsProcessed: number;
  totalAmount: number;
  payouts: PayoutToClub[];
}

export interface SendPayoutTransfersRequest {
  period?: string; // YYYY-MM-01, defaults to last month
  clubIds?: string[]; // Optional: send for specific clubs only
}

export interface SendPayoutTransfersResponse {
  success: boolean;
  period: string;
  transfersAttempted: number;
  transfersSucceeded: number;
  transfersFailed: number;
  results: {
    clubId: string;
    clubName: string;
    amount: number;
    status: 'success' | 'failed';
    stripeTransferId?: string;
    errorMessage?: string;
  }[];
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface PayoutCalculationContext {
  period: string;
  allVisits: Visit[];
  allUsage: SubscriptionUsage[];
  clubs: Map<string, Club>;
  users: Map<string, UserProfile>;
}
