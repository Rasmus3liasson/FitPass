import { stripe } from '@/src/lib/stripe/stripeConfig';
import { getUserStripeSubscription } from '@/src/lib/integrations/supabase/queries/stripeQueries';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription from database
    const userSubscription = await getUserStripeSubscription(userId);
    
    if (!userSubscription) {
      return new Response(
        JSON.stringify({ subscription: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get detailed subscription info from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      userSubscription.stripe_subscription_id,
      {
        expand: ['items.data.price.product'],
      }
    );

    const subscriptionWithDetails = {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      items: stripeSubscription.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          recurring: item.price.recurring,
          product: item.price.product,
        },
      })),
    };

    return new Response(
      JSON.stringify({ subscription: subscriptionWithDetails }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch subscription' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}