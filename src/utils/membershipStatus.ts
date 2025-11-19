import { Membership } from '@/types';

/**
 * Get the subscription status for a membership with fallback logic
 */
export function getMembershipStatus(membership: Membership): string {
  // Priority order: stripe_status -> subscription_status -> is_active fallback
  if (membership.stripe_status) {
    return membership.stripe_status;
  }
  
  if (membership.subscription_status) {
    return membership.subscription_status;
  }
  
  // If we have a scheduled change, show that status
  if (membership.scheduledChange?.confirmed) {
    return 'scheduled_change';
  }
  
  // Fallback to active/inactive based on is_active flag
  return membership.is_active ? 'active' : 'inactive';
}

/**
 * Check if a membership has an active subscription
 */
export function hasActiveSubscription(membership: Membership): boolean {
  const status = getMembershipStatus(membership);
  return ['active', 'trialing', 'scheduled_change'].includes(status);
}

/**
 * Check if a membership status requires attention
 */
export function requiresAttention(membership: Membership): boolean {
  const status = getMembershipStatus(membership);
  return ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(status);
}