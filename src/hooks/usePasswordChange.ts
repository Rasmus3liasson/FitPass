import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const usePasswordChange = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword, confirmPassword }: PasswordChangeData) => {
      
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      // First, verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("No authenticated user found");
      }
      
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        console.error("❌ Password update error:", updateError);
        throw updateError;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "🔐 Password Updated",
        text2: "Your password has been changed successfully!",
        position: "top",
        visibilityTime: 3000,
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "❌ Password Change Failed",
        text2: error.message,
        position: "top",
        visibilityTime: 4000,
      });
    },
  });
};
