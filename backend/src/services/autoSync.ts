import { dbService, supabase } from './database';
import { stripeService } from './stripe';

/**
 * Auto-sync service to automatically synchronize database changes with Stripe
 * This service ensures that membership changes in the database are reflected in Stripe
 */
export class AutoSyncService {
  /**
   * Auto-sync when creating a new membership
   * If membership has plan info but no Stripe subscription, create one
   */
  static async syncMembershipCreate(membershipData: any): Promise<any> {
    try {
      console.log('🔄 Auto-sync: Processing new membership creation');
      
      // If membership has a plan_id but no stripe_subscription_id, create Stripe subscription
      if (membershipData.plan_id && membershipData.stripe_price_id && !membershipData.stripe_subscription_id) {
        console.log('🆕 Auto-sync: Creating Stripe subscription for new membership');
        
        // Get user profile to get email for customer creation
        const userProfile = await dbService.getUserProfile(membershipData.user_id);
        if (!userProfile) {
          console.warn('⚠️ Auto-sync: No user profile found, skipping Stripe sync');
          return membershipData;
        }

        try {
          // Get or create Stripe customer
          const stripeCustomerId = membershipData.stripe_customer_id || await stripeService.createOrGetCustomer(
            userProfile.email || `user+${membershipData.user_id}@fitpass.com`,
            userProfile.display_name || userProfile.full_name || 'FitPass User',
            membershipData.user_id
          );

          // Create Stripe subscription
          const stripeSubscription = await stripeService.createSubscription(
            stripeCustomerId,
            membershipData.stripe_price_id
          );

          // Update the membership with Stripe subscription info
          const updatedMembership = await dbService.updateMembership(membershipData.id, {
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscription.id,
            stripe_status: stripeSubscription.status,
            start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          });

          console.log('✅ Auto-sync: Stripe subscription created and membership updated');
          return updatedMembership;
        } catch (stripeError: any) {
          console.error('❌ Auto-sync: Failed to create Stripe subscription:', stripeError);
          // Don't fail the membership creation, just log the error
          return membershipData;
        }
      }

      return membershipData;
    } catch (error: any) {
      console.error('❌ Auto-sync: Error in syncMembershipCreate:', error);
      return membershipData; // Return original data if sync fails
    }
  }

  /**
   * Auto-sync when updating a membership
   * If membership plan changes, update Stripe subscription accordingly
   */
  static async syncMembershipUpdate(membershipId: string, updates: any, existingMembership: any): Promise<any> {
    try {
      console.log('🔄 Auto-sync: Processing membership update');

      // Check if plan or price changed
      const planChanged = updates.plan_id && updates.plan_id !== existingMembership.plan_id;
      const priceChanged = updates.stripe_price_id && updates.stripe_price_id !== existingMembership.stripe_price_id;

      if ((planChanged || priceChanged) && existingMembership.stripe_subscription_id && updates.stripe_price_id) {
        console.log('🔄 Auto-sync: Plan changed, updating Stripe subscription');
        
        try {
          // Update Stripe subscription with new price
          const updatedSubscription = await stripeService.updateSubscription(
            existingMembership.stripe_subscription_id,
            updates.stripe_price_id
          );

          // Add Stripe subscription info to updates
          updates.stripe_status = updatedSubscription.status;
          updates.start_date = new Date(updatedSubscription.current_period_start * 1000).toISOString();
          updates.end_date = new Date(updatedSubscription.current_period_end * 1000).toISOString();
          updates.updated_at = new Date().toISOString();

          console.log('✅ Auto-sync: Stripe subscription updated successfully');
        } catch (stripeError: any) {
          console.error('❌ Auto-sync: Failed to update Stripe subscription:', stripeError);
          // Continue with database update even if Stripe fails
        }
      }

      return updates;
    } catch (error: any) {
      console.error('❌ Auto-sync: Error in syncMembershipUpdate:', error);
      return updates; // Return original updates if sync fails
    }
  }

  /**
   * Auto-sync when deactivating memberships
   * Cancel corresponding Stripe subscriptions
   */
  static async syncMembershipDeactivation(userId: string): Promise<void> {
    try {
      console.log('🔄 Auto-sync: Processing membership deactivation for user:', userId);

      // Get active memberships with Stripe subscriptions
      const activeMembership = await dbService.getUserActiveMembership(userId);
      
      if (activeMembership?.stripe_subscription_id) {
        console.log('🔄 Auto-sync: Canceling Stripe subscription');
        
        try {
          // Cancel Stripe subscription at period end
          await stripeService.cancelSubscription(
            activeMembership.stripe_subscription_id,
            true // Cancel at period end
          );

          console.log('✅ Auto-sync: Stripe subscription canceled successfully');
        } catch (stripeError: any) {
          console.error('❌ Auto-sync: Failed to cancel Stripe subscription:', stripeError);
          // Don't fail the deactivation, just log the error
        }
      }
    } catch (error: any) {
      console.error('❌ Auto-sync: Error in syncMembershipDeactivation:', error);
      // Don't fail the operation, just log the error
    }
  }

