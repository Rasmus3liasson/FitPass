/**
 * FitPass Business Configuration Template
 *
 * Copy this file to businessConfig.ts and edit values for your setup.
 *
 * cp businessConfig.example.ts businessConfig.ts
 */

// Model C Payouts (Unlimited Subscription)
export const MODELL_C_PAYOUTS = {
  ONE_GYM: 550, // SEK per visit when user visits only this gym
  TWO_GYMS: 450, // SEK per visit when user visits 2 gyms total
  THREE_PLUS: 350, // SEK per visit when user visits 3+ gyms
} as const;

// Credit System
export const CREDIT_VISIT_PAYOUT = 90; // SEK per credit visit
export const DEFAULT_CREDITS_PER_VISIT = 1;

// Platform Fees
export const PLATFORM_FEE_PERCENTAGE = 0; // 0 = no fee, 0.15 = 15% fee
export const MINIMUM_PAYOUT_AMOUNT = 100; // SEK

// Cron Schedules (cron syntax)
export const PAYOUT_GENERATION_SCHEDULE = "0 23 28-31 * *"; // Daily 28-31 at 11 PM
export const PAYOUT_TRANSFER_SCHEDULE = "30 23 28-31 * *"; // Daily 28-31 at 11:30 PM

// Subscription Pricing (must match Stripe)
export const SUBSCRIPTION_PRICES = {
  UNLIMITED: 749,
  CREDITS_10: 299,
  CREDITS_20: 499,
  TRIAL: 0,
} as const;

// Helper Functions
export function calculateModellCPayoutPerVisit(
  uniqueGymsVisited: number,
): number {
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
