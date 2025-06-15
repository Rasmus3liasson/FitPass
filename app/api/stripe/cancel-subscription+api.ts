import { stripe } from '@/src/lib/stripe/stripeConfig';
import { cancelStripeSubscription, getUserStripeSubscription } from '@/src/lib/integrations/supabase/queries/stripeQueries';

export async function POST(request: Request) {
  try {
    const { userId, immediate = false } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active subscription
    const userSubscription = await getUserStripeSubscription(userId);
    
    if (!userSubscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      userSubscription.stripe_subscription_id,
      {
        cancel_at_period_end: !immediate,
        ...(immediate && { cancel_at: Math.floor(Date.now() / 1000) }),
      }
    );

    // Update in database
    await cancelStripeSubscription(userSubscription.stripe_subscription_id);

    return new Response(
      JSON.stringify({
        message: immediate ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: canceledSubscription.current_period_end,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to cancel subscription' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}