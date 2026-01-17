/**
 * Retrieve Current Cron Jobs from Supabase
 *
 * This script helps you fetch the existing cron jobs from your Supabase project
 * so you can add them to supabaseCronJobs.ts
 *
 * Usage:
 *   pnpm tsx backend/src/scripts/getCronJobsFromSupabase.ts
 *
 * Or manually run this SQL in Supabase SQL Editor:
 */

const FETCH_CRON_JOBS_SQL = `
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
`;

async function fetchCronJobs() {
  console.log("🔍 Fetching cron jobs from Supabase...\n");
  console.log(
    "⚠️  Since the Supabase JS client cannot directly query pg_cron tables,",
  );
  console.log("   please run the following SQL in your Supabase SQL Editor:\n");
  console.log("=".repeat(80));
  console.log(FETCH_CRON_JOBS_SQL);
  console.log("=".repeat(80));
  console.log(
    "\n📋 Once you have the results, update the cron job definitions in:",
  );
  console.log("   backend/src/services/supabaseCronJobs.ts\n");

  console.log("📖 How to access Supabase SQL Editor:");
  console.log("   1. Go to https://supabase.com/dashboard");
  console.log("   2. Select your project");
  console.log('   3. Click "SQL Editor" in the left sidebar');
  console.log("   4. Paste the SQL query above");
  console.log('   5. Click "Run"');
  console.log(
    "   6. Copy the job details and add them to supabaseCronJobs.ts\n",
  );

  console.log("💡 Example output format:");
  console.log(`
  jobid | jobname                        | schedule    | command
  ------|--------------------------------|-------------|----------------------------------
  1     | cleanup_expired_memberships    | 0 2 * * *   | UPDATE memberships SET...
  2     | refresh_materialized_views     | 0 * * * *   | REFRESH MATERIALIZED VIEW...
  `);

  console.log(
    "\n✅ After copying the details, update the CronJobDefinition objects in:",
  );
  console.log("   backend/src/services/supabaseCronJobs.ts");
}

fetchCronJobs().catch(console.error);
