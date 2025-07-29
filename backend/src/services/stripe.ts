import dotenv from 'dotenv';
import Stripe from 'stripe';
import { dbService, supabase } from './database';

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
    // For SEK currency, create a unique customer to avoid currency conflicts
    const uniqueEmail = `${email.split('@')[0]}+sek@${email.split('@')[1]}`;
    
    // First, try to find existing SEK customer
    const customers = await stripe.customers.list({
      email: uniqueEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      console.log('🔍 Found existing SEK customer:', customerId);
      return customerId;
    }

    // Create new SEK customer
    const customer = await stripe.customers.create({
      email: uniqueEmail,
      name: `${name} (SEK)`,
      metadata: userId ? { user_id: userId, currency: 'sek' } : { currency: 'sek' },
    });

    console.log('🆕 Created new SEK customer:', customer.id);
    return customer.id;
  }

  // Create subscription
  async createSubscription(customerId: string, priceId: string, completePayment: boolean = true): Promise<Stripe.Subscription> {
    console.log('🔄 Creating Stripe subscription:', { customerId, priceId, completePayment });
    
    try {
      // For testing, we can add a default test payment method to the customer
      if (completePayment && process.env.NODE_ENV === 'development') {
        console.log('🧪 Adding test payment method for testing...');
        
        // Create a test payment method
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: 'tok_visa', // Test card token
          },
        });

        // Attach to customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customerId,
        });

        // Set as default
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: completePayment ? 'default_incomplete' : 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      console.log('✅ Stripe subscription created:', subscription.id);

      // For testing, automatically confirm the payment if there's a payment intent
      if (completePayment && process.env.NODE_ENV === 'development' && subscription.latest_invoice) {
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
          const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
          if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
            try {
              console.log('🧪 Auto-confirming payment for testing...');
              await stripe.paymentIntents.confirm(paymentIntent.id, {
                payment_method: 'pm_card_visa', // Test payment method
              });
              console.log('✅ Test payment confirmed');
            } catch (paymentError) {
              console.log('⚠️ Auto-payment confirmation failed (this is normal for testing):', paymentError);
            }
          }
        }
      }

      return subscription;
    } catch (error) {
      console.error('❌ Stripe subscription creation failed:', error);
      throw error;
    }
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

  // Complete subscription payment for testing
  async completeSubscriptionPayment(subscriptionId: string): Promise<{success: boolean; message: string}> {
    try {
      console.log('🧪 Attempting to complete payment for subscription:', subscriptionId);
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });

      if (!subscription.latest_invoice) {
        return { success: false, message: 'No invoice found for subscription' };
      }

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      
      if (!invoice.payment_intent) {
        return { success: false, message: 'No payment intent found' };
      }

      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      if (paymentIntent.status === 'succeeded') {
        return { success: true, message: 'Payment already completed' };
      }

      // For testing, use a test payment method
      if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
        await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: 'pm_card_visa',
        });
        
        console.log('✅ Test payment completed for subscription:', subscriptionId);
        return { success: true, message: 'Payment completed successfully' };
      }

      return { success: false, message: `Payment intent status: ${paymentIntent.status}` };
    } catch (error: any) {
      console.error('❌ Error completing subscription payment:', error);
      return { success: false, message: error.message };
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
                unit_amount: plan.price * 100, // Convert to öre (SEK cents)
                currency: 'sek',
                recurring: { interval: 'month' },
                metadata: {
                  plan_id: plan.id,
                },
              });
              
              // Deactivate old price
              await stripe.prices.update(plan.stripe_price_id, { active: false });
              console.log(`💰 Created new price for ${stripeProduct.name}: ${plan.price} SEK`);
            } else {
              stripePrice = existingPrice;
              console.log(`✅ Price up to date for ${stripeProduct.name}`);
            }
          } catch (error) {
            // Price doesn't exist, create new one
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: plan.price * 100,
              currency: 'sek',
              recurring: { interval: 'month' },
              metadata: {
                plan_id: plan.id,
              },
            });
            console.log(`💰 Created price for ${stripeProduct.name}: ${plan.price} SEK`);
          }
        } else {
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: plan.price * 100,
            currency: 'sek',
            recurring: { interval: 'month' },
            metadata: {
              plan_id: plan.id,
            },
          });
          console.log(`💰 Created price for ${stripeProduct.name}: ${plan.price} SEK`);
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

  // Sync products FROM Stripe TO database (reverse sync)
  async syncProductsFromStripeToDatabase(): Promise<{
    created: number;
    updated: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    console.log('🔄 Starting reverse product sync (Stripe → Database)...');
    
    const result = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ productId: string; error: string }>
    };

    try {
      // Hämta alla produkter från Stripe
      const stripeProducts = await stripe.products.list({
        active: true,
        limit: 100,
        expand: ['data.default_price']
      });

      console.log(`📋 Found ${stripeProducts.data.length} products in Stripe`);

      for (const stripeProduct of stripeProducts.data) {
        try {
          await this.processSingleStripeProduct(stripeProduct, result);
        } catch (error: any) {
          console.error(`❌ Error processing product ${stripeProduct.id}:`, error);
          result.errors.push({
            productId: stripeProduct.id,
            error: error.message
          });
        }
      }

      console.log(`🎉 Reverse product sync completed: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
      return result;

    } catch (error: any) {
      console.error('❌ Fatal error during reverse product sync:', error);
      throw new Error(`Reverse product sync failed: ${error.message}`);
    }
  }

  private async processSingleStripeProduct(
    stripeProduct: Stripe.Product,
    result: { created: number; updated: number; errors: Array<{ productId: string; error: string }> }
  ): Promise<void> {
    // Kolla om produkten redan finns i databasen
    const existingPlan = await this.findMembershipPlanByStripeProduct(stripeProduct.id);

    // Hämta default price för produkten
    let defaultPrice: Stripe.Price | null = null;
    if (stripeProduct.default_price) {
      if (typeof stripeProduct.default_price === 'string') {
        defaultPrice = await stripe.prices.retrieve(stripeProduct.default_price);
      } else {
        defaultPrice = stripeProduct.default_price;
      }
    }

    if (!defaultPrice) {
      throw new Error(`No default price found for product ${stripeProduct.name}`);
    }

    // Konvertera från öre till kronor
    const price = (defaultPrice.unit_amount || 0) / 100;
    
    // Extrahera credits från metadata eller använd default
    const credits = parseInt(stripeProduct.metadata?.credits || '10');

    const planData = {
      title: stripeProduct.name,
      description: stripeProduct.description || '',
      price: price,
      credits: credits,
      features: stripeProduct.features?.map(f => f.name).filter((name): name is string => name !== undefined) || [],
      popular: false, // Default value
      button_text: 'Välj Plan', // Add required button_text
      stripe_product_id: stripeProduct.id,
      stripe_price_id: defaultPrice.id,
      updated_at: new Date().toISOString()
    };

    if (existingPlan) {
      // Uppdatera befintlig plan
      await dbService.updateMembershipPlan(existingPlan.id, planData);
      result.updated++;
      console.log(`✅ Updated plan: ${stripeProduct.name}`);
    } else {
      // Skapa ny plan
      const newPlan = await dbService.createMembershipPlan({
        ...planData,
        created_at: new Date().toISOString()
      });
      result.created++;
      console.log(`🆕 Created plan: ${stripeProduct.name}`);
    }
  }

  private async findMembershipPlanByStripeProduct(stripeProductId: string): Promise<any> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('stripe_product_id', stripeProductId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error finding membership plan: ${error.message}`);
    }

    return data;
  }

  // Get all Stripe products with their prices
  async getAllStripeProducts(): Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    metadata: Stripe.Product['metadata'];
    default_price: {
      id: string;
      unit_amount: number | null;
      currency: string;
    } | null;
  }>> {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price']
    });

    return products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      default_price: product.default_price ? {
        id: typeof product.default_price === 'string' ? product.default_price : product.default_price.id,
        unit_amount: typeof product.default_price === 'string' ? null : product.default_price.unit_amount,
        currency: typeof product.default_price === 'string' ? 'sek' : product.default_price.currency,
      } : null
    }));
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

  // Sync all subscriptions from Stripe to local database
  async syncSubscriptionsFromStripe(): Promise<{
    created: number;
    updated: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    console.log('🔄 Starting comprehensive subscription sync from Stripe...');
    
    const result = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>
    };

    try {
      // Get all subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        expand: ['data.customer', 'data.items.data.price', 'data.latest_invoice']
      });

      console.log(`📋 Found ${subscriptions.data.length} subscriptions in Stripe`);

      for (const stripeSubscription of subscriptions.data) {
        try {
          await this.processSingleSubscriptionComplete(stripeSubscription, result);
        } catch (error: any) {
          console.error(`❌ Error processing subscription ${stripeSubscription.id}:`, error);
          result.errors.push({
            subscriptionId: stripeSubscription.id,
            error: error.message
          });
        }
      }

      console.log(`🎉 Comprehensive subscription sync completed: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
      return result;

    } catch (error: any) {
      console.error('❌ Fatal error during subscription sync:', error);
      throw new Error(`Subscription sync failed: ${error.message}`);
    }
  }

  private async processSingleSubscriptionComplete(
    stripeSubscription: Stripe.Subscription,
    result: { created: number; updated: number; errors: Array<{ subscriptionId: string; error: string }> }
  ): Promise<void> {
    const customerId = typeof stripeSubscription.customer === 'string' 
      ? stripeSubscription.customer 
      : stripeSubscription.customer?.id;

    if (!customerId) {
      throw new Error('No customer ID found for subscription');
    }

    // Find user by stripe_customer_id
    const user = await this.findUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(`⚠️ No user found for Stripe customer ID: ${customerId}, skipping...`);
      return;
    }

    // Get price_id from subscription items
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new Error('No price ID found in subscription items');
    }

    // Find corresponding membership plan
    const membershipPlan = await this.findMembershipPlanByStripePrice(priceId);
    if (!membershipPlan) {
      console.log(`⚠️ No membership plan found for Stripe price ID: ${priceId}, skipping...`);
      return;
    }

    // Calculate dates and trial information
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);
    const isActive = ['active', 'trialing', 'past_due'].includes(stripeSubscription.status);
    
    // Check if subscription has trial
    const hasTrialPeriod = stripeSubscription.trial_start && stripeSubscription.trial_end;
    const trialEndDate = hasTrialPeriod ? new Date(stripeSubscription.trial_end! * 1000) : null;
    const isInTrial = stripeSubscription.status === 'trialing';
    
    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (isInTrial && trialEndDate) {
      const now = new Date();
      const timeDiff = trialEndDate.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }

    // Check if membership already exists
    const existingMembership = await this.findExistingMembershipBySubscription(stripeSubscription.id);

    // Prepare comprehensive membership data
    const membershipData = {
      user_id: user.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      // Preserve existing credits_used if updating, otherwise start with 0
      credits_used: existingMembership?.credits_used || 0,
      has_used_trial: hasTrialPeriod || existingMembership?.has_used_trial || false,
      trial_end_date: trialEndDate?.toISOString() || undefined,
      trial_days_remaining: trialDaysRemaining || undefined,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: isActive,
      plan_id: membershipPlan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      stripe_status: stripeSubscription.status,
      updated_at: new Date().toISOString()
    };

    console.log(`📝 Processing membership for user ${user.id}:`, {
      plan_type: membershipData.plan_type,
      stripe_status: membershipData.stripe_status,
      is_active: membershipData.is_active,
      has_trial: hasTrialPeriod,
      trial_days_remaining: trialDaysRemaining
    });

    if (existingMembership) {
      // Update existing membership with all Stripe data
      await dbService.updateMembership(existingMembership.id, membershipData);
      result.updated++;
      console.log(`✅ Updated membership for user ${user.id} (${membershipData.plan_type})`);
    } else {
      // Create new membership with complete data
      await dbService.createMembership({
        ...membershipData,
        created_at: new Date().toISOString()
      });
      result.created++;
      console.log(`🆕 Created membership for user ${user.id} (${membershipData.plan_type})`);
    }
  }

  private async findExistingMembershipBySubscription(stripeSubscriptionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error finding existing membership: ${error.message}`);
    }

    return data;
  }

  private async processSingleSubscription(
    stripeSubscription: Stripe.Subscription,
    result: { created: number; updated: number; errors: Array<{ subscriptionId: string; error: string }> }
  ): Promise<void> {
    const customerId = typeof stripeSubscription.customer === 'string' 
      ? stripeSubscription.customer 
      : stripeSubscription.customer?.id;

    if (!customerId) {
      throw new Error('No customer ID found for subscription');
    }

    // Hitta användaren via stripe_customer_id
    const user = await this.findUserByStripeCustomerId(customerId);
    if (!user) {
      throw new Error(`No user found for Stripe customer ID: ${customerId}`);
    }

    // Hämta första price_id från subscription items
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new Error('No price ID found in subscription items');
    }

    // Hitta motsvarande membership plan
    const membershipPlan = await this.findMembershipPlanByStripePrice(priceId);
    if (!membershipPlan) {
      throw new Error(`No membership plan found for Stripe price ID: ${priceId}`);
    }

    // Beräkna datum
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);
    const isActive = ['active', 'trialing'].includes(stripeSubscription.status);

    // Kolla om medlemskap redan finns
    const existingMembership = await this.findExistingMembership(user.id, stripeSubscription.id);

    const membershipData = {
      user_id: user.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: isActive,
      plan_id: membershipPlan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      stripe_status: stripeSubscription.status,
      updated_at: new Date().toISOString()
    };

    if (existingMembership) {
      // Uppdatera befintligt medlemskap
      await dbService.updateMembership(existingMembership.id, membershipData);
      result.updated++;
      console.log(`✅ Updated membership for user ${user.id}`);
    } else {
      // Skapa nytt medlemskap
      await dbService.createMembership({
        ...membershipData,
        credits_used: 0,
        has_used_trial: false,
        created_at: new Date().toISOString()
      });
      result.created++;
      console.log(`🆕 Created membership for user ${user.id}`);
    }
  }

  private async findUserByStripeCustomerId(stripeCustomerId: string): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error finding user: ${error.message}`);
    }

    return data ? { id: data.user_id } : null;
  }

  private async findMembershipPlanByStripePrice(stripePriceId: string): Promise<any> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('stripe_price_id', stripePriceId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error finding membership plan: ${error.message}`);
    }

    return data;
  }

  private async findExistingMembership(userId: string, stripeSubscriptionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error finding existing membership: ${error.message}`);
    }

    return data;
  }
}

export const stripeService = new StripeService();
