import { Request, Response, Router } from 'express';
import { supabase } from '../../services/database';
import { stripe } from '../../services/stripe';

const router = Router();

/**
 * POST /api/stripe/connect/onboarding
 * Create Stripe Connect Express account and onboarding link
 */
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const { returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      return res.status(400).json({
        error: 'Missing returnUrl or refreshUrl',
      });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Get user from Supabase JWT
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate user has club role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'club') {
      return res.status(403).json({
        error: 'User must have club role to connect Stripe account',
      });
    }

    // Get user's club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return res.status(404).json({ error: 'Club not found for this user' });
    }

    // Check if club already has a Stripe account
    if (club.stripe_account_id) {
      return res.status(400).json({
        error: 'Club already has a connected Stripe account',
      });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'SE', // Sweden
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: club.name,
      },
    });

    // Save stripe_account_id to database
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        stripe_account_id: account.id,
        kyc_status: 'pending',
      })
      .eq('id', club.id);

    if (updateError) {
      // Try to delete the Stripe account if DB update fails
      try {
        await stripe.accounts.del(account.id);
      } catch (e) {
        console.error('Failed to delete Stripe account after DB error:', e);
      }
      return res.status(500).json({
        error: 'Failed to save Stripe account to database',
      });
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return res.status(200).json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error in create-stripe-onboarding:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * POST /api/stripe/connect/update-link
 * Create Stripe Connect account update link for existing accounts
 */
router.post('/update-link', async (req: Request, res: Response) => {
  try {
    const { returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      return res.status(400).json({
        error: 'Missing returnUrl or refreshUrl',
      });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Get user from Supabase JWT
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate user has club role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'club') {
      return res.status(403).json({
        error: 'User must have club role to update Stripe account',
      });
    }

    // Get user's club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return res.status(404).json({ error: 'Club not found for this user' });
    }

    // Check if club has a Stripe account
    if (!club.stripe_account_id) {
      return res.status(400).json({
        error: 'Club does not have a connected Stripe account',
      });
    }

    // Create account link for updating information
    const accountLink = await stripe.accountLinks.create({
      account: club.stripe_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Error in create-stripe-update-link:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * GET /api/stripe/stripe-connect-return
 * Handle return from Stripe onboarding (success)
 */
router.get('/stripe-connect-return', async (req: Request, res: Response) => {
  // Send HTML that redirects back to the app with success message
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stripe Onboarding Complete</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        p {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 30px;
        }
        .button {
          background: white;
          color: #667eea;
          border: none;
          padding: 15px 40px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Stripe-anslutning klar!</h1>
        <p>Din klubb är nu ansluten till Stripe. Du kan nu ta emot utbetalningar från FitPass-bokningar.</p>
        <p style="font-size: 14px; opacity: 0.7;">Du kan stänga denna flik och gå tillbaka till appen.</p>
      </div>
      <script>
        // Try to close the window after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

/**
 * GET /api/stripe/stripe-connect-refresh
 * Handle refresh from Stripe onboarding (user needs to restart)
 */
router.get('/stripe-connect-refresh', async (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stripe Onboarding</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        p {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⏳</div>
        <h1>Onboarding avbruten</h1>
        <p>Du kan stänga denna flik och försöka igen från appen.</p>
        <p style="font-size: 14px; opacity: 0.7;">Klicka på "Anslut till Stripe" igen för att fortsätta.</p>
      </div>
      <script>
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

export default router;
