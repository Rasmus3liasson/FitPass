import dotenv from 'dotenv';
import Stripe from 'stripe';
import { dbService } from './database';

// Load environment variables from root directory  
dotenv.config({ path: '../.env' });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  // Create or get Stripe customer
  async createOrGetCustomer(email: string, name: string, userId?: string): Promise<string> {
    // First, try to find existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      
      // Update database with customer ID if user ID provided
      if (userId) {
        await dbService.updateUserStripeCustomerId(userId, customerId);
      }
      
      return customerId;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: userId ? { user_id: userId } : {},
    });

    // Update database with customer ID if user ID provided
    if (userId) {
      await dbService.updateUserStripeCustomerId(userId, customer.id);
    }

    return customer.id;
  }

  // Create subscription
  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    return updatedSubscription;
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  // Sync products with database
  async syncProductsWithDatabase(): Promise<void> {
    console.log('🔄 Starting Stripe product sync...');
    
    // Get all membership plans from database
    const membershipPlans = await dbService.getMembershipPlans();
    
    for (const plan of membershipPlans) {
      try {
        // Create or update Stripe product
        let stripeProduct: Stripe.Product;
        
        if (plan.stripe_product_id) {
          // Update existing product
          stripeProduct = await stripe.products.update(plan.stripe_product_id, {
            name: plan.title,
            description: plan.description,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`✅ Updated Stripe product: ${stripeProduct.name}`);
        } else {
          // Create new product
          stripeProduct = await stripe.products.create({
            name: plan.title,
            description: plan.description,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`🆕 Created Stripe product: ${stripeProduct.name}`);
        }

        // Create or update price
        let stripePrice: Stripe.Price;
        
        if (plan.stripe_price_id) {
          // Check if price needs updating (Stripe prices are immutable, so we may need to create a new one)
          try {
            const existingPrice = await stripe.prices.retrieve(plan.stripe_price_id);
            if (existingPrice.unit_amount !== plan.price * 100) {
              // Create new price if amount changed
              stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: plan.price * 100, // Convert to cents
                currency: 'usd',
                recurring: { interval: 'month' },
                metadata: {
                  plan_id: plan.id,
                },
              });
              
              // Deactivate old price
              await stripe.prices.update(plan.stripe_price_id, { active: false });
              console.log(`💰 Created new price for ${stripeProduct.name}: $${plan.price}`);
            } else {
              stripePrice = existingPrice;
              console.log(`✅ Price up to date for ${stripeProduct.name}`);
            }
          } catch (error) {
            // Price doesn't exist, create new one
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: plan.price * 100,
              currency: 'usd',
              recurring: { interval: 'month' },
              metadata: {
                plan_id: plan.id,
              },
            });
            console.log(`💰 Created price for ${stripeProduct.name}: $${plan.price}`);
          }
        } else {
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: plan.price * 100,
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: {
              plan_id: plan.id,
            },
          });
          console.log(`💰 Created price for ${stripeProduct.name}: $${plan.price}`);
        }

        // Update database with Stripe IDs
        await dbService.updateMembershipPlanStripeIds(
          plan.id,
          stripeProduct.id,
          stripePrice.id
        );
        
        console.log(`✅ Synced ${plan.title} - Product: ${stripeProduct.id}, Price: ${stripePrice.id}`);
        
      } catch (error) {
        console.error(`❌ Error syncing plan ${plan.title}:`, error);
      }
    }
    
    console.log('🎉 Stripe product sync completed!');
  }

  // Handle webhook events
  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Webhook received: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('📝 Processing subscription created:', subscription.id);
    
    // Update database subscription record
    await dbService.updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('📝 Processing subscription updated:', subscription.id);
    
    await dbService.updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : undefined,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('📝 Processing subscription deleted:', subscription.id);
    
    await dbService.updateSubscription(subscription.id, {
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('💰 Payment succeeded for invoice:', invoice.id);
    
    if (invoice.subscription) {
      const subscription = await dbService.getSubscriptionByStripeId(invoice.subscription as string);
      if (subscription) {
        // Update membership credits or extend subscription
        // This is where you'd implement your business logic
        console.log('✅ Payment processed for subscription:', subscription.id);
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('❌ Payment failed for invoice:', invoice.id);
    
    if (invoice.subscription) {
      const subscription = await dbService.getSubscriptionByStripeId(invoice.subscription as string);
      if (subscription) {
        // Handle failed payment - maybe send notification
        console.log('⚠️ Payment failed for subscription:', subscription.id);
      }
    }
  }
}

export const stripeService = new StripeService();
