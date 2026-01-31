import { Request, Response } from 'express';
import { supabase } from '../services/database';

/**
 * Simple health check for DB connection
 * GET /api/db-health
 */
export default async function dbHealthCheck(req: Request, res: Response) {
  try {
    // Try to fetch 1 row from a known table (membership_plans)
    const { data, error } = await supabase.from('membership_plans').select('*').limit(1);
    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, found: data.length });
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    }
    return res.status(500).json({ ok: false, error: message });
  }
}
