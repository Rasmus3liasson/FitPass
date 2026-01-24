import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../../services/database';
import { stripe } from '../../services/stripe';

const router = Router();

/**
 * Get club earnings data from Stripe Connect
 * GET /api/stripe/earnings/:clubId
 */
router.get('/:clubId', async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const { period = 'month' } = req.query; // month, week, quarter, year

    console.log('📊 Fetching earnings for club:', clubId, 'Period:', period);

    // Get club with Stripe account
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, stripe_account_id, credits')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
      });
    }

    if (!club.stripe_account_id) {
      return res.status(200).json({
        success: true,
        hasStripeAccount: false,
        message: 'Club has not connected Stripe account yet',
        earnings: {
          totalAmount: 0,
          currency: 'sek',
          period: period,
          breakdown: [],
          uniqueUsers: 0,
          totalVisits: 0,
        },
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(now.getTime() / 1000);

    // Fetch transfers to the connected account
    const transfers = await stripe.transfers.list({
      destination: club.stripe_account_id,
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    });

    // Fetch payouts from the connected account (using connected account context)
    let payouts: Stripe.Payout[] = [];
    try {
      const payoutsList = await stripe.payouts.list(
        {
          created: {
            gte: startTimestamp,
            lte: endTimestamp,
          },
          limit: 100,
        },
        {
          stripeAccount: club.stripe_account_id,
        }
      );
      payouts = payoutsList.data;
    } catch (error) {
      console.log('Could not fetch payouts (may not have permission):', error);
    }

    // Get visits data from database for this period
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, user_id, created_at')
      .eq('club_id', clubId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (visitsError) {
      console.error('Error fetching visits:', visitsError);
    }

    // Get user memberships separately for the users who visited
    let userMemberships: any[] = [];
    if (visits && visits.length > 0) {
      const userIds = Array.from(new Set(visits.map((v) => v.user_id)));
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select(
          `
          user_id,
          id,
          plan_type,
          stripe_subscription_id,
          membership_plans!inner(
            id,
            title,
            price
          )
        `
        )
        .in('user_id', userIds)
        .eq('is_active', true);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
      } else {
        userMemberships = memberships || [];
      }
    }

    // Calculate total earnings from transfers
    const totalTransferAmount = transfers.data.reduce((sum, transfer) => sum + transfer.amount, 0);

    // Calculate total payouts
    const totalPayoutAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);

    // Group visits by subscription plan
    const subscriptionBreakdown: {
      [key: string]: {
        planName: string;
        count: number;
        revenue: number;
        userIds: Set<string>;
      };
    } = {};

    // Create a map of user_id to membership for quick lookup
    const membershipByUser: { [userId: string]: any } = {};
    userMemberships.forEach((membership) => {
      membershipByUser[membership.user_id] = membership;
    });

    (visits || []).forEach((visit: any) => {
      const membership = membershipByUser[visit.user_id];
      if (membership?.membership_plans) {
        const planTitle = membership.membership_plans.title;
        const planPrice = membership.membership_plans.price || 0;
        const creditValue = planPrice / 30; // Rough estimate of value per credit

        if (!subscriptionBreakdown[planTitle]) {
          subscriptionBreakdown[planTitle] = {
            planName: planTitle,
            count: 0,
            revenue: 0,
            userIds: new Set(),
          };
        }

        subscriptionBreakdown[planTitle].count += 1;
        subscriptionBreakdown[planTitle].revenue += creditValue * (club.credits || 1);
        subscriptionBreakdown[planTitle].userIds.add(visit.user_id);
      }
    });

    // Convert to array and calculate user counts
    const breakdown = Object.values(subscriptionBreakdown).map((item) => ({
      planName: item.planName,
      visitCount: item.count,
      estimatedRevenue: Math.round(item.revenue),
      uniqueUsers: item.userIds.size,
    }));

    const uniqueUsers = new Set((visits || []).map((v: any) => v.user_id)).size;

    return res.status(200).json({
      success: true,
      hasStripeAccount: true,
      earnings: {
        totalAmount: totalTransferAmount,
        totalPayouts: totalPayoutAmount,
        availableBalance: totalTransferAmount - totalPayoutAmount,
        currency: 'sek',
        period: period,
        breakdown,
        uniqueUsers,
        totalVisits: visits?.length || 0,
        transferCount: transfers.data.length,
        payoutCount: payouts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings',
    });
  }
});

/**
 * Get Stripe invoices/statements for club
 * GET /api/stripe/earnings/:clubId/invoices
 */
router.get('/:clubId/invoices', async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const { limit = 12 } = req.query;

    console.log('📄 Fetching invoices for club:', clubId);

    // Get club with Stripe account
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, stripe_account_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
      });
    }

    if (!club.stripe_account_id) {
      return res.status(200).json({
        success: true,
        hasStripeAccount: false,
        invoices: [],
      });
    }

    // Fetch balance transactions for the connected account
    const balanceTransactions = await stripe.balanceTransactions.list(
      {
        limit: Number(limit),
      },
      {
        stripeAccount: club.stripe_account_id,
      }
    );

    // Format invoice/statement data
    const statements = balanceTransactions.data.map((txn) => ({
      id: txn.id,
      amount: txn.amount,
      currency: txn.currency,
      type: txn.type,
      description: txn.description,
      created: txn.created,
      fee: txn.fee,
      net: txn.net,
      status: txn.status,
      availableOn: txn.available_on,
    }));

    return res.status(200).json({
      success: true,
      hasStripeAccount: true,
      invoices: statements,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
    });
  }
});

/**
 * Download invoice PDF (redirect to Stripe invoice)
 * GET /api/stripe/earnings/:clubId/invoice/:invoiceId/download
 */
router.get('/:clubId/invoice/:invoiceId/download', async (req: Request, res: Response) => {
  try {
    const { clubId, invoiceId } = req.params;

    // Get club with Stripe account
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, stripe_account_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club || !club.stripe_account_id) {
      return res.status(404).json({
        success: false,
        error: 'Club not found or Stripe account not connected',
      });
    }

    // Get the balance transaction receipt URL
    const transaction = await stripe.balanceTransactions.retrieve(invoiceId, {
      stripeAccount: club.stripe_account_id,
    });

    // Stripe doesn't provide direct PDF downloads for balance transactions
    // Return the transaction details instead
    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        created: transaction.created,
        description: transaction.description,
        fee: transaction.fee,
        net: transaction.net,
        type: transaction.type,
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoice',
    });
  }
});

export default router;
