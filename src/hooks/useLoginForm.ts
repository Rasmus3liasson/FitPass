import { useAuth } from "@/src/hooks/useAuth";
import { AddressInfo } from "@/src/services/googlePlacesService";
import { validatePassword as validatePasswordStrength } from "@/src/utils/passwordValidation";
import { useCallback, useState } from "react";

type AuthType = "sign-in" | "register" | "club" | "forgot-password";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface ClubFormData {
  email: string;
  password: string;
  orgNumber: string;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

export const useLoginForm = () => {
  const {
    login,
    register,
    loginClub,
    loginWithSocial,
    resetPassword,
    loading,
    error,
  } = useAuth();

  const [authType, setAuthType] = useState<AuthType>("sign-in");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    latitude: null,
    longitude: null,
  });

  const [clubData, setClubData] = useState<ClubFormData>({
    email: "",
    password: "",
    orgNumber: "",
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  // Clear field errors when switching auth types
  const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) return "Password is required";

    const strength = validatePasswordStrength(password);
    if (!strength.meetsMinimum) {
      return "Password must meet minimum requirements";
    }

    return undefined;
  };

  const validateRequired = (
    value: string,
    fieldName: string
  ): string | undefined => {
    if (!value.trim()) return `${fieldName} is required`;
    return undefined;
  };

  const handleLogin = async () => {
    clearFieldErrors();
    const errors: FieldErrors = {};

    // Validate fields
    errors.email = validateEmail(loginData.email);
    errors.password = validatePassword(loginData.password);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(
      (error) => error !== undefined
    );
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleRegister = async () => {
    clearFieldErrors();
    const errors: FieldErrors = {};

    // Validate fields
    errors.firstName = validateRequired(registerData.firstName, "First name");
    errors.lastName = validateRequired(registerData.lastName, "Last name");
    errors.email = validateEmail(registerData.email);
    errors.password = validatePassword(registerData.password);
    errors.phone = validateRequired(registerData.phone, "Phone number");
    errors.address = validateRequired(registerData.address, "Address");

    // Validate password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(
      (error) => error !== undefined
    );
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
        address: registerData.address,
        latitude: registerData.latitude,
        longitude: registerData.longitude,
      });
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const handleClubLogin = async () => {
    clearFieldErrors();
    const errors: FieldErrors = {};

    // Validate fields
    errors.email = validateEmail(clubData.email);
    errors.password = validatePassword(clubData.password);
    // Organization number is optional, no validation needed

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(
      (error) => error !== undefined
    );
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await loginClub(clubData.email, clubData.password, clubData.orgNumber);
    } catch (err) {
      console.error("Club login error:", err);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    try {
      await loginWithSocial(provider);
    } catch (err) {
      console.error("Social sign-in error:", err);
    }
  };

  const handleForgotPassword = async () => {
    clearFieldErrors();
    const errors: FieldErrors = {};

    // Validate email
    errors.email = validateEmail(forgotPasswordEmail);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(
      (error) => error !== undefined
    );
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    try {
      await resetPassword(forgotPasswordEmail);
      setAuthType("sign-in"); // Go back to sign-in after sending reset email
    } catch (err) {
      console.error("Forgot password error:", err);
    }
  };

  const getHeaderContent = () => {
    switch (authType) {
      case "sign-in":
        return {
          title: "Välkommen",
          subtitle: "Logga in för att få tillgång till din träningsresa",
        };
      case "register":
        return {
          title: "Skapa konto",
        };
      case "club":
        return {
          title: "Klubb Inloggning",
        };
      case "forgot-password":
        return {
          title: "Återställ Lösenord",
        };
    }
  };

  const handleAddressSelect = useCallback((addressInfo: AddressInfo) => {
    setRegisterData((prev) => ({
      ...prev,
      address: addressInfo.formatted_address,
      latitude: addressInfo.latitude,
      longitude: addressInfo.longitude,
    }));
  }, []);

  return {
    // State
    authType,
    loginData,
    registerData,
    clubData,
    forgotPasswordEmail,
    loading,
    error,
    fieldErrors,

    // Actions
    setAuthType,
    setLoginData,
    setRegisterData,
    setClubData,
    setForgotPasswordEmail,
    clearFieldErrors,
    handleLogin,
    handleRegister,
    handleClubLogin,
    handleSocialSignIn,
    handleForgotPassword,
    handleAddressSelect,
    getHeaderContent,
  };
};
