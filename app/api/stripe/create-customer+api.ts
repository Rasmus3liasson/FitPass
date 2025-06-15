import { stripe } from '@/src/lib/stripe/stripeConfig';
import { createStripeCustomer, getStripeCustomer } from '@/src/lib/integrations/supabase/queries/stripeQueries';
import { getUserProfile } from '@/src/lib/integrations/supabase/queries';
import { CreateCustomerRequest } from '@/types/stripe';

export async function POST(request: Request) {
  try {
    const { email, name, userId }: CreateCustomerRequest = await request.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'Email and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if customer already exists
    const existingCustomer = await getStripeCustomer(userId);
    if (existingCustomer) {
      return new Response(
        JSON.stringify({ 
          customerId: existingCustomer.stripe_customer_id,
          message: 'Customer already exists'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for additional details
    const userProfile = await getUserProfile(userId);
    const customerName = name || userProfile.display_name || `${userProfile.first_name} ${userProfile.last_name}`.trim();

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: customerName,
      metadata: {
        userId,
      },
    });

    // Save to database
    await createStripeCustomer(userId, stripeCustomer.id, email);

    return new Response(
      JSON.stringify({ 
        customerId: stripeCustomer.id,
        message: 'Customer created successfully'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create customer' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}