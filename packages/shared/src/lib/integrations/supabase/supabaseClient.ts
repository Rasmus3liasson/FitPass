// src/lib/integrations/supabase/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';
import { secureStorage } from '../../secureStorage';

const { EXPO_PUBLIC_SUPABASE_URL: supabaseUrl, EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } =
  Constants.expoConfig?.extra ?? {};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anon key.');
}

// ✅ SECURITY: Using SecureStore for encrypted token storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Disable realtime to avoid WebSocket/Node.js module issues
  // realtime: {
  //   params: {
  //     eventsPerSecond: 10,
  //   },
  // },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});
