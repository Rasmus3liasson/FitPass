import {
  CREDIT_VISIT_PAYOUT,
  MODELL_C_PAYOUTS,
  calculateModellCPayoutPerVisit as calculateModellCPayoutPerGym,
} from "../config/businessConfig";
import type {
  ClubPayoutCalculation,
  SubscriptionUsage,
  UserMonthlyUsage,
  Visit,
} from "../types/payouts";

// Re-export for backwards compatibility
export { CREDIT_VISIT_PAYOUT, MODELL_C_PAYOUTS };

export function getUserMonthlyUsage(
  userId: string,
  period: string,
  usageData: SubscriptionUsage[],
): UserMonthlyUsage {
  const userUsage = usageData.filter(
    (u) => u.user_id === userId && u.subscription_period === period,
  );
  const uniqueGyms = userUsage.filter((u) => u.unique_visit).length;
  const subscriptionType = userUsage[0]?.subscription_type || "credits";
  const gymVisits = userUsage.map((u) => ({
    clubId: u.club_id,
    visitCount: u.visit_count,
    isUnique: u.unique_visit,
  }));

  return {
    userId,
    subscriptionType,
    uniqueGymsVisited: uniqueGyms,
    gymVisits,
  };
}

export function calculateClubPayout(
  clubId: string,
  clubName: string,
  period: string,
  usageData: SubscriptionUsage[],
  visits: Visit[],
  allUsageData: SubscriptionUsage[],
): ClubPayoutCalculation {
  const unlimitedUsage = usageData.filter(
    (u) => u.subscription_type === "unlimited",
  );
  const creditsUsage = usageData.filter(
    (u) => u.subscription_type === "credits",
  );

  const unlimitedUsers = unlimitedUsage.map((usage) => {
    const userUsage = getUserMonthlyUsage(usage.user_id, period, allUsageData);
    const payoutPerVisit = calculateModellCPayoutPerGym(
      userUsage.uniqueGymsVisited,
    );

    return {
      userId: usage.user_id,
      uniqueGymsCount: userUsage.uniqueGymsVisited,
      payoutPerVisit,
      visitCount: usage.visit_count,
      totalPayout: payoutPerVisit * usage.visit_count,
    };
  });

  const unlimitedAmount = unlimitedUsers.reduce(
    (sum, u) => sum + u.totalPayout,
    0,
  );
  const unlimitedVisits = unlimitedUsers.reduce(
    (sum, u) => sum + u.visitCount,
    0,
  );

  const creditsUsers = creditsUsage.map((usage) => ({
    userId: usage.user_id,
    visitCount: usage.visit_count,
    totalPayout: usage.visit_count * CREDIT_VISIT_PAYOUT,
  }));

  const creditsAmount = creditsUsers.reduce((sum, u) => sum + u.totalPayout, 0);
  const creditsVisits = creditsUsers.reduce((sum, u) => sum + u.visitCount, 0);

  const totalAmount = unlimitedAmount + creditsAmount;
  const totalVisits = unlimitedVisits + creditsVisits;
  const uniqueUsers = new Set([
    ...unlimitedUsage.map((u) => u.user_id),
    ...creditsUsage.map((u) => u.user_id),
  ]).size;

  return {
    clubId,
    clubName,
    period,
    unlimitedUsers,
    unlimitedAmount,
    unlimitedVisits,
    creditsUsers,
    creditsAmount,
    creditsVisits,
    totalAmount,
    totalVisits,
    uniqueUsers,
  };
}

export function calculateAllClubPayouts(
  period: string,
  clubs: Map<string, { name: string }>,
  usageData: SubscriptionUsage[],
  visits: Visit[],
): ClubPayoutCalculation[] {
  const payoutsByClub: ClubPayoutCalculation[] = [];
  const usageByClub = new Map<string, SubscriptionUsage[]>();

  usageData.forEach((usage) => {
    if (!usageByClub.has(usage.club_id)) {
      usageByClub.set(usage.club_id, []);
    }
    usageByClub.get(usage.club_id)!.push(usage);
  });

  usageByClub.forEach((clubUsage, clubId) => {
    const club = clubs.get(clubId);
    if (!club) return;

    const clubVisits = visits.filter((v) => v.club_id === clubId);
    const payout = calculateClubPayout(
      clubId,
      club.name,
      period,
      clubUsage,
      clubVisits,
      usageData,
    );
    payoutsByClub.push(payout);
  });

  return payoutsByClub;
}

export function recalculateModellCVisitCosts(
  userId: string,
  period: string,
  visits: Visit[],
  finalUniqueGymCount: number,
): Visit[] {
  const unlimitedVisits = visits.filter(
    (v) => v.subscription_type === "unlimited" && v.user_id === userId,
  );
  const correctPayoutPerGym = calculateModellCPayoutPerGym(finalUniqueGymCount);
  return unlimitedVisits.map((visit) => ({
    ...visit,
    cost_to_club: correctPayoutPerGym,
  }));
}

export function validatePayoutCalculation(calculation: ClubPayoutCalculation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (calculation.totalAmount < 0)
    errors.push("Total amount cannot be negative");
  if (
    calculation.totalVisits !==
    calculation.unlimitedVisits + calculation.creditsVisits
  ) {
    errors.push("Visit counts do not add up correctly");
  }
  if (
    calculation.totalAmount !==
    calculation.unlimitedAmount + calculation.creditsAmount
  ) {
    errors.push("Payout amounts do not add up correctly");
  }
  if (calculation.uniqueUsers > calculation.totalVisits) {
    errors.push("Unique users cannot exceed total visits");
  }
  return { valid: errors.length === 0, errors };
}

export function formatPayoutAmount(amount: number): string {
  return `${amount.toFixed(2)} SEK`;
}

export function getPayoutSummary(calculations: ClubPayoutCalculation[]) {
  return {
    totalClubs: calculations.length,
    totalAmount: calculations.reduce((sum, c) => sum + c.totalAmount, 0),
    totalVisits: calculations.reduce((sum, c) => sum + c.totalVisits, 0),
    totalUniqueUsers: new Set(
      calculations.flatMap((c) => [
        ...c.unlimitedUsers.map((u) => u.userId),
        ...c.creditsUsers.map((u) => u.userId),
      ]),
    ).size,
    unlimitedAmount: calculations.reduce(
      (sum, c) => sum + c.unlimitedAmount,
      0,
    ),
    creditsAmount: calculations.reduce((sum, c) => sum + c.creditsAmount, 0),
  };
}
