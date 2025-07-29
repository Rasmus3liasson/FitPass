import dotenv from 'dotenv';
import { stripeService } from '../services/stripe';

// Load environment variables from root directory
dotenv.config({ path: '../.env' });

async function syncStripeProducts() {
  console.log('🔄 Starting Stripe product synchronization...');
  
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are not set');
    }

    console.log('✅ Environment variables validated');
    console.log('🔗 Connecting to Stripe and Supabase...');

    // Sync products
    await stripeService.syncProductsWithDatabase();
    
    console.log('🎉 Product synchronization completed successfully!');
    
    // Optional: List all synced products
    console.log('\n📋 Current membership plans in database:');
    const { dbService } = await import('../services/database');
    const plans = await dbService.getMembershipPlans();
    
    plans.forEach(plan => {
      console.log(`  • ${plan.title} - $${plan.price}/month`);
      console.log(`    Stripe Product: ${plan.stripe_product_id || 'Not synced'}`);
      console.log(`    Stripe Price: ${plan.stripe_price_id || 'Not synced'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncStripeProducts();
}

export { syncStripeProducts };
