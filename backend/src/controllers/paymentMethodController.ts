import { Request, Response } from 'express';
import { supabase } from '../services/database';
import { stripe, stripeService } from '../services/stripe';
import { CreatePaymentMethodRequest } from '../types/api';
import { createSampleTestCard } from '../utils/helpers';
import { handleControllerError, sendErrorResponse, sendSuccessResponse } from '../utils/response';

export class PaymentMethodController {
  async createPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 /create-payment-method endpoint called with:', req.body);
      const {
        customerId,
        cardNumber,
        expMonth,
        expYear,
        cvc,
        isUserAdded,
        userId,
        email,
        name,
      }: CreatePaymentMethodRequest = req.body;

      let actualCustomerId = customerId;

      // If no customer ID provided, we need to create a customer
      if (!actualCustomerId) {
        if (!userId || !email) {
          sendErrorResponse(
            res,
            'Customer ID is required, or userId and email must be provided to create a new customer',
            undefined,
            400
          );
          return;
        }

        console.log('🆕 Creating new customer for user:', userId);

        try {
          // Create customer using the stripe service
          actualCustomerId = await stripeService.createOrGetCustomer(
            email,
            name || email.split('@')[0], // Use email prefix as name fallback
            userId
          );

          console.log('✅ Created new customer:', actualCustomerId);
        } catch (createError: any) {
          console.error('❌ Error creating customer:', createError);
          sendErrorResponse(res, createError.message, 'Failed to create customer');
          return;
        }
      }

      // In test mode, use token-based approach for security
      let paymentMethod: any;

      if (process.env.NODE_ENV === 'development') {
        const token = createSampleTestCard(cardNumber || '4242424242424242');

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

      const responseData = {
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
        },
        customerId: actualCustomerId, // Return the customer ID that was used/created
      };

      sendSuccessResponse(res, responseData);
    } catch (error: any) {
      handleControllerError(res, error, 'Create payment method');
    }
  }

  async setDefaultPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 /set-default-payment-method endpoint called with:', req.params, req.body);
      const { customerId } = req.params;
      const { paymentMethodId } = req.body;

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log('✅ Default payment method set:', paymentMethodId);

      sendSuccessResponse(res, null, 'Default payment method updated');
    } catch (error: any) {
      handleControllerError(res, error, 'Set default payment method');
    }
  }

  async getCustomerPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;

      console.log('🔍 Getting payment methods for customer:', customerId);

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // Get customer to see default payment method
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = customer.deleted
        ? null
        : (customer.invoice_settings?.default_payment_method as string | null);

      // Check if customer has real (user-added) payment methods
      const hasRealPaymentMethods = await stripeService.customerHasRealPaymentMethods(customerId);

      const responseData = {
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => {
          const securePaymentMethod: any = {
            id: pm.id,
            type: pm.type,
            isDefault: pm.id === defaultPaymentMethodId,
            isUserAdded: pm.metadata?.user_added === 'true',
            isAutoGenerated: pm.metadata?.auto_generated === 'true',
            created: pm.created,
            billing_details: {
              name: pm.billing_details?.name || null,
              email: pm.billing_details?.email || null,
            },
          };

          if (pm.card) {
            securePaymentMethod.card = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding,
              country: pm.card.country,
            };
          }

          return securePaymentMethod;
        }),
      };

      sendSuccessResponse(res, responseData);
    } catch (error: any) {
      handleControllerError(res, error, 'Get customer payment methods');
    }
  }

  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { paymentMethodId } = req.params;
      console.log('🔍 Deleting payment method:', paymentMethodId);

      await stripe.paymentMethods.detach(paymentMethodId);

      console.log('✅ Payment method deleted:', paymentMethodId);

      sendSuccessResponse(res, null, 'Payment method deleted');
    } catch (error: any) {
      handleControllerError(res, error, 'Delete payment method');
    }
  }

  async getUserPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      console.log('🔍 Getting payment methods for user:', userId, 'email:', email);

      let customerId: string | null = null;

      // Check if user already has a Stripe customer ID
      const { data: existingCustomer, error: customerError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 Profile customer check:', { data: existingCustomer, error: customerError });

      if (existingCustomer?.stripe_customer_id) {
        customerId = existingCustomer.stripe_customer_id;
        console.log('✅ Found existing customer ID in database:', customerId);
      } else if (email) {
        console.log('🔍 Getting or creating Stripe customer for email:', email);
        customerId = await stripeService.createOrGetCustomer(email, email, userId);

        // Update profile with customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Error saving customer ID to profiles:', updateError);
        } else {
          console.log('✅ Saved customer ID to profiles table:', customerId);
        }
      } else {
        sendErrorResponse(res, 'Email required for new customers', undefined, 400);
        return;
      }

      if (!customerId) {
        sendErrorResponse(res, 'Could not determine customer ID', undefined, 400);
        return;
      }

      // Get payment methods for this customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // Get customer to see default payment method
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = customer.deleted
        ? null
        : (customer.invoice_settings?.default_payment_method as string | null);

      // Check if customer has real payment methods
      const hasRealPaymentMethods = await stripeService.customerHasRealPaymentMethods(customerId);

      console.log(
        '📊 Found payment methods count:',
        paymentMethods.data.length,
        'hasReal:',
        hasRealPaymentMethods
      );

      const responseData = {
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => {
          return {
            id: pm.id,
            type: pm.type,
            isDefault: pm.id === defaultPaymentMethodId,
            isUserAdded: pm.metadata?.user_added === 'true',
            isAutoGenerated: pm.metadata?.auto_generated === 'true',
            card: pm.card
              ? {
                  brand: pm.card.brand,
                  last4: pm.card.last4,
                  exp_month: pm.card.exp_month,
                  exp_year: pm.card.exp_year,
                  funding: pm.card.funding,
                  country: pm.card.country,
                }
              : null,
            created: pm.created,
          };
        }),
        customerId,
      };

      // 🚨 DETAILED UI LOGGING - This shows exactly what the UI receives
      console.log('🎯 UI PAYMENT METHOD RESPONSE:', {
        userId,
        email,
        customerId,
        hasRealPaymentMethods,
        paymentMethodCount: paymentMethods.data.length,
        paymentMethodIds: paymentMethods.data.map((pm) => pm.id),
        shouldShowAddCardPrompt: !hasRealPaymentMethods,
        responsePreview: {
          hasRealPaymentMethods: responseData.hasRealPaymentMethods,
          paymentMethodsLength: responseData.paymentMethods.length,
          customerId: responseData.customerId,
        },
      });

      if (!hasRealPaymentMethods) {
        console.log(
          "⚠️  UI ALERT: User should see 'Add Card Information' prompt because hasRealPaymentMethods=false"
        );
      } else {
        console.log(
          "✅ UI SUCCESS: User should NOT see 'Add Card Information' prompt because hasRealPaymentMethods=true"
        );
      }

      sendSuccessResponse(res, responseData);
    } catch (error: any) {
      handleControllerError(res, error, 'Get user payment methods');
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
