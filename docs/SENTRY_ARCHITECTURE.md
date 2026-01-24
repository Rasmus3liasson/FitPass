# Sentry Configuration Architecture

## Structure

```
packages/shared/src/config/sentry.ts  ← Shared config values
├── apps/mobile/config/sentry.ts      ← Mobile initialization
└── apps/web/config/
    ├── instrumentation.ts             ← Server/Edge runtime init
    └── instrumentation-client.ts      ← Client runtime init
```

## What's Where

### Shared Config (`packages/shared/src/config/sentry.ts`)

- **Contains**: Configuration values (sample rates, debug flags, etc.)
- **Does NOT contain**: Runtime initialization code
- **Used by**: Both mobile and web apps
- **Exports**: `SENTRY_CONFIG` object with all config values

### Mobile Config (`apps/mobile/config/sentry.ts`)

- **Contains**: Expo/React Native specific initialization
- **Imports**: Config values from shared package
- **Initializes**: Sentry with React Native SDK
- **Features**: Native crash reporting, performance tracking, React Navigation instrumentation

### Web Config (`apps/web/config/`)

- **instrumentation.ts**: Server-side and Edge runtime initialization
- **instrumentation-client.ts**: Client-side initialization with session replay
- **Imports**: Config values from shared package
- **Features**: Session replay, server-side error tracking, router instrumentation

## Environment Variables

All env vars are in root `.env` file:

- `SENTRY_DSN_EXPO` - Mobile app DSN
- `SENTRY_DSN_NEXT` - Web app DSN
- `EXPO_PUBLIC_SENTRY_DSN` - Mobile runtime access
- `NEXT_PUBLIC_SENTRY_DSN` - Web client-side access

## Why This Structure?

✅ **Shared config** - One place to update sample rates, debug flags, etc.  
✅ **Runtime-specific init** - Each runtime (Expo, Next server, Next client) initializes Sentry properly  
✅ **Type safety** - TypeScript across all configs  
✅ **Easy maintenance** - Update config values once, applies everywhere  
✅ **Clean separation** - Config values separate from initialization logic
