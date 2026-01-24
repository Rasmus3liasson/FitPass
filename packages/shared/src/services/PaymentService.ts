import { supabase } from '../lib/integrations/supabase/supabaseClient';
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface PaymentMembershipPlan {
  id: string;
  title: string;
  type: 'tiered' | 'unlimited';
  credits: number;
  price: number;
  stripe_price_id: string;
  stripe_product_id: string;
  per_pass_gym_cut?: number;
  unlimited_gym_cuts?: {
    [key: string]: number;
  };
}

export interface GymVisit {
  gym_id: string;
  visit_count: number;
}

export interface PaymentRequest {
  planId: string;
  gymVisits?: GymVisit[];
}

export interface PaymentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntent: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  cutCalculation: {
    gymCuts: Array<{ gym_id: string; amount: number; visits?: number }>;
    fitpassRevenue: number;
    totalGymCut: number;
    gymCount: number;
  };
  error?: string;
}

export interface PaymentLog {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  gym_cuts: Array<{ gym_id: string; amount: number; visits?: number }>;
  fitpass_revenue: number;
  metadata: {
    gym_count: number;
    plan_type: string;
    gym_visits?: GymVisit[];
  };
  created_at: string;
  membership_plans?: {
    id: string;
    title: string;
    type: string;
    price: number;
  };
}

class PaymentService {
  /**
   * Create a payment intent for a subscription plan
   */
  async createPayment(userId: string, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${BACKEND_URL}/api/stripe/user/${userId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed');
      }

      return data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getUserPayments(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaymentLog[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${BACKEND_URL}/api/stripe/user/${userId}/payments?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }

      return data.payments || [];
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      throw error;
    }
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<PaymentLog | null> {
    try {
      const { data, error } = await supabase
        .from('payment_logs')
        .select(
          `
          *,
          membership_plans (
            id,
            title,
            type,
            price
          )
        `
        )
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  async getGymTransfers(paymentLogId: string) {
    try {
      const { data, error } = await supabase
        .from('gym_transfer_logs')
        .select(
          `
          *,
          clubs:gym_id (
            id,
            name,
            type
          )
        `
        )
        .eq('payment_log_id', paymentLogId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching gym transfers:', error);
      throw error;
    }
  }

  async getCutConfig() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${BACKEND_URL}/api/stripe/cut-config`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cut config');
      }

      return data.config;
    } catch (error) {
      console.error('Error fetching cut config:', error);
      // Return default config
      return {
        tiered_per_pass_cut: 80,
        unlimited_gym_cuts: {
          '1': 650,
          '2': 500,
          '3': 395,
        },
      };
    }
  }

  async calculateCutPreview(
    plan: PaymentMembershipPlan,
    gymVisits: GymVisit[] = []
  ): Promise<{
    total_price: number;
    gym_cut: number;
    fitpass_cut: number;
    gym_count: number;
    cut_per_gym?: number;
  }> {
    try {
      const cutConfig = await this.getCutConfig();
      const planType = plan.type || 'tiered';
      let totalGymCut = 0;
      let cutPerGym = 0;

      if (planType === 'tiered') {
        const perPassCut = plan.per_pass_gym_cut || cutConfig.tiered_per_pass_cut;
        const totalPasses = gymVisits.reduce((sum, v) => sum + v.visit_count, 0);
        totalGymCut = perPassCut * totalPasses;
        cutPerGym = perPassCut;
      } else if (planType === 'unlimited') {
        const uniqueGyms = new Set(gymVisits.map((v) => v.gym_id));
        const gymCount = uniqueGyms.size;
        const unlimitedCuts = plan.unlimited_gym_cuts || cutConfig.unlimited_gym_cuts;
        cutPerGym = unlimitedCuts[gymCount.toString()] || unlimitedCuts['3'];
        totalGymCut = cutPerGym * gymCount;
      }

      const fitpassCut = plan.price - totalGymCut;
      const gymCount = new Set(gymVisits.map((v) => v.gym_id)).size;

      return {
        total_price: plan.price,
        gym_cut: totalGymCut,
        fitpass_cut: fitpassCut,
        gym_count: gymCount,
        cut_per_gym: cutPerGym,
      };
    } catch (error) {
      console.error('Error calculating cut preview:', error);
      throw error;
    }
  }

  async getRevenueStats() {
    try {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('amount, gym_cuts, fitpass_revenue, status')
        .eq('status', 'succeeded');

      if (error) throw error;

      const stats = (data || []).reduce(
        (acc: any, payment: any) => {
          const gymCut =
            payment.gym_cuts?.reduce((sum: number, cut: any) => sum + cut.amount, 0) || 0;
          return {
            total_revenue: acc.total_revenue + payment.amount,
            gym_revenue: acc.gym_revenue + gymCut,
            platform_revenue: acc.platform_revenue + payment.fitpass_revenue,
            transaction_count: acc.transaction_count + 1,
          };
        },
        {
          total_revenue: 0,
          gym_revenue: 0,
          platform_revenue: 0,
          transaction_count: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }

  subscribeToPaymentUpdates(userId: string, callback: (payment: PaymentLog) => void) {
    return supabase
      .channel('payment_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          callback(payload.new as PaymentLog);
        }
      )
      .subscribe();
  }
}

export const paymentService = new PaymentService();
