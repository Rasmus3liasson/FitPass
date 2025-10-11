import { CustomAddressInput } from "@/src/components/CustomAddressInput";
import { PasswordStrengthIndicator } from "@/src/components/PasswordStrengthIndicator";
import { PhoneInput } from "@/src/components/PhoneInput";
import { useTheme } from "@/src/components/ThemeProvider";
import { AddressInfo } from "@/src/services/googlePlacesService";
import { validatePassword } from "@/src/utils/passwordValidation";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";

// Reusable components for cleaner code
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  const { isDark } = useTheme();
  
  return (
    <View>
      <Text className={`font-semibold mb-3 text-lg ${isDark ? 'text-textPrimary' : 'text-lightTextPrimary'}`}>
        {label}
      </Text>
      {children}
      {error && (
        <Text className="text-red-400 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
};

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
  rightElement
}) => {
  const { isDark } = useTheme();
  
  return (
    <View className="relative">
      <TextInput
        className={`rounded-xl px-4 py-4 text-lg border ${
          error ? "border-red-500" : isDark ? "border-accentGray" : "border-lightBorderGray"
        } ${isDark ? 'bg-accentGray text-textPrimary' : 'bg-lightAccentGray text-lightTextPrimary'} ${
          rightElement ? 'pr-12' : ''
        }`}
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.borderGray : colors.lightTextSecondary}
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
  editable = true
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
            <EyeOff size={24} color={colors.borderGray} />
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
  // Calculate password strength
  const passwordStrength = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      // You might want to show an error message here
      return;
    }
    
    // Check if password meets minimum requirements
    if (!passwordStrength.meetsMinimum) {
      // You might want to show an error message here
      return;
    }
    
    onSubmit();
  };

  return (
    <View className="space-y-8">
      <View className="flex-row space-x-4">
        <View className="flex-1">
          <FormField label="First Name" error={fieldErrors.firstName}>
            <CustomTextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              error={fieldErrors.firstName}
              editable={!isSubmitting}
            />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Last Name" error={fieldErrors.lastName}>
            <CustomTextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              error={fieldErrors.lastName}
              editable={!isSubmitting}
            />
          </FormField>
        </View>
      </View>

      <FormField label="Email" error={fieldErrors.email}>
        <CustomTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          error={fieldErrors.email}
          editable={!isSubmitting}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </FormField>
      <FormField label="Address" error={fieldErrors.address}>
        <CustomAddressInput
          placeholder="Enter your address"
          onAddressSelect={onAddressSelect}
          currentAddress={address}
          error={fieldErrors.address}
          tailwindClasses="bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border border-accentGray"
        />
      </FormField>

      <FormField label="Phone" error={fieldErrors.phone}>
        <PhoneInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          error={fieldErrors.phone}
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Password" error={fieldErrors.password}>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          error={fieldErrors.password}
          editable={!isSubmitting}
        />
        
        {/* Password strength indicator */}
        {password.length > 0 && (
          <PasswordStrengthIndicator strength={passwordStrength} />
        )}
      </FormField>

      <FormField label="Confirm Password" error={fieldErrors.confirmPassword}>
        <PasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          error={fieldErrors.confirmPassword}
          editable={!isSubmitting}
        />
      </FormField>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-8 ${
          isSubmitting || !passwordStrength.meetsMinimum || password !== confirmPassword
            ? "bg-borderGray" 
            : "bg-indigo-500"
        }`}
        onPress={handleSubmit}
        disabled={isSubmitting || !passwordStrength.meetsMinimum || password !== confirmPassword}
      >
        <Text className="text-textPrimary font-bold text-lg">
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <Text className="text-textSecondary text-center text-sm mt-6">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy
      </Text>
    </View>
  );
};

export default RegisterForm;
