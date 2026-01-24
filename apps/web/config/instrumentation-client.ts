import * as Sentry from '@sentry/nextjs';
import { SENTRY_CONFIG } from '@shared/config/sentry';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN_NEXT;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
  debug: SENTRY_CONFIG.debug,
  replaysOnErrorSampleRate: SENTRY_CONFIG.replaysOnErrorSampleRate,
  replaysSessionSampleRate: SENTRY_CONFIG.replaysSessionSampleRate,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: SENTRY_CONFIG.replayMaskAllText,
      blockAllMedia: SENTRY_CONFIG.replayBlockAllMedia,
    }),
  ],
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development',
});

// Required for router instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
