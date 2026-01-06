import { Provider, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

import * as Linking from "expo-linking";

import { ensureUserProfile } from "../lib/integrations/supabase/authHelpers";
import { useGlobalFeedback } from "./useGlobalFeedback";

import { useRouter } from "expo-router";
import { getUserProfile } from "../lib/integrations/supabase/queries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { googleAuthService } from "../services/googleAuthService";
import { UserPreferences, UserProfile } from "../types";
import { SecureErrorHandler } from "../utils/errorHandler";
import { InputValidator } from "../utils/inputValidation";
import { RateLimiter } from "../utils/rateLimiter";

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
            // Extract URL parameters using Linking.parse (React Native compatible)
            const parsed = Linking.parse(url);
            const accessToken = parsed.queryParams?.access_token as string | undefined;
            const refreshToken = parsed.queryParams?.refresh_token as string | undefined;
            
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

      // Validate inputs
      const emailValidation = InputValidator.validateEmail(email);
      if (!emailValidation.valid) {
        showError("Ogiltig e-postadress", emailValidation.error || "");
        return;
      }

      const passwordValidation = InputValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        showError("Ogiltigt lösenord", passwordValidation.error || "");
        return;
      }

      // Check rate limit
      const rateLimit = RateLimiter.checkLimit(emailValidation.sanitized!, 'login');
      if (!rateLimit.allowed) {
        showError("För många försök", rateLimit.message || "");
        return;
      }

      // Show remaining attempts warning if low
      if (rateLimit.remainingAttempts !== undefined && rateLimit.remainingAttempts <= 2) {
        showInfo(
          "⚠️ Varning",
          `${rateLimit.remainingAttempts} försök kvar innan kontot låses`
        );
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized!,
        password: password,
      });

      if (error) throw error;

      // Success - reset rate limit
      RateLimiter.reset(emailValidation.sanitized!, 'login');

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          // Email not verified, redirect to verification screen
          await supabase.auth.signOut(); // Sign out the unverified user
          showError("Email inte verifierad", "Vänligen verifiera din e-post först");
          setTimeout(() => {
            router.push(`/verify-code?email=${encodeURIComponent(emailValidation.sanitized!)}&type=signin` as any);
          }, 100);
          return;
        }

        await ensureUserProfile(data.user.id, { email: emailValidation.sanitized! });
        const profile = await getUserProfile(data.user.id);

        setUserProfile(profile);
        showSuccess("Välkommen", "Inloggning lyckades. Nu kör vi!");
        
        if (profile) {
          redirectToRoleHome(profile.role || "user");
        } else {
          redirectToRoleHome("user");
        }
      }
    } catch (error: any) {
      SecureErrorHandler.logError(error, 'login');
      const errorMessage = SecureErrorHandler.sanitize(error);
      setError(errorMessage);
      showError("🔐 Inloggning misslyckades", errorMessage);
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

      // Validate email
      const emailValidation = InputValidator.validateEmail(data.email);
      if (!emailValidation.valid) {
        showError("Ogiltig e-postadress", emailValidation.error || "");
        return;
      }

      // Validate password
      const passwordValidation = InputValidator.validatePassword(data.password);
      if (!passwordValidation.valid) {
        showError("Ogiltigt lösenord", passwordValidation.error || "");
        return;
      }

      // Validate names
      const firstNameValidation = InputValidator.validateName(data.firstName);
      if (!firstNameValidation.valid) {
        showError("Ogiltigt förnamn", firstNameValidation.error || "");
        return;
      }

      const lastNameValidation = InputValidator.validateName(data.lastName);
      if (!lastNameValidation.valid) {
        showError("Ogiltigt efternamn", lastNameValidation.error || "");
        return;
      }

      // Validate phone if provided
      if (data.phone) {
        const phoneValidation = InputValidator.validatePhone(data.phone);
        if (!phoneValidation.valid) {
          showError("Ogiltigt telefonnummer", phoneValidation.error || "");
          return;
        }
      }

      // Validate address if provided
      if (data.address) {
        const addressValidation = InputValidator.validateAddress(data.address);
        if (!addressValidation.valid) {
          showError("Ogiltig adress", addressValidation.error || "");
          return;
        }
      }

      // Check rate limit
      const rateLimit = RateLimiter.checkLimit(emailValidation.sanitized!, 'register');
      if (!rateLimit.allowed) {
        showError("För många försök", rateLimit.message || "");
        return;
      }
      
      // Create account with password - this sends the confirmation email with {{ .ConfirmationCode }}
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: emailValidation.sanitized!,
        password: data.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            first_name: firstNameValidation.sanitized!,
            last_name: lastNameValidation.sanitized!,
            full_name: `${firstNameValidation.sanitized} ${lastNameValidation.sanitized}`,
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

      // Success - reset rate limit
      RateLimiter.reset(emailValidation.sanitized!, 'register');

      showSuccess("Verifieringskod skickad!", "Kolla din e-post för verifieringskod.");

      // Redirect to verification screen
      setTimeout(() => {
        router.push(`/verify-code?email=${encodeURIComponent(emailValidation.sanitized!)}&type=signup` as any);
      }, 100);
    } catch (error: any) {
      SecureErrorHandler.logError(error, 'register');
      const errorMessage = SecureErrorHandler.sanitize(error);
      setError(errorMessage);
      showError("Registrering misslyckades", errorMessage);
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
          showInfo("🔗 Autentisering påbörjad", "Slutför Google-inloggningen i din webbläsare och återvänd sedan till appen");
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
          
          showInfo("🔗 Autentisering påbörjad", `Slutför ${provider}-inloggningen i din webbläsare och återvänd sedan till appen`);
        } else {
          throw new Error("Unable to open authentication URL");
        }
      } else {
        throw new Error("No authentication URL received");
      }
    } catch (error: any) {
      console.error(`${provider} sign-in error:`, error);
      
      let errorMessage = `Något gick fel vid ${provider}-inloggning`;
      
      if (error.message === "provider is not enabled") {
        errorMessage = `${provider} är inte aktiverad. Kontakta support.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      showError("Inloggningsproblem", errorMessage);
    }
  };

  const loginClub = async (
    email: string,
    password: string,
    orgNumber?: string
  ) => {
    try {
      setError(null);

      // Validate inputs
      const emailValidation = InputValidator.validateEmail(email);
      if (!emailValidation.valid) {
        showError("Ogiltig e-postadress", emailValidation.error || "");
        return;
      }

      const passwordValidation = InputValidator.validatePassword(password);
      if (!passwordValidation.valid) {
        showError("Ogiltigt lösenord", passwordValidation.error || "");
        return;
      }

      // Validate org number if provided
      if (orgNumber && orgNumber.trim()) {
        const orgNumberValidation = InputValidator.validateOrgNumber(orgNumber);
        if (!orgNumberValidation.valid) {
          showError("Ogiltigt organisationsnummer", orgNumberValidation.error || "");
          return;
        }
      }

      // Check rate limit
      const rateLimit = RateLimiter.checkLimit(emailValidation.sanitized!, 'login-club');
      if (!rateLimit.allowed) {
        showError("För många försök", rateLimit.message || "");
        return;
      }

      const { error: signInError, data } =
        await supabase.auth.signInWithPassword({
          email: emailValidation.sanitized!,
          password: password,
        });

      if (signInError) throw signInError;

      if (data.user) {
        // Verify club role
        const profile = await getUserProfile(data.user.id);
        if (!profile || profile.role !== "club") {
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

        // Success - reset rate limit
        RateLimiter.reset(emailValidation.sanitized!, 'login-club');

        setUserProfile(profile);
        showSuccess("Inloggad", "Du är nu inloggad som klubb");
        redirectToRoleHome(profile?.role || "club");
      }
    } catch (error: any) {
      SecureErrorHandler.logError(error, 'login-club');
      const errorMessage = SecureErrorHandler.sanitize(error);
      setError(errorMessage);
      showError("Klubbinloggning misslyckades", errorMessage);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);

      // Validate email
      const emailValidation = InputValidator.validateEmail(email);
      if (!emailValidation.valid) {
        showError("Ogiltig e-postadress", emailValidation.error || "");
        return;
      }

      // Check rate limit
      const rateLimit = RateLimiter.checkLimit(emailValidation.sanitized!, 'reset-password');
      if (!rateLimit.allowed) {
        showError("För många försök", rateLimit.message || "");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.sanitized!, {
        redirectTo: "/reset-password", 
      });

      if (error) throw error;

      // Success - reset rate limit
      RateLimiter.reset(emailValidation.sanitized!, 'reset-password');

      showSuccess("Återställningslänk skickad", "Kolla din e-post för instruktioner om hur du återställer ditt lösenord");
    } catch (error: any) {
      SecureErrorHandler.logError(error, 'reset-password');
      const errorMessage = SecureErrorHandler.sanitize(error);
      setError(errorMessage);
      showError("Återställning misslyckades", errorMessage);
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
