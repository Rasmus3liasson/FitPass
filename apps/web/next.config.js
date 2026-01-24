const { withSentryConfig } = require("@sentry/nextjs");
const path = require('path');

// Load environment variables from root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fitpass/shared', '@fitpass/ui'],
  
  experimental: {
    instrumentationHook: true,
  },
  
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN_NEXT,
    SENTRY_DSN_NEXT: process.env.SENTRY_DSN_NEXT,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

// Sentry webpack plugin options
const sentryWebpackPluginOptions = {
  silent: true,
  org: "fitpass",
  project: "fitpass-web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
