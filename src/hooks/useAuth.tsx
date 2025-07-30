import { Provider, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

import Toast from "react-native-toast-message";

import { ensureUserProfile } from "@/src/lib/integrations/supabase/authHelpers";

import { getUserProfile } from "@/src/lib/integrations/supabase/queries";
import { UserPreferences, UserProfile } from "@/types";
import { useRouter } from "expo-router";
import { supabase } from "../lib/integrations/supabase/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<void>;
  handleUserVerification: (userId: string, email: string) => Promise<void>;
  loginWithSocial: (provider: Provider) => Promise<void>;
  loginClub: (
    email: string,
    password: string,
    orgNumber?: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  updateUserPreferences: (
    userId: string,
    preferences: Partial<UserPreferences>
  ) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupAuth = async () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              const profile = await getUserProfile(session.user.id);
              setUserProfile(profile);
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          // Navigate to login after sign out
          // To prevent navigating before mounting
          setTimeout(() => {
            router.replace("/login");
          }, 100);
        }
        setLoading(false);
      });

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        try {
          const profile = await getUserProfile(data.session.user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      setLoading(false);

      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, []);

  const redirectToRoleHome = (role: string) => {
    if (role === "club") {
      router.push("/(club)/" as any);
    } else {
      router.push("/(user)/" as any);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await ensureUserProfile(data.user.id, { email });
        const profile = await getUserProfile(data.user.id);

        setUserProfile(profile);
        Toast.show({
          type: "success",
          text1: "🎉 Welcome Back!",
          text2: `Logged in successfully. Let's get moving!`,
          position: "top",
          visibilityTime: 4000,
        });
        redirectToRoleHome(profile.role || "user");
      }
    } catch (error: any) {
      const errorMessage =
        error.message === "Invalid login credentials"
          ? "Incorrect email or password"
          : error.message || "Something went wrong during login";

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "🔐 Login Failed",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    try {
      setError(null);
      const { error: signUpError, data: signUpData } =
        await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              full_name: `${data.firstName} ${data.lastName}`,
              phone: data.phone,
              default_location: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!signUpData?.user?.identities?.length) {
        throw new Error("En användare med denna e-post finns redan");
      }

      Toast.show({
        type: "success",
        text1: "🎊 Account Created!",
        text2: "Check your email for verification link to get started.",
        position: "top",
        visibilityTime: 5000,
      });

      // Redirect to verification screen
      router.push({
        pathname: "/verify-code",
        params: { email: data.email },
      });
    } catch (error: any) {
      let errorMessage = "Something went wrong during registration";

      if (error.message === "User already registered") {
        errorMessage = "An account with this email already exists";
      } else if (error.message === "Database error saving new user") {
        errorMessage = "Could not create user account. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "❌ Registration Failed",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const handleUserVerification = async (userId: string, email: string) => {
    try {
      await ensureUserProfile(userId, { email });
      // Optionally, you can fetch the profile here and update the state
      // if the user should be considered "logged in" right after verification.
    } catch (error) {
      console.error("Error creating user profile after verification:", error);
      // Handle error appropriately, maybe show a toast
    }
  };

  const loginWithSocial = async (provider: Provider) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      const errorMessage =
        error.message === "provider is not enabled"
          ? `${provider} login is currently unavailable. Please try another method.`
          : error.message || `Something went wrong with ${provider} login`;

      setError(errorMessage);
      Toast.show({
        type: "warning",
        text1: "⚠️ Social Login Issue",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const loginClub = async (
    email: string,
    password: string,
    orgNumber?: string
  ) => {
    try {
      setError(null);
      const { error: signInError, data } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;

      if (data.user) {
        // Verify club role
        const profile = await getUserProfile(data.user.id);
        if (profile.role !== "club") {
          throw new Error("Detta konto är inte ett klubbkonto");
        }

        // Only verify org number if provided
        if (orgNumber && orgNumber.trim()) {
          // Verify org number matches club's org number
          const { data: clubData, error: clubError } = await supabase
            .from("clubs")
            .select("org_number")
            .eq("user_id", data.user.id)
            .single();

          if (clubError) throw clubError;
          if (clubData.org_number !== orgNumber) {
            throw new Error("Organisationsnumret matchar inte klubbens");
          }
        }

        setUserProfile(profile);
        Toast.show({
          type: "success",
          text1: "Inloggad",
          text2: "Du är nu inloggad som klubb",
          position: "bottom",
        });
        redirectToRoleHome(profile.role || "club");
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Något gick fel vid klubbinloggning";
      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Klubbinloggning misslyckades",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://your-app.com/reset-password", // You'll need to set this to your app's reset URL
      });

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Reset link sent",
        text2: "Check your email for password reset instructions",
        position: "bottom",
      });
    } catch (error: any) {
      const errorMessage =
        error.message || "Something went wrong sending reset email";
      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Reset failed",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Don't navigate here - let the auth state change handle it
      Toast.show({
        type: "success",
        text1: "Utloggad",
        text2: "Du är nu utloggad från FlexClub",
        position: "bottom",
      });
    } catch (error: any) {
      setError(error.message || "Något gick fel vid utloggningen");
      Toast.show({
        type: "error",
        text1: "Utloggning misslyckades",
        text2: error.message || "Något gick fel vid utloggningen",
        position: "bottom",
      });
    }
  };

  const updateUserPreferences = async (
    userId: string,
    preferences: Partial<UserPreferences>
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(preferences)
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isLoading: loading,
        login,
        register,
        handleUserVerification,
        loginWithSocial,
        loginClub,
        resetPassword,
        signOut,
        error,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
