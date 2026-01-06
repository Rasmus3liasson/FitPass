import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimiter';
import { supabase } from '../services/database';

const router: Router = Router();

/**
 * Check if email is available for registration
 * Uses service role to access auth.users table
 */
router.post('/check-email', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        available: false,
        error: 'E-postadress krävs',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        available: false,
        error: 'Ogiltig e-postadress',
      });
    }

    // Use service role to check auth.users
    const { data: existingUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error checking email availability:', error);
      return res.status(500).json({
        available: true, // Fail open - let registration handle it
        error: 'Kunde inte kontrollera e-post',
      });
    }

    // Check if email exists (case-insensitive)
    const emailLower = email.toLowerCase();
    const emailExists = existingUsers?.users?.some(
      (u: any) => u.email?.toLowerCase() === emailLower
    );

    if (emailExists) {
      return res.json({
        available: false,
        error: 'Ett konto med denna e-postadress finns redan',
      });
    }

    return res.json({
      available: true,
    });
  } catch (error: any) {
    console.error('Error in check-email endpoint:', error);
    return res.status(500).json({
      available: true, // Fail open
      error: 'Ett fel uppstod',
    });
  }
});

export default router;
