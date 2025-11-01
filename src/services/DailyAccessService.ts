import { supabase } from '../lib/integrations/supabase/supabaseClient';

export interface SelectedGym {
  id: string;
  gym_id: string;
  gym_name: string;
  gym_address?: string;
  gym_image?: string;
  added_at: string;
  effective_from: string;
  status: 'pending' | 'active' | 'removed';
}

export interface DailyAccessSubscription {
  user_id: string;
  is_daily_access: boolean;
  gym_slots: number;
  max_gym_slots: number;
  next_cycle_date: string;
  current_gyms: SelectedGym[];
  pending_gyms: SelectedGym[];
}

export class DailyAccessService {
  /**
   * Check if user has Daily Access membership
   */
  static async checkDailyAccessStatus(userId: string): Promise<{
    success: boolean;
    hasDailyAccess: boolean;
    subscription?: any;
  }> {
    try {
      const { data: membership, error } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_plans!inner(
            id,
            title,
            price,
            max_daily_gyms
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('membership_plans.max_daily_gyms', 0)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        hasDailyAccess: !!membership?.membership_plans?.max_daily_gyms,
        subscription: membership || null
      };
    } catch (error) {
      console.error('Error checking daily access status:', error);
      return {
        success: false,
        hasDailyAccess: false
      };
    }
  }

  /**
   * Get user's current and pending selected gyms
   */
  static async getUserSelectedGyms(userId: string): Promise<{
    success: boolean;
    current: SelectedGym[];
    pending: SelectedGym[];
    maxSlots: number;
  }> {
    try {
      // Check if user has daily access
      const { hasDailyAccess, subscription } = await this.checkDailyAccessStatus(userId);
      
      if (!hasDailyAccess) {
        return {
          success: true,
          current: [],
          pending: [],
          maxSlots: 0
        };
      }

      // Get current active gyms
      const { data: currentGyms, error: currentError } = await supabase
        .rpc('get_user_active_selected_gyms', { p_user_id: userId });

      if (currentError) throw currentError;

      // Get pending gyms for next cycle
      const { data: pendingGyms, error: pendingError } = await supabase
        .rpc('get_user_pending_selected_gyms', { p_user_id: userId });

      if (pendingError) throw pendingError;

      return {
        success: true,
        current: currentGyms || [],
        pending: pendingGyms || [],
        maxSlots: subscription?.membership_plans?.max_daily_gyms || 3
      };
    } catch (error) {
      console.error('Error getting selected gyms:', error);
      return {
        success: false,
        current: [],
        pending: [],
        maxSlots: 0
      };
    }
  }

  /**
   * Add a gym to user's Daily Access selection (for next billing cycle)
   */
  static async addSelectedGym(userId: string, gymId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check daily access status
      const { hasDailyAccess, subscription } = await this.checkDailyAccessStatus(userId);
      
      if (!hasDailyAccess) {
        return {
          success: false,
          message: 'Du behöver Daily Access medlemskap för denna funktion'
        };
      }

      // Get user's membership for next cycle date
      const { data: membership } = await supabase
        .from('memberships')
        .select('end_date, stripe_subscription_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Calculate next billing cycle date
      const nextCycleDate = membership?.end_date ? new Date(membership.end_date) : new Date();
      
      // Get current selections to check limits
      const { current, pending, maxSlots } = await this.getUserSelectedGyms(userId);
      
      if (current.length + pending.length >= maxSlots) {
        return {
          success: false,
          message: `Du kan max välja ${maxSlots} gym för Daily Access.`
        };
      }

      // Check if gym already exists
      const { data: existing } = await supabase
        .from('user_selected_gyms')
        .select('*')
        .eq('user_id', userId)
        .eq('club_id', gymId)
        .in('status', ['active', 'pending'])
        .single();

      if (existing) {
        return {
          success: false,
          message: 'Gymmet är redan valt.'
        };
      }

      // Get gym info
      const { data: gymData } = await supabase
        .from('clubs')
        .select('name, address, image_url')
        .eq('id', gymId)
        .single();

      if (!gymData) {
        return {
          success: false,
          message: 'Gymmet hittades inte.'
        };
      }

      // Add as pending (takes effect next billing cycle)
      const { error } = await supabase
        .from('user_selected_gyms')
        .insert({
          user_id: userId,
          club_id: gymId,
          status: 'pending',
          effective_from: nextCycleDate.toISOString()
        });

      if (error) throw error;

      return {
        success: true,
        message: `${gymData.name} kommer läggas till nästa faktureringsperiod.`
      };

    } catch (error: any) {
      console.error('Error adding selected gym:', error);
      return {
        success: false,
        message: error.message || 'Ett fel inträffade vid tillägg av gym.'
      };
    }
  }

  /**
   * Remove gym from user's selection
   */
  static async removeSelectedGym(userId: string, gymId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if it's an active gym (remove immediately) or pending gym
      const { data: gymSelection, error: fetchError } = await supabase
        .from('user_selected_gyms')
        .select('*')
        .eq('user_id', userId)
        .eq('club_id', gymId)
        .in('status', ['active', 'pending'])
        .single();

      if (fetchError) throw fetchError;

      if (gymSelection.status === 'pending') {
        // If it's pending, we can delete it completely
        const { error } = await supabase
          .from('user_selected_gyms')
          .delete()
          .eq('id', gymSelection.id);

        if (error) throw error;

        return {
          success: true,
          message: 'Gym borttaget från nästa period.'
        };
      } else {
        // If it's active, mark for removal next cycle
        const nextCycleDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const { error } = await supabase
          .from('user_selected_gyms')
          .update({
            status: 'removed',
            effective_from: nextCycleDate
          })
          .eq('id', gymSelection.id);

        if (error) throw error;

        return {
          success: true,
          message: 'Gym kommer tas bort nästa faktureringsperiod.'
        };
      }
    } catch (error) {
      console.error('Error removing selected gym:', error);
      return {
        success: false,
        message: 'Kunde inte ta bort gym. Försök igen.'
      };
    }
  }

  /**
   * Get user's daily access subscription summary
   */
  static async getDailyAccessSummary(userId: string): Promise<DailyAccessSubscription | null> {
    try {
      const { hasDailyAccess, subscription } = await this.checkDailyAccessStatus(userId);
      
      if (!hasDailyAccess) return null;

      const { current, pending, maxSlots } = await this.getUserSelectedGyms(userId);

      return {
        user_id: userId,
        is_daily_access: true,
        gym_slots: current.length,
        max_gym_slots: maxSlots,
        next_cycle_date: subscription?.next_cycle_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        current_gyms: current,
        pending_gyms: pending
      };
    } catch (error) {
      console.error('Error getting daily access summary:', error);
      return null;
    }
  }
}