  /**
   * Comprehensive sync to ensure database and Stripe are in sync
   * This can be called periodically or on-demand
   */
  static async performComprehensiveSync(): Promise<{
    success: boolean;
    syncedFromStripe: { created: number; updated: number };
    syncedToStripe: { created: number; updated: number };
    errors: string[];
  }> {
    const result = {
      success: true,
      syncedFromStripe: { created: 0, updated: 0 },
      syncedToStripe: { created: 0, updated: 0 },
      errors: [] as string[]
    };

    try {
      console.log('🔄 Auto-sync: Starting comprehensive sync');

      // 1. Sync FROM Stripe TO Database (get latest Stripe data)
      try {
        const stripeSync = await stripeService.syncSubscriptionsFromStripe();
        result.syncedFromStripe = {
          created: stripeSync.created,
          updated: stripeSync.updated
        };
        console.log(`✅ Auto-sync: Synced from Stripe - ${stripeSync.created} created, ${stripeSync.updated} updated`);
      } catch (error: any) {
        result.errors.push(`Stripe to DB sync failed: ${error.message}`);
        console.error('❌ Auto-sync: Stripe to DB sync failed:', error);
      }

      // 2. Sync FROM Database TO Stripe (create missing subscriptions)
      try {
        const dbSyncResult = await this.syncDatabaseToStripe();
        result.syncedToStripe = dbSyncResult;
        console.log(`✅ Auto-sync: Synced to Stripe - ${dbSyncResult.created} created, ${dbSyncResult.updated} updated`);
      } catch (error: any) {
        result.errors.push(`DB to Stripe sync failed: ${error.message}`);
        console.error('❌ Auto-sync: DB to Stripe sync failed:', error);
      }

      result.success = result.errors.length === 0;
      console.log('🎉 Auto-sync: Comprehensive sync completed');
      
      return result;
    } catch (error: any) {
      console.error('❌ Auto-sync: Comprehensive sync failed:', error);
      result.success = false;
      result.errors.push(`Comprehensive sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Sync memberships FROM database TO Stripe
   * Creates Stripe subscriptions for memberships that don't have them
   */
  private static async syncDatabaseToStripe(): Promise<{ created: number; updated: number }> {
    const result = { created: 0, updated: 0 };

    try {
      // Get all active memberships that have plan info but no Stripe subscription
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('is_active', true)
        .not('plan_id', 'is', null)
        .not('stripe_price_id', 'is', null)
        .is('stripe_subscription_id', null);

      if (error) throw error;

      console.log(`🔍 Auto-sync: Found ${memberships?.length || 0} memberships to sync to Stripe`);

      for (const membership of memberships || []) {
        try {
          // Get user profile
          const userProfile = await dbService.getUserProfile(membership.user_id);
          if (!userProfile) {
            console.warn(`⚠️ Auto-sync: No user profile found for user ${membership.user_id}, skipping`);
            continue;
          }

          // Get or create Stripe customer
          const stripeCustomerId = membership.stripe_customer_id || await stripeService.createOrGetCustomer(
            userProfile.email || `user+${membership.user_id}@fitpass.com`,
            userProfile.display_name || userProfile.full_name || 'FitPass User',
            membership.user_id
          );

          // Create Stripe subscription
          const stripeSubscription = await stripeService.createSubscription(
            stripeCustomerId,
            membership.stripe_price_id
          );

          // Update membership with Stripe info
          await dbService.updateMembership(membership.id, {
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscription.id,
            stripe_status: stripeSubscription.status,
            start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          });

          result.created++;
          console.log(`✅ Auto-sync: Created Stripe subscription for membership ${membership.id}`);

        } catch (error: any) {
          console.error(`❌ Auto-sync: Failed to sync membership ${membership.id}:`, error);
        }
      }

      return result;
    } catch (error: any) {
      console.error('❌ Auto-sync: Error in syncDatabaseToStripe:', error);
      throw error;
    }
  }
}

export const autoSyncService = new AutoSyncService();
