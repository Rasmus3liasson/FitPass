/**
 * Supabase Cron Jobs Management
 *
 * This file contains all cron job definitions for the Supabase database.
 * Edit the schedule, SQL commands, or other parameters as needed, then deploy to Supabase.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. First, enable pg_cron extension in Supabase (run once in SQL Editor):
 *    ```sql
 *    CREATE EXTENSION IF NOT EXISTS pg_cron;
 *    ```
 *
 * 2. To view existing cron jobs in Supabase, run in SQL Editor:
 *    ```sql
 *    SELECT * FROM cron.job;
 *    ```
 *
 * 3. To deploy/update cron jobs from this file:
 *    - Option A: Run from terminal: `pnpm tsx backend/src/services/supabaseCronJobs.ts deploy`
 *    - Option B: Call deployCronJobs() programmatically
 *    - Option C: Copy the SQL from getCronJobSQL() and paste into Supabase SQL Editor
 *
 * 4. To remove all cron jobs:
 *    - Run: `pnpm tsx backend/src/services/supabaseCronJobs.ts remove`
 */

// =============================================================================
// CRON JOB DEFINITIONS
// =============================================================================

export interface CronJobDefinition {
  name: string;
  schedule: string; // Cron syntax: '0 2 * * *' = daily at 2am
  command: string; // SQL command to execute
  description: string;
  enabled: boolean;
}

/**
 * CRON JOB 1: Generate Monthly Payouts
 *
 * What it does: Calculates monthly payouts for all gyms based on:
 *   - Unlimited subscription visits (Model C: 550/450/350 SEK per visit)
 *   - Credit-based visits (90 SEK per visit)
 *   Creates payout records in database for each gym
 *
 * Schedule: Every day 28-31 at 11:00 PM UTC (runs on last day of month)
 *
 * How to push to Supabase:
 * - Run: pnpm cron:deploy
 * - Or in Supabase SQL Editor, run the SQL from getCronJobSQL('generate-monthly-payouts')
 *
 * How to edit payout values:
 * - Edit backend/src/config/businessConfig.ts
 * - Change MODELL_C_PAYOUTS, CREDIT_VISIT_PAYOUT, etc.
 * - Restart backend to apply changes
 */
export const GENERATE_MONTHLY_PAYOUTS: CronJobDefinition = {
  name: "generate-monthly-payouts",
  schedule: "0 23 28-31 * *", // Daily 28-31 at 11 PM UTC
  command: `
    SELECT
      net.http_post(
        url := 'http://localhost:3001/api/payouts/generate-monthly',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      ) AS request_id;
  `,
  description: "Generate monthly payouts for all gyms based on visit data",
  enabled: true,
};

/**
 * CRON JOB 2: Send Payout Transfers
 *
 * What it does: Processes pending payouts and initiates Stripe transfers to gym accounts
 *   - Finds all payouts with status 'pending'
 *   - Creates Stripe transfers to each gym's connected account
 *   - Updates payout status to 'processing' or 'paid'
 *
 * Schedule: Every day 28-31 at 11:30 PM UTC (30 min after generation)
 *
 * How to push to Supabase:
 * - Run: pnpm cron:deploy
 * - Or in Supabase SQL Editor, run the SQL from getCronJobSQL('send-payout-transfers')
 *
 * How to edit payout schedule or minimum amounts:
 * - Edit backend/src/config/businessConfig.ts
 * - Change MINIMUM_PAYOUT_AMOUNT, PAYOUT_TRANSFER_SCHEDULE, etc.
 */
export const SEND_PAYOUT_TRANSFERS: CronJobDefinition = {
  name: "send-payout-transfers",
  schedule: "30 23 28-31 * *", // Daily 28-31 at 11:30 PM UTC
  command: `
    SELECT
      net.http_post(
        url := 'http://localhost:3001/api/payouts/send-transfers',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      ) AS request_id;
  `,
  description: "Send Stripe transfers for pending payouts",
  enabled: true,
};

// Add all cron jobs to this array
export const ALL_CRON_JOBS: CronJobDefinition[] = [
  GENERATE_MONTHLY_PAYOUTS,
  SEND_PAYOUT_TRANSFERS,
];

// =============================================================================
// DEPLOYMENT FUNCTIONS
// =============================================================================

/**
 * Get SQL statement to create/update a cron job in Supabase
 */
export function getCronJobSQL(jobName: string): string {
  const job = ALL_CRON_JOBS.find((j) => j.name === jobName);
  if (!job) {
    throw new Error(`Cron job '${jobName}' not found`);
  }

  return `
-- ${job.description}
-- Schedule: ${job.schedule}

-- Remove existing job if it exists
SELECT cron.unschedule('${job.name}');

-- Create the cron job
${
  job.enabled
    ? `
SELECT cron.schedule(
  '${job.name}',
  '${job.schedule}',
  $$${job.command.trim()}$$
);
`
    : "-- Job is disabled, not scheduling"
}

-- Verify it was created
SELECT * FROM cron.job WHERE jobname = '${job.name}';
  `.trim();
}

