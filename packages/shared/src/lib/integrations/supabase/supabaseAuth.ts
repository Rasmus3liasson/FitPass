import { ensureUserProfile } from "./authHelpers";
import { supabase } from "./supabaseClient";


export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  language?: string;
}

export async function signUp(formData: RegisterFormData) {
  const { email, password, firstName, lastName } = formData;

  // Create account with password - this triggers your custom email template with {{ .ConfirmationCode }}
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    throw error;
  }

  // Check if user already exists
  if (!data?.user?.identities?.length) {
    throw new Error("En användare med denna e-post finns redan");
  }

  // Don't create profile yet - wait for verification
  return data;
}

// This function is no longer needed - we create account directly in signUp
export async function createAccountAfterVerification(
  email: string,
  password: string,
  userData: {
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
  }
) {
  // Account already created in signUp, just ensure profile exists
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    await ensureUserProfile(user.id, { email });
  }
  
  return { user };
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup', // Use 'signup' type to match the confirmation code
  });

  if (error) {
    throw error;
  }

  // Create profile after successful verification
  if (data.user) {
    await ensureUserProfile(data.user.id, { email });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  // Password-based sign-in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Check if email is verified
  if (data.user && !data.user.email_confirmed_at) {
    throw new Error('Email not verified. Please verify your email first.');
  }

  if (data.user) {
    await ensureUserProfile(data.user.id, { email });
  }

  return data;
}

export async function resendOtp(email: string) {
  // Resend signup confirmation code
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw error;
  }

  return data;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function isEmailConfirmed(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.email_confirmed_at;
}

export interface UserPreferences {
  language: string;
}

export async function updateUserPreferences() {
  return true;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  // Return default preferences
  return { language: "sv" };
}
