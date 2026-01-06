import { CustomAddressInput } from "@shared/components/CustomAddressInput";
import { FormField } from "@shared/components/FormField";
import { PasswordStrengthIndicator } from "@shared/components/PasswordStrengthIndicator";
import { PhoneInput } from "@shared/components/PhoneInput";
import { useTheme } from "@shared/components/ThemeProvider";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { AddressInfo } from "@shared/services/googlePlacesService";
import { validatePassword } from "@shared/utils/passwordValidation";
import { ArrowLeft, ArrowRight, Eye, EyeSlash } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Reusable components for cleaner code

interface CustomTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
  autoCapitalize = "sentences",
  keyboardType = "default",
  secureTextEntry = false,
  rightElement,
}) => {
  const { isDark } = useTheme();

  return (
    <View className="relative">
      <TextInput
        className={`rounded-xl px-4 py-4 text-lg border ${
          error
            ? "border-accentRed"
            : isDark
            ? "border-accentGray"
            : "border-lightBorderGray"
        } ${
          isDark
            ? "bg-accentGray text-textPrimary"
            : "bg-lightAccentGray text-lightTextPrimary"
        } ${rightElement ? "pr-12" : ""}`}
        placeholder={placeholder}
        placeholderTextColor={
          isDark ? colors.borderGray : colors.lightTextSecondary
        }
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
      {rightElement}
    </View>
  );
};

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  editable?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <CustomTextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      error={error}
      editable={editable}
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      rightElement={
        <TouchableOpacity
          className="absolute right-4 top-4"
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeSlash size={24} color={colors.borderGray} />
          ) : (
            <Eye size={24} color={colors.borderGray} />
          )}
        </TouchableOpacity>
      }
    />
  );
};

interface FieldErrors {
  [key: string]: string | undefined;
}

interface RegisterFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
}

