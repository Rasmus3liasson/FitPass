import { Provider, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

import * as Linking from "expo-linking";

import { ensureUserProfile } from "@/src/lib/integrations/supabase/authHelpers";
import { useGlobalFeedback } from "./useGlobalFeedback";

import { getUserProfile } from "@/src/lib/integrations/supabase/queries";
import { UserPreferences, UserProfile } from "@/types";
import { useRouter } from "expo-router";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { googleAuthService } from "../services/googleAuthService";

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
  const { showSuccess, showError, showInfo } = useGlobalFeedback();

  useEffect(() => {
    const setupAuth = async () => {
      // Handle deep linking for OAuth callbacks
      const handleURL = async (url: string) => {
        if (url.includes('auth/callback')) {
          try {
            // Extract URL parameters
            const urlParams = new URL(url);
            const accessToken = urlParams.searchParams.get('access_token');
            const refreshToken = urlParams.searchParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Set the session with the tokens from the URL
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error setting session from URL:', error);
              } else {
                // The auth state change listener will handle navigation
              }
            }
          } catch (error) {
            console.error('Error processing OAuth callback URL:', error);
          }
        }
      };

      // Listen for URL changes (for OAuth callbacks)
      const linkingSubscription = Linking.addEventListener('url', (event) => {
        handleURL(event.url);
      });

      // Check for initial URL (app opened via deep link)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleURL(initialUrl);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Check if email is verified before proceeding
            if (!session.user.email_confirmed_at) {
              // User is signed in but email not verified - don't redirect
              return;
            }

            try {
              const profile = await getUserProfile(session.user.id);
              setUserProfile(profile);
              
              // Only redirect if we have a complete profile
              if (profile) {
                redirectToRoleHome(profile.role || "user");
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          // Don't navigate here - let the index.tsx handle the redirect
        }
        setLoading(false);
      });

      const { data, error } = await supabase.auth.getSession();

      // Handle error from getSession (e.g., invalid refresh token)
      if (error && error.message?.includes('refresh_token')) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

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

      return () => {
        subscription.unsubscribe();
        linkingSubscription?.remove();
      };
    };

    setupAuth();
  }, []);

  const redirectToRoleHome = (role: string) => {
    // Add timeout to ensure navigation stack is ready
    setTimeout(() => {
      if (role === "club") {
        router.replace("/(club)/" as any);
      } else {
        router.replace("/(user)/" as any);
      }
    }, 150);
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
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          // Email not verified, redirect to verification screen
          setTimeout(() => {
            router.push(`/verify-code?email=${encodeURIComponent(email)}` as any);
          }, 100);
          return;
        }

        await ensureUserProfile(data.user.id, { email });
        const profile = await getUserProfile(data.user.id);

        setUserProfile(profile);
        showSuccess("🎉 Welcome Back!", "Logged in successfully. Let's get moving!");
        redirectToRoleHome(profile.role || "user");
      }
    } catch (error: any) {
      const errorMessage =
        error.message === "Invalid login credentials"
          ? "Incorrect email or password"
          : error.message || "Something went wrong during login";

      setError(errorMessage);
      showError("🔐 Login Failed", errorMessage);
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
            emailRedirectTo: undefined, // Disable email redirect
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

      showSuccess("🎊 Account Created!", "Check your email for verification link to get started.");

      // Redirect to verification screen  
      setTimeout(() => {
        router.push(`/verify-code?email=${encodeURIComponent(data.email)}` as any);
      }, 100);
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
      showError("❌ Registration Failed", errorMessage);
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
      
      if (provider === "google") {
        // Use the dedicated Google Auth Service
        const result = await googleAuthService.signInWithGoogle();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.success) {
          showInfo("🔗 Authentication Started", "Complete Google sign-in in your browser, then return to the app");
        }
        
        return;
      }
      
      // Fallback for other providers (Apple, etc.)
      const redirectUrl = Linking.createURL('auth/callback');
      
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error(`${provider} OAuth error:`, error);
        throw error;
      }

      if (data?.url) {
        
        const supported = await Linking.canOpenURL(data.url);
        
        if (supported) {
          await Linking.openURL(data.url);
          
          showInfo("🔗 Authentication Started", `Complete ${provider} sign-in in your browser, then return to the app`);
        } else {
          throw new Error("Unable to open authentication URL");
        }
      } else {
        throw new Error("No authentication URL received");
      }
    } catch (error: any) {
      console.error(`${provider} sign-in error:`, error);
      
      let errorMessage = `Something went wrong with ${provider} login`;
      
      if (error.message === "provider is not enabled") {
        errorMessage = `${provider} login is not configured. Please contact support.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      showError("⚠️ Social Login Issue", errorMessage);
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
        showSuccess("Inloggad", "Du är nu inloggad som klubb");
        redirectToRoleHome(profile.role || "club");
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Något gick fel vid klubbinloggning";
      setError(errorMessage);
      showError("Klubbinloggning misslyckades", errorMessage);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://your-app.com/reset-password", // You'll need to set this to your app's reset URL
      });

      if (error) throw error;

      showSuccess("Reset link sent", "Check your email for password reset instructions");
    } catch (error: any) {
      const errorMessage =
        error.message || "Something went wrong sending reset email";
      setError(errorMessage);
      showError("Reset failed", errorMessage);
    }
  };

  const signOut = async () => {
    try {
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        // No active session, just clear local state
        setSession(null);
        setUser(null);
        setUserProfile(null);
      }

      // Don't navigate here - let the auth state change handle it
      showSuccess("Utloggad", "Du är nu utloggad från FlexClub");
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      // Even if sign out fails, clear local state
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      setError(error.message || "Något gick fel vid utloggningen");
      showError("Utloggning misslyckades", error.message || "Något gick fel vid utloggningen");
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
