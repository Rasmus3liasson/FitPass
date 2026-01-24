# Business Configuration

## Setup

```bash
# Copy template and edit values
cp businessConfig.example.ts businessConfig.ts
```

## Configuration

Edit `businessConfig.ts` to change:

- **Gym payout amounts** (`MODELL_C_PAYOUTS`, `CREDIT_VISIT_PAYOUT`)
- **Platform fees** (`PLATFORM_FEE_PERCENTAGE`)
- **Cron schedules** (`PAYOUT_*_SCHEDULE`)
- **Subscription pricing** (`SUBSCRIPTION_PRICES`)

## Usage

```typescript
import { MODELL_C_PAYOUTS } from './config/businessConfig';
```

After changing values, restart backend:

```bash
pnpm dev:backend
```

## Cron Jobs

To deploy cron jobs after changing schedules:

```bash
pnpm cron:deploy
# Then run the generated SQL in Supabase SQL Editor
```
