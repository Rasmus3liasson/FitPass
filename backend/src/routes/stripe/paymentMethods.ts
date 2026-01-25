import { Request, Response, Router } from 'express';
import { supabase } from '../../services/database';
import { stripe, stripeService } from '../../services/stripe';

const router: Router = Router() as Router;

// Create payment method
router.post('/create-payment-method', async (req: Request, res: Response) => {
  try {
    const { customerId, cardNumber, expMonth, expYear, cvc, isUserAdded } = req.body;

    let actualCustomerId = customerId;

    // If no customer ID provided, we need to create a customer
    if (!actualCustomerId) {
      // We need user info to create a customer
      const { userId, email, name } = req.body;

      if (!userId || !email) {
        return res.status(400).json({
          error:
            'Customer ID is required, or userId and email must be provided to create a new customer',
        });
      }

      try {
        // Create customer using the stripe service
        actualCustomerId = await stripeService.createOrGetCustomer(
          email,
          name || email.split('@')[0], // Use email prefix as name fallback
          userId
        );
      } catch (createError: any) {
        return res.status(500).json({
          success: false,
          error: createError.message,
          message: 'Failed to create customer',
        });
      }
    }

    // In test mode, use token-based approach for security
    let paymentMethod: any;

    if (process.env.NODE_ENV === 'development') {
      // Map common test card numbers to tokens
      const testTokenMap: { [key: string]: string } = {
        '4242424242424242': 'tok_visa',
        '4000000000000002': 'tok_visa_debit',
        '5555555555554444': 'tok_mastercard',
        '4000002500003155': 'tok_visa', // 3D Secure
        '4000000000009995': 'tok_visa', // Insufficient funds
      };

      const token = testTokenMap[cardNumber] || 'tok_visa';

      paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: token,
        },
        // Mark if this was user-added vs auto-generated
        metadata: {
          user_added: isUserAdded !== false ? 'true' : 'false',
          created_via: 'fitpass_app',
          card_number_hint: cardNumber ? cardNumber.slice(-4) : '4242',
        },
      });
    } else {
      // In production, you would use Stripe Elements or similar secure method
      // This is just a fallback - never use raw card data in production
      paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumber || '4242424242424242',
          exp_month: expMonth || 12,
          exp_year: expYear || 2028,
          cvc: cvc || '123',
        },
        metadata: {
          user_added: 'true',
          created_via: 'fitpass_app',
        },
      });
    }

    // Attach to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: actualCustomerId,
    });

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            }
          : null,
        metadata: paymentMethod.metadata,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Attach payment method to customer
router.post('/attach-payment-method', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, customerId } = req.body;

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({
        error: 'Payment method ID and customer ID are required',
      });
    }

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    res.json({ success: true, paymentMethod });
  } catch (error: any) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer payment methods
router.get('/customer/:customerId/payment-methods', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get all payment methods for the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Transform the response to include only necessary information
    const formattedPaymentMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
          }
        : null,
      created: pm.created,
      metadata: pm.metadata || {},
    }));

    res.json({
      success: true,
      paymentMethods: formattedPaymentMethods,
      hasPaymentMethods: formattedPaymentMethods.length > 0,
    });
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user payment methods by user ID
router.get('/user/:userId/payment-methods', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get customer ID from user profile or membership
    let customerId = null;

    // First try to get from active membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (membership?.stripe_customer_id) {
      customerId = membership.stripe_customer_id;
    } else {
      // Fallback to profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      }
    }

    if (!customerId) {
      return res.json({
        success: true,
        paymentMethods: [],
        hasPaymentMethods: false,
        message: 'No Stripe customer found for user',
      });
    }

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = !customer.deleted
      ? customer.invoice_settings?.default_payment_method
      : null;

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const formattedPaymentMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
          }
        : null,
      created: pm.created,
      metadata: pm.metadata || {},
      isDefault: pm.id === defaultPaymentMethodId,
    }));

    res.json({
      success: true,
      paymentMethods: formattedPaymentMethods,
      hasPaymentMethods: formattedPaymentMethods.length > 0,
      customerId,
    });
  } catch (error: any) {
    console.error('Error getting user payment methods:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete payment method
router.delete('/payment-method/:paymentMethodId', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set default payment method for user (by userId)
router.post('/user/:userId/default-payment-method', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { paymentMethodId } = req.body;

    if (!userId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and payment method ID are required',
      });
    }

    // Get customer ID from user profile or membership
    let customerId = null;

    // First try to get from active membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (membership?.stripe_customer_id) {
      customerId = membership.stripe_customer_id;
    } else {
      // Fallback to profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      }
    }

    if (!customerId) {
      return res.status(404).json({
        success: false,
        error: 'No Stripe customer found for user',
      });
    }

    // Update the customer's default payment method
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      success: true,
      message: 'Default payment method updated successfully',
      customer: {
        id: customer.id,
        defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
      },
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set default payment method (by customerId - for backwards compatibility)
router.post('/customer/:customerId/default-payment-method', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { paymentMethodId } = req.body;

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({
        error: 'Customer ID and payment method ID are required',
      });
    }

    // Update the customer's default payment method
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      success: true,
      message: 'Default payment method updated successfully',
      customer: {
        id: customer.id,
        defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
      },
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update payment method for user
router.post('/user/:userId/update-payment-method', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { paymentMethodId } = req.body;

    if (!userId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and payment method ID are required',
      });
    }

    // Get user's customer ID and subscription
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership?.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        error: 'No Stripe customer found for user',
      });
    }

    // Set as default payment method for customer
    await stripe.customers.update(membership.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // If user has a subscription, update the subscription's default payment method
    if (membership.stripe_subscription_id) {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        default_payment_method: paymentMethodId,
      });
    }

    res.json({
      success: true,
      message: 'Payment method updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
