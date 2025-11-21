import { Request, Response, Router } from "express";
import { supabase } from "../../services/database";
import { stripe } from "../../services/stripe";

const router = Router();

// Get billing history for a user
router.get("/user/:userId/billing-history", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get customer ID from user profile or membership
    let customerId = null;

    // First try to get from active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (membership?.stripe_customer_id) {
      customerId = membership.stripe_customer_id;
    } else {
      // Fallback to profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      }
    }

    if (!customerId) {
      return res.json({
        success: true,
        history: [],
        message: "No Stripe customer found for user"
      });
    }

    // Get billing history from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
      expand: ['data.subscription', 'data.payment_intent']
    });

    // Transform invoices into billing history format
    const history = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      description: invoice.description || 'Subscription payment',
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      subscription_id: invoice.subscription,
      payment_intent: invoice.payment_intent ? {
        id: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id,
        status: typeof invoice.payment_intent === 'string' ? null : invoice.payment_intent.status
      } : null
    }));

    res.json({
      success: true,
      history,
      customerId
    });

  } catch (error: any) {
    console.error("Error getting billing history:", error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError' && error.message.includes('No such customer')) {
      return res.json({
        success: true,
        history: [],
        message: "Customer not found in Stripe"
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get upcoming invoice for a user
router.get("/user/:userId/upcoming-invoice", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get customer ID and subscription ID
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership?.stripe_customer_id || !membership?.stripe_subscription_id) {
      return res.json({
        success: true,
        upcoming_invoice: null,
        message: "No active subscription found"
      });
    }

    // Get upcoming invoice from Stripe
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: membership.stripe_customer_id,
      subscription: membership.stripe_subscription_id
    });

    const upcoming = {
      id: null, // Upcoming invoices don't have IDs until they're created
      amount: upcomingInvoice.total,
      currency: upcomingInvoice.currency,
      period_start: upcomingInvoice.period_start,
      period_end: upcomingInvoice.period_end,
      next_payment_attempt: upcomingInvoice.next_payment_attempt,
      subscription_id: upcomingInvoice.subscription
    };

    res.json({
      success: true,
      upcoming_invoice: upcoming,
      customerId: membership.stripe_customer_id
    });

  } catch (error: any) {
    console.error("Error getting upcoming invoice:", error);
    
    // Handle case where there's no upcoming invoice
    if (error.type === 'StripeInvalidRequestError') {
      return res.json({
        success: true,
        upcoming_invoice: null,
        message: "No upcoming invoice found"
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Download invoice PDF
router.get("/invoice/:invoiceId/pdf", async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ 
        success: false, 
        error: "Invoice ID is required" 
      });
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (!invoice.invoice_pdf) {
      return res.status(404).json({
        success: false,
        error: "Invoice PDF not available"
      });
    }

    // Redirect to the Stripe-hosted PDF
    res.redirect(invoice.invoice_pdf);

  } catch (error: any) {
    console.error("Error getting invoice PDF:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;