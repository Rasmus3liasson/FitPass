import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/integrations/supabase/supabaseClient';

export class GoogleAuthService {
  private static instance: GoogleAuthService;

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async signInWithGoogle(): Promise<{ error?: string; success?: boolean }> {
    try {
      // Generate secure random state
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Get redirect URI using Linking instead of makeRedirectUri
      const redirectUri = Linking.createURL('auth/callback');

      // Start OAuth sign-in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state,
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        return { error: error.message };
      }

      if (!data?.url) {
        return { error: 'No auth URL returned from Supabase.' };
      }

      // Use Linking to open URL instead of AuthSession.startAsync
      const supported = await Linking.canOpenURL(data.url);

      if (!supported) {
        return { error: 'Cannot open authentication URL' };
      }

      await Linking.openURL(data.url);

      // Return success immediately since we're using deep linking
      // The actual authentication result will be handled by the auth callback
      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      return { error: err.message || 'An unexpected error occurred' };
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
