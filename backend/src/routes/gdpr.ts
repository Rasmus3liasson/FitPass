import { Request, Response, Router } from 'express';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { supabase } from '../services/database';
import { stripe } from '../services/stripe';

const router: Router = Router();

/**
 * Request account deletion (GDPR Right to be Forgotten)
 * POST /api/gdpr/delete-account
 */
router.post('/delete-account', strictRateLimiter, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId',
      });
    }

    console.log('🗑️ Processing data deletion request for user:', userId.slice(0, 8));

    // 1. Get user profile and Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // 2. Cancel all active Stripe subscriptions
    if (profile.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        });

        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
          console.log('✅ Canceled subscription:', subscription.id);
        }

        // Delete Stripe customer (optional - keep for records or delete for GDPR)
        // await stripe.customers.del(profile.stripe_customer_id);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscriptions:', stripeError);
        // Continue with deletion even if Stripe fails
      }
    }

    // 3. Delete user data from all tables
    // Order matters due to foreign key constraints
    const tablesToClean = [
      'bookings',
      'payments',
      'subscriptions',
      'user_preferences',
      'social_posts',
      'social_likes',
      'social_comments',
      'notifications',
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabase.from(table).delete().eq('user_id', userId);

        if (error) {
          console.warn(`Warning: Could not delete from ${table}:`, error);
        } else {
          console.log(`✅ Deleted data from ${table}`);
        }
      } catch (err) {
        console.warn(`Warning: Error deleting from ${table}:`, err);
      }
    }

    // 4. Anonymize or delete user profile
    // Option A: Delete completely
    const { error: deleteError } = await supabase.from('profiles').delete().eq('id', userId);

    // Option B: Anonymize (keep for records but remove PII)
    // const { error: anonymizeError } = await supabase
    //   .from('profiles')
    //   .update({
    //     email: `deleted_${userId}@deleted.local`,
    //     first_name: 'Deleted',
    //     last_name: 'User',
    //     phone: null,
    //     address: null,
    //     latitude: null,
    //     longitude: null,
    //     profile_picture: null,
    //     deleted_at: new Date().toISOString(),
    //   })
    //   .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user profile:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete deletion',
      });
    }

    // 5. Delete auth user from Supabase Auth
    try {
      // This requires service role key
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Warning: Could not delete auth user:', authError);
      }
    } catch (authErr) {
      console.warn('Warning: Error deleting auth user:', authErr);
    }

    console.log('✅ Account deletion completed for user:', userId.slice(0, 8));

    return res.json({
      success: true,
      message: 'Account and all associated data have been deleted',
    });
  } catch (error: any) {
    console.error('Error processing account deletion:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process deletion request',
    });
  }
});

/**
 * Export user data (GDPR Right to Data Portability)
 * GET /api/gdpr/export-data/:userId
 */
router.get('/export-data/:userId', strictRateLimiter, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    console.log('📦 Exporting data for user:', userId.slice(0, 8));

    // Fetch all user data
    const [profile, bookings, payments, subscriptions, preferences, posts] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('bookings').select('*').eq('user_id', userId),
      supabase.from('payments').select('*').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId),
      supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('social_posts').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      profile: profile.data,
      bookings: bookings.data || [],
      payments: payments.data || [],
      subscriptions: subscriptions.data || [],
      preferences: preferences.data,
      socialPosts: posts.data || [],
      metadata: {
        exportDate: new Date().toISOString(),
        dataController: 'FitPass AB',
        gdprNotice: 'This export contains all personal data we have stored about you.',
        format: 'JSON',
      },
    };

    console.log('✅ Data export completed');

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fitpass-data-${userId}.json"`);

    return res.json(exportData);
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export data',
    });
  }
});

/**
 * Update privacy settings
 * POST /api/gdpr/privacy-settings
 */
router.post('/privacy-settings', async (req: Request, res: Response) => {
  try {
    const { userId, settings } = req.body;

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or settings',
      });
    }

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

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Privacy settings updated',
    });
  } catch (error: any) {
    console.error('Error updating privacy settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
});

export default router;
