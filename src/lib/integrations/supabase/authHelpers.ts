import { supabase } from "./browser";

// Function to fix user profile issues
export async function ensureUserProfile(
  userId: string,
  userData?: {
    email?: string;
  },
) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (checkError) throw checkError;

    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { data: user } = await supabase.auth.getUser();

      const profileData = {
        id: userId,
        display_name:
          user.user?.user_metadata?.full_name ||
          user.user?.email?.split("@")[0],
        first_name: user.user?.user_metadata?.first_name,
        last_name: user.user?.user_metadata?.last_name,
        bio: null,
        credits: 0,
        role: "member",
      };

      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (insertError) throw insertError;

      return { success: true, message: "User profile created" };
    }

    return { success: true, message: "User profile already exists" };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return { success: false, error };
  }
}

// Function to get user role from the profiles table
export async function getUserRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data.role || "member";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "member"; // Default to member role if there's an error
  }
}
