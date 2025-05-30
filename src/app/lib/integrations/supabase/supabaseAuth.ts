import { ensureUserProfile } from "./authHelpers";
import { supabase } from "./browser";

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
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

  // Add user to the profiles table
  const userId = data.user?.id;
  if (userId) {
    await ensureUserProfile(userId, {
      email,
    });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    // Ensure the user has a profile
    await ensureUserProfile(data.user.id, { email });
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
