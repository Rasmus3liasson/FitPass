export interface GymVisit {
  gym_id: string;
  visit_count: number;
}

export interface GymCut {
  gym_id: string;
  amount: number;
  visits?: number;
}

export interface CutCalculation {
  gymCuts: GymCut[];
  fitpassRevenue: number;
  totalGymCut: number;
  gymCount: number;
}

export interface PaymentIntentParams {
  customerId: string;
  amount: number;
  currency: string;
  planId: string;
  userId: string;
  cutCalculation: CutCalculation;
}

export interface PaymentLog {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  gym_cuts: GymCut[];
  fitpass_revenue: number;
  metadata: {
    gym_count: number;
    plan_type: "tiered" | "unlimited";
    gym_visits?: GymVisit[];
  };
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  title: string;
  type: "tiered" | "unlimited";
  credits: number;
  price: number;
  stripe_price_id: string;
  stripe_product_id: string;
  per_pass_gym_cut?: number;
  unlimited_gym_cuts?: {
    [key: string]: number; // e.g., { "1": 650, "2": 500, "3": 395 }
  };
}

export interface PaymentCutConfig {
  tiered_per_pass_cut: number;
  unlimited_gym_cuts: {
    [key: string]: number;
  };
}

export interface GymTransferLog {
  id: string;
  payment_log_id: string;
  gym_id: string;
  stripe_transfer_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  metadata: {
    gym_name: string;
    visits?: number;
  };
  created_at: string;
  updated_at: string;
}
