import { Request, Response } from 'express';
import { supabase } from '../services/database';
import { stripeService } from '../services/stripe';
import {
    handleControllerError,
    sendSuccessResponse
} from '../utils/response';

export class SyncController {
  
  async comprehensiveSync(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Starting comprehensive bi-directional sync...");

      const { AutoSyncService } = await import("../services/autoSync");
      const result = await AutoSyncService.performComprehensiveSync();

      const responseData = {
        syncedFromStripe: result.syncedFromStripe,
        syncedToStripe: result.syncedToStripe,
        errors: result.errors,
        summary: `From Stripe: ${result.syncedFromStripe.created} created, ${result.syncedFromStripe.updated} updated | To Stripe: ${result.syncedToStripe.created} created, ${result.syncedToStripe.updated} updated`
      };

      sendSuccessResponse(res, responseData, 'Comprehensive sync completed');
    } catch (error: any) {
      handleControllerError(res, error, 'Comprehensive sync');
    }
  }

  async getAutoSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔍 Checking auto-sync status...");

      // Check for memberships without Stripe subscriptions
      const { data: unsyncedMemberships, error } = await supabase
        .from("memberships")
        .select("id, user_id, plan_type, stripe_price_id")
        .eq("is_active", true)
        .not("plan_id", "is", null)
        .not("stripe_price_id", "is", null)
        .is("stripe_subscription_id", null);

      if (error) throw error;

      // Check for incomplete subscriptions
      const { data: incompleteSubscriptions, error: incompleteError } = await supabase
        .from("memberships")
        .select("id, user_id, plan_type, stripe_status")
        .eq("is_active", true)
        .eq("stripe_status", "incomplete");

      if (incompleteError) throw incompleteError;

      const statusData = {
        autoSyncEnabled: true,
        status: {
          unsyncedMemberships: unsyncedMemberships?.length || 0,
          incompleteSubscriptions: incompleteSubscriptions?.length || 0,
          needsAttention: (unsyncedMemberships?.length || 0) + (incompleteSubscriptions?.length || 0) > 0
        },
        details: {
          unsyncedMemberships: unsyncedMemberships || [],
          incompleteSubscriptions: incompleteSubscriptions || []
        }
      };

      sendSuccessResponse(res, statusData);
    } catch (error: any) {
      handleControllerError(res, error, 'Auto-sync status check');
    }
  }

  async syncAllSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Starting comprehensive subscription sync from Stripe...");

      const result = await stripeService.syncSubscriptionsFromStripe();

      const responseData = {
        ...result,
        message: `Sync completed: ${result.created} created, ${result.updated} updated`
      };

      sendSuccessResponse(res, responseData, 'Subscriptions synced successfully');
    } catch (error: any) {
      handleControllerError(res, error, 'Sync subscriptions');
    }
  }

  async startScheduler(req: Request, res: Response): Promise<void> {
    try {
      const { syncScheduler } = await import("../services/syncScheduler");
      syncScheduler.startAutoSync();
      
      const responseData = {
        status: syncScheduler.getStatus()
      };

      sendSuccessResponse(res, responseData, 'Auto-sync scheduler started');
    } catch (error: any) {
      handleControllerError(res, error, 'Start scheduler');
    }
  }

  async stopScheduler(req: Request, res: Response): Promise<void> {
    try {
      const { syncScheduler } = await import("../services/syncScheduler");
      syncScheduler.stopAutoSync();
      
      const responseData = {
        status: syncScheduler.getStatus()
      };

      sendSuccessResponse(res, responseData, 'Auto-sync scheduler stopped');
    } catch (error: any) {
      handleControllerError(res, error, 'Stop scheduler');
    }
  }

  async getSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      const { syncScheduler } = await import("../services/syncScheduler");
      const status = syncScheduler.getStatus();
      
      sendSuccessResponse(res, { scheduler: status });
    } catch (error: any) {
      handleControllerError(res, error, 'Get scheduler status');
    }
  }

  async triggerManualSync(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'comprehensive' } = req.body;
      const { syncScheduler } = await import("../services/syncScheduler");
      
      const result = await syncScheduler.triggerManualSync(type);
      
      sendSuccessResponse(res, result, result.message || `Manual ${type} sync completed`);
    } catch (error: any) {
      handleControllerError(res, error, 'Trigger manual sync');
    }
  }

  async debugMembership(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Get membership data from database
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get profile data from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      sendSuccessResponse(res, { 
        membership: membershipError ? null : membership,
        profile: profileError ? null : profile,
        membershipError: membershipError?.message,
        profileError: profileError?.message
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Debug membership');
    }
  }

  async fixCustomerMismatch(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Get membership data
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership?.stripe_customer_id) {
        sendSuccessResponse(res, { error: 'No membership found' });
        return;
      }

      // Update profile to use the same customer ID as membership
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: membership.stripe_customer_id })
        .eq('id', userId);

      if (updateError) {
        sendSuccessResponse(res, { error: updateError.message });
        return;
      }

      sendSuccessResponse(res, { 
        message: 'Customer ID synchronized',
        customerId: membership.stripe_customer_id
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Fix customer mismatch');
    }
  }
}

export const syncController = new SyncController();
