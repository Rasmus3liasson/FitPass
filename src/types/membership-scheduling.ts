// Types for membership scheduling in the frontend
export interface ScheduledChange {
  id: string;
  planId: string;
  planTitle: string;
  planCredits: number;
  nextBillingDate: string;
  nextBillingDateFormatted: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  confirmed: boolean;
  scheduleId: string | null;
}

export interface MembershipWithSchedule {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: string;
  credits: number;
  credits_used: number;
  is_active: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_status?: string;
  created_at: string;
  updated_at: string;
  scheduledChange?: ScheduledChange;
}

export interface ScheduledChangeResponse {
  success: boolean;
  hasScheduledChange: boolean;
  membership: MembershipWithSchedule;
  scheduledChange?: ScheduledChange;
  message?: string;
  scheduled?: boolean;
  alreadyScheduled?: boolean;
}