/**
 * Shared Sentry Configuration
 * 
 * Contains common Sentry configuration values used across all apps.
 * DO NOT initialize Sentry here - each runtime (Expo, Next.js server, Next.js client)
 * must initialize Sentry separately with runtime-specific code.
 * 
 * Version compatibility:
 * - Mobile: @sentry/react-native@7.10.0 (limited features)
 * - Web: @sentry/nextjs@10.36.0 (full features)
 */

export const SENTRY_CONFIG = {
  // Performance monitoring sample rates
  tracesSampleRate: 1.0, // 100% in dev, reduce in production (e.g., 0.1)
  
  // Session replay settings (web only - requires @sentry/nextjs >= 8.0.0)
  replaysOnErrorSampleRate: 1.0, // Always capture replay on error
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  
  // Mobile-specific settings (@sentry/react-native@7.10.0)
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000, // 30 seconds
  enableNative: true,
  
  // Replay settings (web only)
  replayMaskAllText: true,
  replayBlockAllMedia: true,
  
  // Debug mode (should be false in production)
  debug: false,
  
  // Error filtering
  shouldSendInDevelopment: false, // Set to false to avoid sending dev errors
} as const;

export type SentryConfig = typeof SENTRY_CONFIG;
