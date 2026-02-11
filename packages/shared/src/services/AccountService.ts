import { supabase } from '../lib/integrations/supabase/supabaseClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface DeleteAccountResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class AccountService {
  static async deleteAccount(userId: string, email: string): Promise<DeleteAccountResult> {
    try {
      const response = await fetch(`${API_URL}/api/user/${userId}/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete account',
        };
      }

      await supabase.auth.signOut();

      return {
        success: true,
        message: data.message || 'Account successfully deleted',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async exportUserData(userId: string): Promise<DeleteAccountResult> {
    try {
      const response = await fetch(`${API_URL}/api/gdpr/export/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to export data',
        };
      }

      return {
        success: true,
        message: 'Data export requested. You will receive an email with your data.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
