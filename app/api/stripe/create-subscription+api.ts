import { stripe } from '@/src/lib/stripe/stripeConfig';
import { createStripeSubscription, getStripeCustomer } from '@/src/lib/integrations/supabase/queries/stripeQueries';
import { updateMembershipPlan } from '@/src/lib/integrations/supabase/queries';
import { CreateSubscriptionRequest } from '@/types/stripe';

export async function POST(request: Request) {
  try {
    const { priceId, userId }: CreateSubscriptionRequest = await request.json();

    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Price ID and User ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let stripeCustomer = await getStripeCustomer(userId);
    
    if (!stripeCustomer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found. Please create customer first.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.stripe_customer_id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription to database
    await createStripeSubscription(userId, {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create subscription' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}