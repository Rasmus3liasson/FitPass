import { useFeedback } from "../hooks/useFeedback";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { useMutation } from "@tanstack/react-query";

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const usePasswordChange = () => {
  const { showSuccess, showError } = useFeedback();
  
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
        console.error("Password update error:", updateError);
        throw updateError;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      showSuccess("Lösenord Uppdaterat", "Ditt lösenord har ändrats!");
    },
    onError: (error: Error) => {
      showError("Lösenordsändning misslyckades", error.message);
    },
  });
};
