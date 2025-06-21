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
    location?: string;
  }) => Promise<void>;
  handleUserVerification: (userId: string, email: string) => Promise<void>;
  loginWithSocial: (provider: Provider) => Promise<void>;
  loginClub: (
    email: string,
    password: string,
    orgNumber?: string
  ) => Promise<void>;
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
      }

      Toast.show({
        type: "success",
        text1: "Inloggad",
        text2: "Du är nu inloggad på FlexClub",
        position: "bottom",
      });

      router.push("/(tabs)/");
    } catch (error: any) {
      const errorMessage =
        error.message === "Invalid login credentials"
          ? "Felaktigt användarnamn eller lösenord"
          : error.message || "Något gick fel vid inloggningen";

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Inloggning misslyckades",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
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
              location: data.location,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!signUpData?.user?.identities?.length) {
        throw new Error("En användare med denna e-post finns redan");
      }

      Toast.show({
        type: "success",
        text1: "Konto skapat",
        text2:
          "Ditt konto har skapats. Kontrollera din e-post för en bekräftelselänk.",
        position: "bottom",
      });

      // Redirect to verification screen
      router.push({
        pathname: "/verify-code",
        params: { email: data.email }
      });
    } catch (error: any) {
      let errorMessage = "Något gick fel vid skapandet av konto";

      if (error.message === "User already registered") {
        errorMessage = "En användare med denna e-post finns redan";
      } else if (error.message === "Database error saving new user") {
        errorMessage =
          "Det gick inte att skapa användaren. Var god försök igen.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Registrering misslyckades",
        text2: errorMessage,
        position: "bottom",
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
          ? `${provider} inloggning är inte aktiverad. Kontakta administratören.`
          : error.message || `Något gick fel vid inloggning med ${provider}`;

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Inloggning misslyckades",
        text2: errorMessage,
        position: "bottom",
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
        // Verify club role and org number if provided
        const profile = await getUserProfile(data.user.id);
        if (profile.role !== "club") {
          throw new Error("Detta konto är inte ett klubbkonto");
        }

        if (orgNumber) {
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

        router.push("/(tabs)/");
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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push("/login/");
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
