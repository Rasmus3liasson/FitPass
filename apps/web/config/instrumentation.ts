import * as Sentry from '@sentry/nextjs';
import { SENTRY_CONFIG } from '@shared/config/sentry';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN_NEXT;

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      debug: SENTRY_CONFIG.debug,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development',
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      debug: SENTRY_CONFIG.debug,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development',
    });
  }
}