const RegisterForm = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  phone,
  setPhone,
  address,
  latitude,
  longitude,
  onAddressSelect,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: RegisterFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const totalSteps = 3;
  const { checkEmailAvailability } = useAuth();
  const { showError } = useGlobalFeedback();

  // Calculate password strength
  const passwordStrength = useMemo(
    () => validatePassword(password),
    [password]
  );

  const handleProceedToStep2 = async () => {
    if (!canProceedToStep2) return;

    // Check email availability
    setIsCheckingEmail(true);
    try {
      const result = await checkEmailAvailability(email);
      
      if (!result.available) {
        showError("E-post upptagen", result.error || "Ett konto med denna e-postadress finns redan");
        return;
      }
      
      // Email is available, proceed to step 2
      setCurrentStep(2);
    } catch (error) {
      showError("Fel", "Kunde inte kontrollera e-postadressen. Försök igen.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      return;
    }

    if (!passwordStrength.meetsMinimum) {
      return;
    }

    onSubmit();
  };

  const canProceedToStep2 = firstName.trim() && lastName.trim() && email.trim();
  const canProceedToStep3 = phone.trim() && address.trim();
  const canSubmit =
    password &&
    confirmPassword &&
    passwordStrength.meetsMinimum &&
    password === confirmPassword;

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              step <= currentStep ? "bg-indigo-500" : "bg-accentGray"
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                step <= currentStep ? "text-textPrimary" : "text-textSecondary"
              }`}
            >
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              className={`w-8 h-0.5 mx-2 ${
                step < currentStep ? "bg-indigo-500" : "bg-accentGray"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="space-y-6">
      <Text className="text-2xl font-bold text-textPrimary text-center mb-4">
        Personlig information
      </Text>

      <FormField label="Förnamn" error={fieldErrors.firstName}>
        <CustomTextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ange ditt förnamn"
          error={fieldErrors.firstName}
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Efternamn" error={fieldErrors.lastName}>
        <CustomTextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Ange ditt efternamn"
          error={fieldErrors.lastName}
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="E-post" error={fieldErrors.email}>
        <CustomTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Ange din e-postadress"
          error={fieldErrors.email}
          editable={!isSubmitting}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </FormField>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-8 flex-row justify-center ${
          canProceedToStep2 && !isCheckingEmail ? "bg-indigo-500" : "bg-borderGray"
        }`}
        onPress={handleProceedToStep2}
        disabled={!canProceedToStep2 || isCheckingEmail}
      >
        {isCheckingEmail ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <>
            <Text className="text-textPrimary font-bold text-lg mr-2">Nästa</Text>
            <ArrowRight size={20} color={colors.textPrimary} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View className="space-y-6">
      <Text className="text-2xl font-bold text-textPrimary text-center mb-4">
        Kontakt & plats
      </Text>

      <FormField label="Telefon" error={fieldErrors.phone}>
        <PhoneInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Telefonnummer"
          error={fieldErrors.phone}
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Adress" error={fieldErrors.address}>
        <View>
          <CustomAddressInput
            placeholder="Ange din adress"
            onAddressSelect={onAddressSelect}
            currentAddress={address}
            error={fieldErrors.address}
            tailwindClasses="bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border border-accentGray"
          />
        </View>
      </FormField>

      <View className="flex-row space-x-4 mt-8">
        <TouchableOpacity
          className="flex-1 rounded-xl py-4 items-center shadow-lg bg-accentGray flex-row justify-center"
          onPress={() => setCurrentStep(1)}
        >
          <ArrowLeft size={20} color={colors.textSecondary} />
          <Text className="text-textSecondary font-bold text-lg ml-2">
            Tillbaka
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 rounded-xl py-4 items-center shadow-lg flex-row justify-center ${
            canProceedToStep3 ? "bg-indigo-500" : "bg-borderGray"
          }`}
          onPress={() => setCurrentStep(3)}
          disabled={!canProceedToStep3}
        >
          <Text className="text-textPrimary font-bold text-lg mr-2">Nästa</Text>
          <ArrowRight size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="space-y-6">
      <Text className="text-2xl font-bold text-textPrimary text-center mb-4">
        Säkerhet
      </Text>

      <Text className="text-textSecondary text-sm text-center mb-4">
        Vi skickar en verifieringskod till din e-post för att bekräfta ditt
        konto
      </Text>

      <FormField label="Lösenord" error={fieldErrors.password}>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Skapa ett lösenord"
          error={fieldErrors.password}
          editable={!isSubmitting}
        />

        
      </FormField>

      <FormField label="Bekräfta lösenord" error={fieldErrors.confirmPassword}>
        <PasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Bekräfta ditt lösenord"
          error={fieldErrors.confirmPassword}
          editable={!isSubmitting}
        />
        {confirmPassword && password !== confirmPassword && (
          <Text className="text-red-400 text-sm mt-1">
            Lösenorden matchar inte
          </Text>
        )}
        {password.length > 0 && (
          <View className="mt-2">
            <PasswordStrengthIndicator strength={passwordStrength} />
          </View>
        )}
      </FormField>

      <View className="flex-row space-x-4 mt-8">
        <TouchableOpacity
          className="flex-1 rounded-xl py-4 items-center shadow-lg bg-accentGray flex-row justify-center"
          onPress={() => setCurrentStep(2)}
          disabled={isSubmitting}
        >
          <ArrowLeft size={20} color={colors.textSecondary} />
          <Text className="text-textSecondary font-bold text-lg ml-2">
            Tillbaka
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 rounded-xl py-4 items-center shadow-lg ${
            canSubmit && !isSubmitting ? "bg-indigo-500" : "bg-borderGray"
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text className="text-textPrimary font-bold text-lg">
              Skapa konto
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text className="text-textSecondary text-center text-sm mt-6">
        Genom att skapa ett konto godkänner du våra användarvillkor och
        integritetspolicy
      </Text>
    </View>
  );

  return (
    <View className="space-y-6">
      {renderStepIndicator()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </View>
  );
};

export default RegisterForm;
