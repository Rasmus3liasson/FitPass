import { UserProfile } from "@/types";
import { supabase } from "../supabaseClient";

// Profiles functions
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Function to get potential instructors
export async function getPotentialInstructors(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) throw error;
  return data || [];
}

// Function to get all users with profiles for admin purposes
export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) throw error;
  return data || [];
}

// User preferences functions
export async function getUserPreferences(userId: string) {
  // Since our new profiles table doesn't have these fields, we'll return defaults
  return { language: "sv" };
}

export async function updateUserPreferences(userId: string, preferences: any) {
  // Since our new profiles table doesn't have these fields, we'll just return true
  return true;
}
