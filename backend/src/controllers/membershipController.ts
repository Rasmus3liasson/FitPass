import { Request, Response } from 'express';
import { dbService, supabase } from '../services/database';
import { stripeService } from '../services/stripe';
import {
    handleControllerError,
    sendErrorResponse,
    sendSuccessResponse
} from '../utils/response';

export class MembershipController {
  
  async getMembershipPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await dbService.getMembershipPlans();
      sendSuccessResponse(res, plans);
    } catch (error: any) {
      handleControllerError(res, error, 'Get membership plans');
    }
  }

  async getUserMembership(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      console.log("🔍 UI MEMBERSHIP CHECK: Getting membership for user:", userId);

      // Get user's membership (active or inactive)
      const membership = await dbService.getUserActiveMembership(userId);
      
      // If no membership exists, return default state
      if (!membership) {
        console.log("🚨 UI MEMBERSHIP RESULT: No membership found - user will see basic features only");
        sendSuccessResponse(res, {
          hasActiveMembership: false,
          membership: null,
          message: "No membership found - user can still use the app with basic features"
        });
        return;
      }

      // Return membership status
      const responseData = {
        hasActiveMembership: membership.is_active && membership.stripe_status === 'active',
        membership: {
          id: membership.id,
          plan_type: membership.plan_type,
          credits: membership.credits,
          stripe_status: membership.stripe_status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          is_active: membership.is_active
        },
        message: membership.is_active ? "Active membership found" : "Membership exists but inactive"
      };

      // 🚨 DETAILED UI MEMBERSHIP LOGGING
      console.log("🎯 UI MEMBERSHIP RESPONSE:", {
        userId,
        hasActiveMembership: responseData.hasActiveMembership,
        planType: membership.plan_type,
        stripeStatus: membership.stripe_status,
        credits: membership.credits,
        isActive: membership.is_active,
        stripeCustomerId: membership.stripe_customer_id,
        stripeSubscriptionId: membership.stripe_subscription_id,
        shouldShowUpgrade: !responseData.hasActiveMembership
      });

      if (!responseData.hasActiveMembership) {
        console.log("⚠️  UI MEMBERSHIP ALERT: User should see membership upgrade options because hasActiveMembership=false");
        console.log("📋 Membership status details:", {
          isActive: membership.is_active,
          stripeStatus: membership.stripe_status,
          reason: !membership.is_active ? "Membership not active" : "Stripe status not active"
        });
      } else {
        console.log("✅ UI MEMBERSHIP SUCCESS: User has full access - no upgrade prompts needed");
      }

      sendSuccessResponse(res, responseData);
    } catch (error: any) {
      handleControllerError(res, error, 'Get user membership');
    }
  }

  async createTestMembership(req: Request, res: Response): Promise<void> {
    try {
      const { userId, planType = "Premium", credits = 100 } = req.body;

      if (!userId) {
        sendErrorResponse(res, "User ID is required", undefined, 400);
        return;
      }

      // Check if user already has a membership
      const existingMembership = await dbService.getUserActiveMembership(userId);
      
      if (existingMembership) {
        // Update existing membership
        const updatedMembership = await dbService.updateMembership(existingMembership.id, {
          plan_type: planType,
          credits: credits,
          stripe_status: 'active',
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        });
        
        sendSuccessResponse(res, {
          membership: updatedMembership,
          message: "Test membership updated successfully"
        });
      } else {
        // Create new membership
        const newMembership = await dbService.createMembership({
          user_id: userId,
          plan_type: planType,
          credits: credits,
          stripe_status: 'active',
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        sendSuccessResponse(res, {
          membership: newMembership,
          message: "Test membership created successfully"
        });
      }
    } catch (error: any) {
      handleControllerError(res, error, 'Create test membership');
    }
  }

  async syncProducts(req: Request, res: Response): Promise<void> {
    try {
      await stripeService.syncProductsWithDatabase();
      sendSuccessResponse(res, null, "Products synced successfully");
    } catch (error: any) {
      handleControllerError(res, error, 'Sync products');
    }
  }

  async getIncompleteSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      console.log("📋 Getting all incomplete subscriptions...");

      // Get all active memberships with incomplete stripe status
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("is_active", true)
        .eq("stripe_status", "incomplete");

      if (error) throw error;

      sendSuccessResponse(res, memberships || []);
    } catch (error: any) {
      handleControllerError(res, error, 'Get incomplete subscriptions');
    }
  }

  async completePayment(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        sendErrorResponse(res, "Subscription ID is required", undefined, 400);
        return;
      }

      console.log("🧪 Completing payment for subscription:", subscriptionId);
      const result = await stripeService.completeSubscriptionPayment(subscriptionId);

      if (result.success) {
        // After completing payment, sync the subscription status from Stripe
        console.log("🔄 Syncing subscription status after payment completion...");
        try {
          const { stripe } = await import('../services/stripe');
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Update database with current Stripe status
          const { data: membership, error } = await supabase
            .from("memberships")
            .update({
              stripe_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId)
            .select()
            .single();

          if (error) {
            console.error("❌ Error updating membership status:", error);
          } else {
            console.log("✅ Membership status updated:", membership?.stripe_status);
          }
        } catch (syncError) {
          console.error("⚠️ Error syncing subscription status:", syncError);
        }

        sendSuccessResponse(res, null, result.message);
      } else {
        sendErrorResponse(res, result.message, undefined, 400);
      }
    } catch (error: any) {
      handleControllerError(res, error, 'Complete payment');
    }
  }
}

export const membershipController = new MembershipController();
