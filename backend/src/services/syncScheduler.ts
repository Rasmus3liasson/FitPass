import * as cron from 'node-cron';
import { AutoSyncService } from './autoSync';

/**
 * Scheduler service for automatic periodic synchronization
 * This ensures that database and Stripe stay in sync automatically
 */
export class SyncScheduler {
  private static instance: SyncScheduler;
  private syncTasks: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  /**
   * Start automatic synchronization
   * Runs comprehensive sync every 30 minutes
   */
  startAutoSync(): void {
    console.log('🕐 Starting automatic sync scheduler...');

    // Comprehensive sync every 30 minutes
    const comprehensiveSync = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('⏰ Running scheduled comprehensive sync...');
        const result = await AutoSyncService.performComprehensiveSync();
        
        if (result.success) {
          console.log(`✅ Scheduled sync completed successfully:`, {
            fromStripe: result.syncedFromStripe,
            toStripe: result.syncedToStripe
          });
        } else {
          console.error('❌ Scheduled sync completed with errors:', result.errors);
        }
      } catch (error) {
        console.error('❌ Scheduled sync failed:', error);
      }
    });

    this.syncTasks.set('comprehensive', comprehensiveSync);

    // Light sync every 10 minutes (just check for unsynced memberships)
    const lightSync = cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('⏰ Running scheduled light sync...');
        // This will create Stripe subscriptions for any new memberships without them
        await this.performLightSync();
      } catch (error) {
        console.error('❌ Scheduled light sync failed:', error);
      }
    });

    this.syncTasks.set('light', lightSync);

    console.log('✅ Auto-sync scheduler started');
    console.log('📅 Schedule: Comprehensive sync every 30 minutes, light sync every 10 minutes');
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    console.log('🛑 Stopping automatic sync scheduler...');
    
    this.syncTasks.forEach((task, name) => {
      task.stop();
      console.log(`✅ Stopped ${name} sync task`);
    });
    
    this.syncTasks.clear();
    console.log('✅ Auto-sync scheduler stopped');
  }

  /**
   * Light sync - only sync database memberships to Stripe
   * Less resource intensive than comprehensive sync
   */
  private async performLightSync(): Promise<void> {
    try {
      // Import here to avoid circular dependencies
      const { supabase } = await import('./database');
      
      // Get memberships that need Stripe subscriptions
      const { data: unsyncedMemberships, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('is_active', true)
        .not('plan_id', 'is', null)
        .not('stripe_price_id', 'is', null)
        .is('stripe_subscription_id', null)
        .limit(5); // Limit to avoid overwhelming Stripe API

      if (error) throw error;

      if (!unsyncedMemberships || unsyncedMemberships.length === 0) {
        console.log('✅ Light sync: No memberships need syncing');
        return;
      }

      console.log(`🔄 Light sync: Found ${unsyncedMemberships.length} memberships to sync`);

      // Sync each membership
      for (const membership of unsyncedMemberships) {
        try {
          await AutoSyncService.syncMembershipCreate(membership);
          console.log(`✅ Light sync: Synced membership ${membership.id}`);
        } catch (error) {
          console.error(`❌ Light sync: Failed to sync membership ${membership.id}:`, error);
        }
      }

      console.log('✅ Light sync completed');
    } catch (error) {
      console.error('❌ Light sync failed:', error);
    }
  }

  /**
   * Get status of sync scheduler
   */
  getStatus(): {
    isRunning: boolean;
    activeTasks: string[];
    nextRuns: { [key: string]: string | null };
  } {
    const activeTasks = Array.from(this.syncTasks.keys());
    const nextRuns: { [key: string]: string | null } = {};

    this.syncTasks.forEach((task, name) => {
      // For simplicity, just indicate if task is running
      nextRuns[name] = this.syncTasks.has(name) ? 'Active' : null;
    });

    return {
      isRunning: this.syncTasks.size > 0,
      activeTasks,
      nextRuns
    };
  }

  /**
   * Manually trigger a sync (for testing or immediate needs)
   */
  async triggerManualSync(type: 'light' | 'comprehensive' = 'comprehensive'): Promise<any> {
    console.log(`🔄 Manually triggering ${type} sync...`);
    
    try {
      if (type === 'light') {
        await this.performLightSync();
        return { success: true, type: 'light', message: 'Light sync completed' };
      } else {
        const result = await AutoSyncService.performComprehensiveSync();
        return { ...result, type: 'comprehensive' };
      }
    } catch (error: any) {
      console.error(`❌ Manual ${type} sync failed:`, error);
      return { 
        success: false, 
        type, 
        error: error.message,
        message: `Manual ${type} sync failed`
      };
    }
  }
}

export const syncScheduler = SyncScheduler.getInstance();
