import type { MembershipPlan } from '../services/database';
import { dbService } from '../services/database';

interface DynamicConfig {
  subscriptionPrices: Record<string, number>;
  creditsPerTier: Record<string, number>;
  defaultCreditsPerVisit: number;
  lastFetched: Date;
  plans: MembershipPlan[];
}

let cachedConfig: DynamicConfig | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function fetchDynamicConfig(): Promise<DynamicConfig> {
  try {
    const plans = await dbService.getMembershipPlans();

    const subscriptionPrices: Record<string, number> = {};
    const creditsPerTier: Record<string, number> = {};

    plans.forEach((plan) => {
      const key = plan.title.toUpperCase().replace(/\s+/g, '_');
      subscriptionPrices[key] = plan.price;

      if (plan.credits > 0) {
        creditsPerTier[key] = plan.credits;
      }
    });

    const creditPlans = plans.filter((p) => p.credits > 0).sort((a, b) => a.price - b.price);
    const defaultCreditsPerVisit = creditPlans.length > 0 ? 1 : 1;

    const config: DynamicConfig = {
      subscriptionPrices,
      creditsPerTier,
      defaultCreditsPerVisit,
      lastFetched: new Date(),
      plans,
    };

    cachedConfig = config;
    return config;
  } catch (error) {
    console.error('Failed to fetch dynamic config from database:', error);

    // Return fallback values if database fetch fails
    if (cachedConfig) {
      console.warn('Using cached config as fallback');
      return cachedConfig;
    }

    throw new Error('Failed to load business configuration');
  }
}

export async function getDynamicConfig(): Promise<DynamicConfig> {
  const now = Date.now();

  if (cachedConfig) {
    const cacheAge = now - cachedConfig.lastFetched.getTime();
    if (cacheAge < CACHE_DURATION_MS) {
      return cachedConfig;
    }
  }

  return fetchDynamicConfig();
}

export async function getSubscriptionPrice(planName: string): Promise<number> {
  const config = await getDynamicConfig();
  const key = planName.toUpperCase().replace(/\s+/g, '_');
  return config.subscriptionPrices[key] || 0;
}

export async function getCreditsForTier(tierName: string): Promise<number> {
  const config = await getDynamicConfig();
  const key = tierName.toUpperCase().replace(/\s+/g, '_');
  return config.creditsPerTier[key] || 0;
}

export async function getAllSubscriptionPrices(): Promise<Record<string, number>> {
  const config = await getDynamicConfig();
  return config.subscriptionPrices;
}

export async function getAllCreditsPerTier(): Promise<Record<string, number>> {
  const config = await getDynamicConfig();
  return config.creditsPerTier;
}

export async function getMembershipPlanByTitle(title: string): Promise<MembershipPlan | undefined> {
  const config = await getDynamicConfig();
  return config.plans.find((p) => p.title.toLowerCase() === title.toLowerCase());
}

export function clearConfigCache(): void {
  cachedConfig = null;
}

export async function initializeDynamicConfig(): Promise<void> {
  console.log('Loading business configuration from database...');

  try {
    const config = await fetchDynamicConfig();
    console.log('Business configuration loaded successfully:');
    console.log('Subscription Prices:', config.subscriptionPrices);
    console.log('Credits Per Tier:', config.creditsPerTier);
    console.log('Plans loaded:', config.plans.length);
  } catch (error) {
    console.error('Failed to initialize business configuration:', error);
    throw error;
  }
}
