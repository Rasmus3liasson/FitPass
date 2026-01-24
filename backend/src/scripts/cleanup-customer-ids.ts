import { supabase } from '../services/database';

async function cleanupStaleCustomerIds() {
  try {
    console.log('🧹 Cleaning up stale customer IDs...');

    // Update all profiles to remove the stale customer ID
    const { data, error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: null })
      .eq('stripe_customer_id', 'cus_SllLZy6IAFMJY0')
      .select();

    if (error) {
      console.error('❌ Error cleaning up customer IDs:', error);
      return;
    }

    console.log('✅ Successfully cleaned up customer IDs for profiles:', data);

    // Also check if there are any other stale customer IDs
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .not('stripe_customer_id', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }

    console.log('📊 Remaining profiles with customer IDs:', allProfiles);

    process.exit(0);
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

cleanupStaleCustomerIds();
