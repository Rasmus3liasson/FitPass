/**
 * Script to list and clean up Stripe subscription schedules
 *
 * Usage:
 *   npm run cleanup-schedules -- --list    # List all schedules
 *   npm run cleanup-schedules -- --cancel  # Cancel all active schedules
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function listSchedules() {
  console.log('📋 Fetching all subscription schedules...\n');

  const schedules = await stripe.subscriptionSchedules.list({
    limit: 100,
  });

  if (schedules.data.length === 0) {
    console.log('✅ No subscription schedules found');
    return [];
  }

  console.log(`Found ${schedules.data.length} schedules:\n`);

  schedules.data.forEach((schedule, index) => {
    const subscription = schedule.subscription as string;
    const status = schedule.status;
    const phases = schedule.phases;

    console.log(`${index + 1}. Schedule ID: ${schedule.id}`);
    console.log(`   Status: ${status}`);
    console.log(`   Subscription: ${subscription}`);
    console.log(`   Phases: ${phases.length}`);

    phases.forEach((phase, phaseIndex) => {
      const startDate = new Date(phase.start_date * 1000).toISOString();
      const endDate = phase.end_date ? new Date(phase.end_date * 1000).toISOString() : 'ongoing';
      const priceId = phase.items[0]?.price;

      console.log(`     Phase ${phaseIndex + 1}: ${startDate} → ${endDate}`);
      console.log(`     Price: ${priceId}`);
    });

    console.log('');
  });

  return schedules.data;
}

async function cancelSchedules() {
  const schedules = await listSchedules();

  if (schedules.length === 0) {
    return;
  }

  console.log('\n🗑️  Canceling all active schedules...\n');

  let canceledCount = 0;
  let errorCount = 0;

  for (const schedule of schedules) {
    if (schedule.status === 'canceled' || schedule.status === 'completed') {
      console.log(`⏭️  Skipping ${schedule.id} (already ${schedule.status})`);
      continue;
    }

    try {
      await stripe.subscriptionSchedules.cancel(schedule.id);
      console.log(`✅ Canceled: ${schedule.id}`);
      canceledCount++;
    } catch (error: any) {
      console.error(`❌ Failed to cancel ${schedule.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Canceled: ${canceledCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Skipped: ${schedules.length - canceledCount - errorCount}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  npm run cleanup-schedules -- --list    # List all schedules');
    console.log('  npm run cleanup-schedules -- --cancel  # Cancel all active schedules');
    return;
  }

  try {
    if (command === '--list') {
      await listSchedules();
    } else if (command === '--cancel') {
      await cancelSchedules();
    } else {
      console.error('Unknown command:', command);
      console.log('\nValid commands: --list, --cancel');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
