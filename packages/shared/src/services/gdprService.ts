import { supabase } from '../lib/integrations/supabase/supabaseClient';
import { SecureErrorHandler } from '../utils/errorHandler';

/**
 * GDPR Compliance Service
 * Handles data deletion, export, and privacy controls
 */
export class GDPRService {
  /**
   * Request account and data deletion (GDPR Right to be Forgotten)
   * This should trigger a backend process to:
   * 1. Delete user data from Supabase
   * 2. Cancel Stripe subscriptions
   * 3. Remove from third-party services
   * 4. Anonymize or delete all related records
   */
  static async requestDataDeletion(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this should call a backend endpoint that handles:
      // - Canceling active subscriptions
      // - Deleting user data across all tables
      // - Removing Stripe customer data
      // - Cleaning up any third-party integrations
      
      // For now, mark user for deletion
      const { error } = await supabase
        .from('profiles')
        .update({
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // TODO: Call backend endpoint to handle full deletion
      // await fetch(`${API_URL}/api/gdpr/delete-account`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      //   body: JSON.stringify({ userId }),
      // });

      return { success: true };
    } catch (error) {
      SecureErrorHandler.logError(error, 'requestDataDeletion');
      return {
        success: false,
        error: SecureErrorHandler.sanitize(error),
      };
    }
  }

  /**
   * Export user data (GDPR Right to Data Portability)
   * Returns all user data in a downloadable format
   */
  static async exportUserData(userId: string): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      // Fetch all user-related data
      const [profileResult, bookingsResult, paymentsResult, subscriptionsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('bookings').select('*').eq('user_id', userId),
        supabase.from('payments').select('*').eq('user_id', userId),
        supabase.from('subscriptions').select('*').eq('user_id', userId),
      ]);

      // Compile all data
      const exportData = {
        profile: profileResult.data,
        bookings: bookingsResult.data || [],
        payments: paymentsResult.data || [],
        subscriptions: subscriptionsResult.data || [],
        exportDate: new Date().toISOString(),
        dataController: 'FitPass AB',
        gdprNotice: 'This data export contains all personal information we have stored about you.',
      };

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      SecureErrorHandler.logError(error, 'exportUserData');
      return {
        success: false,
        error: SecureErrorHandler.sanitize(error),
      };
    }
  }

  /**
   * Get current privacy settings for user
   */
  static async getPrivacySettings(userId: string): Promise<{
    success: boolean;
    settings?: {
      profileVisible: boolean;
      locationSharingEnabled: boolean;
      marketingEmailsEnabled: boolean;
      analyticsEnabled: boolean;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_visibility, location_sharing_enabled, marketingnotifications, analytics')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        settings: {
          profileVisible: data?.profile_visibility ?? true,
          locationSharingEnabled: data?.location_sharing_enabled ?? true,
          marketingEmailsEnabled: data?.marketingnotifications ?? false,
          analyticsEnabled: data?.analytics ?? true,
        },
      };
    } catch (error) {
      SecureErrorHandler.logError(error, 'getPrivacySettings');
      return {
        success: false,
        error: SecureErrorHandler.sanitize(error),
      };
    }
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: {
      profileVisible?: boolean;
      locationSharingEnabled?: boolean;
      marketingEmailsEnabled?: boolean;
      analyticsEnabled?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (settings.profileVisible !== undefined) {
        updateData.profile_visibility = settings.profileVisible;
      }
      if (settings.locationSharingEnabled !== undefined) {
        updateData.location_sharing_enabled = settings.locationSharingEnabled;
      }
      if (settings.marketingEmailsEnabled !== undefined) {
        updateData.marketingnotifications = settings.marketingEmailsEnabled;
      }
      if (settings.analyticsEnabled !== undefined) {
        updateData.analytics = settings.analyticsEnabled;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) throw error;

      return { success: true };
    } catch (error) {
      SecureErrorHandler.logError(error, 'updatePrivacySettings');
      return {
        success: false,
        error: SecureErrorHandler.sanitize(error),
      };
    }
  }

  /**
   * Download user data as JSON file
   */
  static async downloadUserDataAsJSON(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.exportUserData(userId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error };
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(result.data, null, 2);
      
      // On mobile, you would use FileSystem or Share API
      // For now, return success - implement platform-specific download
      console.log('User data JSON:', jsonString);
      
      return { success: true };
    } catch (error) {
      SecureErrorHandler.logError(error, 'downloadUserDataAsJSON');
      return {
        success: false,
        error: SecureErrorHandler.sanitize(error),
      };
    }
  }
}
