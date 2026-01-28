/**
 FitPass Business Configuration
 Edit these values to change payouts, pricing, and schedules
 Note: SUBSCRIPTION_PRICES and CREDITS_PER_TIER are loaded dynamically from database
 to ensure they match Stripe. See dynamicConfig.ts
 */

import * as dynamicConfig from './dynamicConfig';

// Model C Payouts (Unlimited Subscription)
export const MODELL_C_PAYOUTS = {
  ONE_GYM: 550,
  TWO_GYMS: 450,
  THREE_PLUS: 350,
} as const;

// Credit System
export const CREDIT_VISIT_PAYOUT = 90; // SEK per credit visit

// Platform Fees
export const PLATFORM_FEE_PERCENTAGE = 0; // 0 = no fee, 0.15 = 15%
export const MINIMUM_PAYOUT_AMOUNT = 100; // SEK

// Cron Schedules
export const PAYOUT_GENERATION_SCHEDULE = '0 23 28-31 * *'; // Daily 28-31 at 11 PM
export const PAYOUT_TRANSFER_SCHEDULE = '30 23 28-31 * *'; // Daily 28-31 at 11:30 PM

// Dynamic Config Functions (loaded from database/Stripe)
export const getSubscriptionPrices = dynamicConfig.getAllSubscriptionPrices;
export const getCreditsPerTier = dynamicConfig.getAllCreditsPerTier;
export const getDefaultCreditsPerVisit = async () => {
  const config = await dynamicConfig.getDynamicConfig();
  return config.defaultCreditsPerVisit;
};

// Static fallback values (used only if database is unavailable)
export const SUBSCRIPTION_PRICES_FALLBACK = {
  UNLIMITED: 749,
  CREDITS_10: 299,
  CREDITS_20: 499,
  TRIAL: 0,
} as const;

export const CREDITS_PER_TIER_FALLBACK = {
  CREDITS_10: 10,
  CREDITS_20: 20,
} as const;

// Stripe Fees (reference)
export const STRIPE_FEES = {
  PERCENTAGE: 0.014, // 1.4%
  FIXED: 1.8, // SEK
} as const;

// Visit Limits
export const VISIT_COOLDOWN_HOURS = 4;
export const MAX_VISITS_PER_DAY = 3;

// Stripe Connect
export const STRIPE_CONNECT_PAYOUT_SCHEDULE = {
  INTERVAL: 'monthly' as const,
  MONTHLY_ANCHOR: 1,
} as const;

export const CONNECT_REQUIREMENTS = {
  BUSINESS_TYPE: 'company' as const,
  REQUIRE_BANK_ACCOUNT: true,
  REQUIRE_BUSINESS_PROFILE: true,
} as const;

// Trial Period
export const TRIAL_PERIOD_DAYS = 7;
export const TRIAL_UNLIMITED_VISITS = true;
export const TRIAL_CREDITS = 5;

// Helper Functions
export function calculateModellCPayoutPerVisit(uniqueGymsVisited: number): number {
  if (uniqueGymsVisited === 1) return MODELL_C_PAYOUTS.ONE_GYM;
  if (uniqueGymsVisited === 2) return MODELL_C_PAYOUTS.TWO_GYMS;
  if (uniqueGymsVisited >= 3) return MODELL_C_PAYOUTS.THREE_PLUS;
  return 0;
}

export function calculatePlatformFee(grossAmount: number): number {
  return Math.round(grossAmount * PLATFORM_FEE_PERCENTAGE);
}

export function calculateNetPayout(grossAmount: number): number {
  return grossAmount - calculatePlatformFee(grossAmount);
}

export function estimateStripeFee(amount: number): number {
  return Math.round(amount * STRIPE_FEES.PERCENTAGE + STRIPE_FEES.FIXED);
}

// Validation
export function validateConfiguration(): void {
  const errors: string[] = [];

  if (MODELL_C_PAYOUTS.ONE_GYM <= 0) errors.push('ONE_GYM must be positive');
  if (MODELL_C_PAYOUTS.TWO_GYMS <= 0) errors.push('TWO_GYMS must be positive');
  if (MODELL_C_PAYOUTS.THREE_PLUS <= 0) errors.push('THREE_PLUS must be positive');
  if (CREDIT_VISIT_PAYOUT <= 0) errors.push('CREDIT_VISIT_PAYOUT must be positive');
  if (MODELL_C_PAYOUTS.ONE_GYM < MODELL_C_PAYOUTS.THREE_PLUS) {
    errors.push('ONE_GYM should be >= THREE_PLUS');
  }
  if (MINIMUM_PAYOUT_AMOUNT < 0) errors.push('MINIMUM_PAYOUT_AMOUNT cannot be negative');
  if (PLATFORM_FEE_PERCENTAGE < 0 || PLATFORM_FEE_PERCENTAGE > 1) {
    errors.push('PLATFORM_FEE_PERCENTAGE must be 0-1');
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
}

validateConfiguration();
