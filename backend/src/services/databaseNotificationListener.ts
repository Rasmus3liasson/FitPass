export async function setupDatabaseNotificationListener() {
  // Database notification listener disabled due to Supabase IPv6 compatibility issues
  // Messaging works perfectly via React Query polling (5s) + Supabase Realtime
  return null;
}