/**
 * Get SQL to deploy all cron jobs
 */
export function getAllCronJobsSQL(): string {
  return ALL_CRON_JOBS.map((job) => getCronJobSQL(job.name)).join(
    "\n\n" + "=".repeat(80) + "\n\n",
  );
}

/**
 * Get SQL to remove all cron jobs
 */
export function getRemoveAllCronJobsSQL(): string {
  return `
-- Remove all FitPass cron jobs
${ALL_CRON_JOBS.map((job) => `SELECT cron.unschedule('${job.name}');`).join("\n")}

-- Verify removal
SELECT * FROM cron.job WHERE jobname LIKE '%${ALL_CRON_JOBS[0].name.split("_")[0]}%';
  `.trim();
}

/**
 * Deploy all cron jobs to Supabase using Supabase Management API or RPC
 *
 * NOTE: This requires Supabase service role key and direct SQL execution
 * If this fails, copy the SQL from getAllCronJobsSQL() and run in Supabase SQL Editor
 */
export async function deployCronJobs(): Promise<void> {
  console.log("🚀 Deploying cron jobs to Supabase...\n");

  try {
    // Execute the SQL to create all cron jobs
    const sql = getAllCronJobsSQL();

    console.log("📝 SQL to execute:");
    console.log("=".repeat(80));
    console.log(sql);
    console.log("=".repeat(80));
    console.log(
      "\n⚠️  NOTE: Supabase client cannot execute DDL/pg_cron directly.",
    );
    console.log(
      "Please copy the SQL above and run it in the Supabase SQL Editor:\n",
    );
    console.log(
      "1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql",
    );
    console.log("2. Paste the SQL above");
    console.log('3. Click "Run"\n');

    // Alternative: If you have a direct PostgreSQL connection, you could execute it here
    // For now, we'll just output the SQL for manual execution
  } catch (error) {
    console.error("❌ Error deploying cron jobs:", error);
    throw error;
  }
}

/**
 * Remove all cron jobs from Supabase
 */
export async function removeCronJobs(): Promise<void> {
  console.log("🗑️  Removing cron jobs from Supabase...\n");

  try {
    const sql = getRemoveAllCronJobsSQL();

    console.log("📝 SQL to execute:");
    console.log("=".repeat(80));
    console.log(sql);
    console.log("=".repeat(80));
    console.log(
      "\n⚠️  NOTE: Please run this SQL in the Supabase SQL Editor:\n",
    );
    console.log(
      "1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql",
    );
    console.log("2. Paste the SQL above");
    console.log('3. Click "Run"\n');
  } catch (error) {
    console.error("❌ Error removing cron jobs:", error);
    throw error;
  }
}

/**
 * List all currently active cron jobs in Supabase
 *
 * Run this to see what's currently scheduled in your database
 */
export async function listCronJobs(): Promise<void> {
  console.log("📋 Fetching current cron jobs from Supabase...\n");

  try {
    // Query to list cron jobs
    // Note: This requires a custom RPC function or direct SQL access
    console.log(
      "To view current cron jobs, run this SQL in Supabase SQL Editor:\n",
    );
    console.log("SELECT * FROM cron.job ORDER BY jobid;");
    console.log("\nOr for more details:");
    console.log(`
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;
    `);
  } catch (error) {
    console.error("❌ Error listing cron jobs:", error);
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

/**
 * CLI entry point for managing cron jobs
 *
 * Usage:
 *   pnpm tsx backend/src/services/supabaseCronJobs.ts deploy
 *   pnpm tsx backend/src/services/supabaseCronJobs.ts remove
 *   pnpm tsx backend/src/services/supabaseCronJobs.ts list
 *   pnpm tsx backend/src/services/supabaseCronJobs.ts sql [job-name]
 */
async function cli() {
  const command = process.argv[2];
  const jobName = process.argv[3];

  switch (command) {
    case "deploy":
      await deployCronJobs();
      break;

    case "remove":
      await removeCronJobs();
      break;

    case "list":
      await listCronJobs();
      break;

    case "sql":
      if (jobName) {
        console.log(getCronJobSQL(jobName));
      } else {
        console.log(getAllCronJobsSQL());
      }
      break;

    default:
      console.log(`
Supabase Cron Jobs Management CLI

Usage:
  pnpm tsx backend/src/services/supabaseCronJobs.ts <command> [options]

Commands:
  deploy              Generate SQL to deploy all cron jobs
  remove              Generate SQL to remove all cron jobs
  list                Show SQL to list current cron jobs
  sql [job-name]      Output SQL for specific job (or all jobs if no name provided)

Examples:
  pnpm tsx backend/src/services/supabaseCronJobs.ts deploy
  pnpm tsx backend/src/services/supabaseCronJobs.ts sql cleanup_expired_memberships
  pnpm tsx backend/src/services/supabaseCronJobs.ts list

Current jobs defined:
${ALL_CRON_JOBS.map((job) => `  - ${job.name}: ${job.description}`).join("\n")}
      `);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  cli().catch(console.error);
}
