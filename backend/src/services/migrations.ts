import { supabase } from './database';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Migration 1: Add stripe_customer_id to profiles table
    console.log('Checking stripe_customer_id column in profiles table...');
    
    // Try to add the column by attempting an update with the column
    // This is a workaround since we can't run DDL directly
    try {
      // Test if the column exists by trying to select it
      const { error: testError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .limit(1);

      if (testError && testError.code === '42703') {
        console.log('⚠️  stripe_customer_id column does not exist in profiles table');
        console.log('📝 You need to manually add this column in Supabase SQL Editor:');
        console.log('   ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(255);');
        console.log('   CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);');
        return { success: false, error: 'Manual migration needed' };
      } else {
        console.log('✅ stripe_customer_id column exists in profiles table');
      }
    } catch (error) {
      console.log('❌ Error checking column existence:', error);
      return { success: false, error };
    }

    console.log('✅ Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}
