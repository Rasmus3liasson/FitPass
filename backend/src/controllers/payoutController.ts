import { Request, Response } from 'express';
import { CREDIT_VISIT_PAYOUT, calculateModellCPayoutPerVisit } from '../config/businessConfig';
import { supabase } from '../services/database';
import { stripe } from '../services/stripe';
import { calculateAllClubPayouts } from '../utils/payoutCalculations';

export const logVisit = async (req: Request, res: Response) => {
  try {
    const { userId, clubId, subscriptionType, visitDate } = req.body;

    if (!userId || !clubId || !subscriptionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, clubId, subscriptionType',
      });
    }

    if (!['unlimited', 'credits'].includes(subscriptionType)) {
      return res.status(400).json({
        success: false,
        error: 'subscriptionType must be "unlimited" or "credits"',
      });
    }

    const now = visitDate ? new Date(visitDate) : new Date();
    const period = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, credits')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return res.status(404).json({ success: false, error: 'Club not found' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const { data: existingUsage } = await supabase
      .from('subscription_usage')
      .select('id, visit_count, unique_visit')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('subscription_period', period)
      .eq('subscription_type', subscriptionType)
      .single();

    const isUniqueMonthlyVisit = !existingUsage;
    let costToClub = 0;

    if (subscriptionType === 'credits') {
      if (!profile.credits || profile.credits < (club.credits || 1)) {
        return res.status(400).json({ success: false, error: 'Insufficient credits' });
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - (club.credits || 1) })
        .eq('id', userId);

      if (updateError) {
        return res.status(500).json({ success: false, error: 'Failed to deduct credits' });
      }

      costToClub = CREDIT_VISIT_PAYOUT;
    } else if (subscriptionType === 'unlimited') {
      const { data: usageData } = await supabase
        .from('subscription_usage')
        .select('club_id')
        .eq('user_id', userId)
        .eq('subscription_period', period)
        .eq('subscription_type', 'unlimited')
        .eq('unique_visit', true);

      const currentUniqueGyms = usageData?.length || 0;
      const totalUniqueGyms = isUniqueMonthlyVisit ? currentUniqueGyms + 1 : currentUniqueGyms;

      costToClub = calculateModellCPayoutPerVisit(totalUniqueGyms);
    }

    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        user_id: userId,
        club_id: clubId,
        created_at: now.toISOString(),
        subscription_type: subscriptionType,
        cost_to_club: costToClub,
        unique_monthly_visit: isUniqueMonthlyVisit,
        payout_processed: false,
      })
      .select()
      .single();

    if (visitError) {
      return res.status(500).json({
        success: false,
        error: `Failed to insert visit: ${visitError.message}`,
      });
    }

    const { data: usage } = await supabase
      .from('subscription_usage')
      .upsert(
        {
          user_id: userId,
          club_id: clubId,
          subscription_period: period,
          subscription_type: subscriptionType,
          visit_count: (existingUsage?.visit_count || 0) + 1,
          unique_visit: isUniqueMonthlyVisit || existingUsage?.unique_visit || false,
        },
        { onConflict: 'user_id,club_id,subscription_period' }
      )
      .select()
      .single();

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    return res.status(200).json({
      success: true,
      visitId: visit.id,
      costToClub,
      uniqueMonthlyVisit: isUniqueMonthlyVisit,
      subscriptionUsage: usage,
      creditsRemaining: updatedProfile?.credits || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const generateMonthlyPayouts = async (req: Request, res: Response) => {
  try {
    const { period, clubIds: specificClubIds } = req.body;
    const now = new Date();
    const defaultPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const targetPeriod = period || defaultPeriod;

    let usageQuery = supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_period', targetPeriod);

    if (specificClubIds && specificClubIds.length > 0) {
      usageQuery = usageQuery.in('club_id', specificClubIds);
    }

    const { data: allUsage, error: usageError } = await usageQuery;

    if (usageError) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch usage: ${usageError.message}`,
      });
    }

    if (!allUsage || allUsage.length === 0) {
      return res.status(200).json({
        success: true,
        period: targetPeriod,
        clubsProcessed: 0,
        totalAmount: 0,
        payouts: [],
        message: 'No usage data for this period',
      });
    }

    const clubIds = Array.from(new Set(allUsage.map((u) => u.club_id)));
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name, stripe_account_id')
      .in('id', clubIds);

    if (clubsError) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch clubs: ${clubsError.message}`,
      });
    }

    const clubMap = new Map(clubs?.map((c) => [c.id, c]) || []);
    const periodDate = new Date(targetPeriod);
    const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

    const { data: visits } = await supabase
      .from('visits')
      .select('*')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const calculations = calculateAllClubPayouts(targetPeriod, clubMap, allUsage, visits || []);
    const payoutResults = [];

    for (const calc of calculations) {
      const { data: payout, error: payoutError } = await supabase
        .from('payouts_to_clubs')
        .upsert(
          {
            club_id: calc.clubId,
            payout_period: targetPeriod,
            unlimited_amount: calc.unlimitedAmount,
            credits_amount: calc.creditsAmount,
            total_amount: calc.totalAmount,
            unlimited_visits: calc.unlimitedVisits,
            credits_visits: calc.creditsVisits,
            total_visits: calc.totalVisits,
            unique_users: calc.uniqueUsers,
            status: 'pending',
          },
          { onConflict: 'club_id,payout_period' }
        )
        .select()
        .single();

      if (!payoutError && payout) {
        payoutResults.push(payout);
      }
    }

    const totalAmount = payoutResults.reduce((sum, p) => sum + (p.total_amount || 0), 0);

    return res.status(200).json({
      success: true,
      period: targetPeriod,
      clubsProcessed: payoutResults.length,
      totalAmount,
      payouts: payoutResults,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const sendPayoutTransfers = async (req: Request, res: Response) => {
  try {
    const { period, clubIds: specificClubIds } = req.body;
    const now = new Date();
    const defaultPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const targetPeriod = period || defaultPeriod;

    let payoutsQuery = supabase
      .from('payouts_to_clubs')
      .select(`*, clubs!inner(id, name, stripe_account_id, payouts_enabled)`)
      .eq('payout_period', targetPeriod)
      .eq('status', 'pending');

    if (specificClubIds && specificClubIds.length > 0) {
      payoutsQuery = payoutsQuery.in('club_id', specificClubIds);
    }

    const { data: pendingPayouts, error: payoutsError } = await payoutsQuery;

    if (payoutsError) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch pending payouts: ${payoutsError.message}`,
      });
    }

    if (!pendingPayouts || pendingPayouts.length === 0) {
      return res.status(200).json({
        success: true,
        period: targetPeriod,
        transfersAttempted: 0,
        transfersSucceeded: 0,
        transfersFailed: 0,
        results: [],
        message: 'No pending payouts for this period',
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const payout of pendingPayouts) {
      const club = (payout as any).clubs;

      try {
        if (!club.stripe_account_id) {
          throw new Error('Club has no Stripe account connected');
        }

        if (!club.payouts_enabled) {
          throw new Error('Payouts not enabled for this club');
        }

        if (payout.total_amount <= 0) {
          await supabase
            .from('payouts_to_clubs')
            .update({
              status: 'paid',
              transfer_completed_at: new Date().toISOString(),
              error_message: 'No transfer needed - amount is 0',
            })
            .eq('id', payout.id);

          results.push({
            clubId: club.id,
            clubName: club.name,
            amount: payout.total_amount,
            status: 'success' as const,
            message: 'Skipped - zero amount',
          });
          successCount++;
          continue;
        }

        await supabase
          .from('payouts_to_clubs')
          .update({
            status: 'processing',
            transfer_attempted_at: new Date().toISOString(),
          })
          .eq('id', payout.id);

        const transferAmount = Math.round(payout.total_amount * 100);

        const transfer = await stripe.transfers.create({
          amount: transferAmount,
          currency: 'sek',
          destination: club.stripe_account_id,
          description: `Payout for ${targetPeriod} - ${club.name}`,
          metadata: {
            payout_id: payout.id,
            payout_period: targetPeriod,
            club_id: club.id,
            club_name: club.name,
            unlimited_amount: payout.unlimited_amount.toString(),
            credits_amount: payout.credits_amount.toString(),
            total_visits: payout.total_visits.toString(),
          },
        });

        await supabase
          .from('payouts_to_clubs')
          .update({
            status: 'paid',
            stripe_transfer_id: transfer.id,
            transfer_completed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', payout.id);

        results.push({
          clubId: club.id,
          clubName: club.name,
          amount: payout.total_amount,
          status: 'success' as const,
          stripeTransferId: transfer.id,
        });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetryCount = (payout.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';

        await supabase
          .from('payouts_to_clubs')
          .update({
            status: newStatus,
            error_message: errorMessage,
            retry_count: newRetryCount,
            transfer_attempted_at: new Date().toISOString(),
          })
          .eq('id', payout.id);

        results.push({
          clubId: club.id,
          clubName: club.name,
          amount: payout.total_amount,
          status: 'failed' as const,
          errorMessage,
        });
        failCount++;
      }
    }

    return res.status(200).json({
      success: true,
      period: targetPeriod,
      transfersAttempted: pendingPayouts.length,
      transfersSucceeded: successCount,
      transfersFailed: failCount,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getClubPayouts = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const { limit = 12 } = req.query;

    const { data: payouts, error } = await supabase
      .from('payouts_to_clubs')
      .select('*')
      .eq('club_id', clubId)
      .order('payout_period', { ascending: false })
      .limit(Number(limit));

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch payouts: ${error.message}`,
      });
    }

    return res.status(200).json({ success: true, payouts: payouts || [] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getPayoutSummary = async (req: Request, res: Response) => {
  try {
    const { period } = req.params;

    const { data: payouts, error } = await supabase
      .from('payouts_to_clubs')
      .select('*')
      .eq('payout_period', period);

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch summary: ${error.message}`,
      });
    }

    if (!payouts || payouts.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          period,
          totalClubs: 0,
          totalAmount: 0,
          unlimitedAmount: 0,
          creditsAmount: 0,
          totalVisits: 0,
          uniqueUsers: 0,
          pending: 0,
          paid: 0,
          failed: 0,
        },
      });
    }

    const summary = {
      period,
      totalClubs: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.total_amount, 0),
      unlimitedAmount: payouts.reduce((sum, p) => sum + p.unlimited_amount, 0),
      creditsAmount: payouts.reduce((sum, p) => sum + p.credits_amount, 0),
      totalVisits: payouts.reduce((sum, p) => sum + p.total_visits, 0),
      uniqueUsers: payouts.reduce((sum, p) => sum + p.unique_users, 0),
      pending: payouts.filter((p) => p.status === 'pending').length,
      paid: payouts.filter((p) => p.status === 'paid').length,
      failed: payouts.filter((p) => p.status === 'failed').length,
    };

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
