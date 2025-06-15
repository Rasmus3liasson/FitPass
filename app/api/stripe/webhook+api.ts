import { stripe, STRIPE_CONFIG } from '@/src/lib/stripe/stripeConfig';
import { 
  updateStripeSubscription, 
  cancelStripeSubscription,
  createStripeSubscription,
  getStripeCustomer 
} from '@/src/lib/integrations/supabase/queries/stripeQueries';
import { updateMembershipPlan, createUserMembership } from '@/src/lib/integrations/supabase/queries';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !STRIPE_CONFIG.webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );

    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Find user by customer ID
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = customer.metadata?.userId;

        if (!userId) {
          console.error('No userId found in customer metadata');
          break;
        }

        // Update subscription in database
        await updateStripeSubscription(subscription.id, {
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        });

        // If subscription is active, update user's membership
        if (subscription.status === 'active') {
          const priceId = subscription.items.data[0]?.price.id;
          if (priceId) {
            // You might want to map Stripe price IDs to your membership plan IDs
            // For now, we'll create a basic membership
            try {
              await createUserMembership(userId, 'default-plan-id');
            } catch (error) {
              console.error('Error updating membership:', error);
            }
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Cancel subscription in database
        await cancelStripeSubscription(subscription.id);
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}