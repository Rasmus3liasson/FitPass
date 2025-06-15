import { stripe } from '@/src/lib/stripe/stripeConfig';

export async function GET(request: Request) {
  try {
    // Get all active prices with their products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    const formattedPrices = prices.data
      .filter(price => price.recurring) // Only subscription prices
      .map(price => ({
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        product: {
          id: price.product.id,
          name: price.product.name,
          description: price.product.description,
          metadata: price.product.metadata,
        },
      }));

    return new Response(
      JSON.stringify({ prices: formattedPrices }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching prices:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch prices' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}