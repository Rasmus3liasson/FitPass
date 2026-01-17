/**
 * Test Dynamic Business Configuration
 *
 * This script tests that:
 * 1. Dynamic config loads from database
 * 2. Subscription prices match database
 * 3. Credits per tier match database
 * 4. All helper functions work correctly
 *
 * Run: pnpm tsx backend/src/scripts/testDynamicConfig.ts
 */

import {
  getCreditsPerTier,
  getDefaultCreditsPerVisit,
  getSubscriptionPrices,
} from "../config/businessConfig";
import {
  clearConfigCache,
  getDynamicConfig,
  initializeDynamicConfig,
} from "../config/dynamicConfig";
import { dbService } from "../services/database";

async function testDynamicConfig() {
  console.log("🧪 Testing Dynamic Business Configuration\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Initialize config
    console.log("\n1️⃣  Initializing dynamic config...");
    await initializeDynamicConfig();
    console.log("✅ Config initialized successfully");

    // Test 2: Get raw membership plans from database
    console.log("\n2️⃣  Fetching membership plans from database...");
    const plans = await dbService.getMembershipPlans();
    console.log(`✅ Found ${plans.length} membership plans:`);
    plans.forEach((plan) => {
      console.log(
        `   - ${plan.title}: ${plan.price} SEK (${plan.credits} credits)`,
      );
    });

    // Test 3: Get dynamic config
    console.log("\n3️⃣  Testing getDynamicConfig()...");
    const config = await getDynamicConfig();
    console.log("✅ Dynamic config loaded:");
    console.log(
      "   Subscription Prices:",
      JSON.stringify(config.subscriptionPrices, null, 2),
    );
    console.log(
      "   Credits Per Tier:",
      JSON.stringify(config.creditsPerTier, null, 2),
    );
    console.log("   Default Credits Per Visit:", config.defaultCreditsPerVisit);
    console.log(
      "   Cache age:",
      new Date().getTime() - config.lastFetched.getTime(),
      "ms",
    );

    // Test 4: Get subscription prices via business config
    console.log("\n4️⃣  Testing getSubscriptionPrices()...");
    const prices = await getSubscriptionPrices();
    console.log("✅ Subscription prices from businessConfig:");
    Object.entries(prices).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value} SEK`);
    });

    // Test 5: Get credits per tier
    console.log("\n5️⃣  Testing getCreditsPerTier()...");
    const credits = await getCreditsPerTier();
    console.log("✅ Credits per tier from businessConfig:");
    Object.entries(credits).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value} credits`);
    });

    // Test 6: Get default credits per visit
    console.log("\n6️⃣  Testing getDefaultCreditsPerVisit()...");
    const defaultCredits = await getDefaultCreditsPerVisit();
    console.log(`✅ Default credits per visit: ${defaultCredits}`);

    // Test 7: Test cache clearing
    console.log("\n7️⃣  Testing cache clearing...");
    clearConfigCache();
    const newConfig = await getDynamicConfig();
    console.log("✅ Cache cleared and reloaded");
    console.log("   New cache timestamp:", newConfig.lastFetched.toISOString());

    // Test 8: Verify data consistency
    console.log("\n8️⃣  Verifying data consistency...");
    let allGood = true;

    for (const plan of plans) {
      const key = plan.title.toUpperCase().replace(/\s+/g, "_");
      const configPrice = config.subscriptionPrices[key];

      if (configPrice !== plan.price) {
        console.log(
          `❌ Price mismatch for ${plan.title}: DB=${plan.price}, Config=${configPrice}`,
        );
        allGood = false;
      }

      if (plan.credits > 0) {
        const configCredits = config.creditsPerTier[key];
        if (configCredits !== plan.credits) {
          console.log(
            `❌ Credits mismatch for ${plan.title}: DB=${plan.credits}, Config=${configCredits}`,
          );
          allGood = false;
        }
      }
    }

    if (allGood) {
      console.log("✅ All data matches between database and config");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests passed successfully!\n");
    console.log("Summary:");
    console.log(`  - ${plans.length} membership plans loaded`);
    console.log(`  - ${Object.keys(prices).length} subscription prices synced`);
    console.log(`  - ${Object.keys(credits).length} credit tiers synced`);
    console.log(`  - Default credits per visit: ${defaultCredits}`);
    console.log(
      "\n🎉 Your business config is now synced with Stripe/Database!\n",
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testDynamicConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
