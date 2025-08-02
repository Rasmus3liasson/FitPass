import { PasswordStrengthIndicator } from "@/src/components/PasswordStrengthIndicator";
import { useTheme } from "@/src/components/ThemeProvider";
import { usePasswordChange } from "@/src/hooks/usePasswordChange";
import { validatePassword } from "@/src/utils/passwordValidation";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  visible,
  onClose,
}) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { isDark } = useTheme();
  const passwordChange = usePasswordChange();

  // Calculate password strength for new password
  const passwordStrength = useMemo(() => validatePassword(form.newPassword), [form.newPassword]);

  // Check if passwords match
  const passwordsMatch = form.newPassword === form.confirmPassword;
  const showMismatchError = form.confirmPassword.length > 0 && !passwordsMatch;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return;
    }

    // Check if password meets minimum requirements
    if (!passwordStrength.meetsMinimum) {
      return;
    }

    // Check if passwords match
    if (!passwordsMatch) {
      return;
    }

    await passwordChange.mutateAsync(form);
    
    if (!passwordChange.isError) {
      // Clear form and close modal on success
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    }
  };

  const handleClose = () => {
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className={`rounded-2xl p-6 w-full max-w-md ${isDark ? 'bg-surface' : 'bg-lightSurface'}`}>
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Lock size={16} color="#6366F1" />
            </View>
            <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}>
              Change Password
            </Text>
          </View>

          {/* Current Password */}
          <View className="mb-4">
            <Text className={`mb-2 font-medium ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}>
              Current Password
            </Text>
            <View className={`flex-row items-center rounded-xl border ${
              isDark ? 'bg-background border-gray-600' : 'bg-lightAccentGray border-lightBorderGray'
            }`}>
              <TextInput
                className={`flex-1 px-4 py-3 ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}
                placeholder="Enter current password"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={form.currentPassword}
                onChangeText={(text) => handleChange("currentPassword", text)}
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => togglePasswordVisibility("current")}
              >
                {showPasswords.current ? (
                  <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                ) : (
                  <Eye size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className={`mb-2 font-medium ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}>
              New Password
            </Text>
            <View className={`flex-row items-center rounded-xl border ${
              isDark ? 'bg-background border-gray-600' : 'bg-lightAccentGray border-lightBorderGray'
            }`}>
              <TextInput
                className={`flex-1 px-4 py-3 ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={form.newPassword}
                onChangeText={(text) => handleChange("newPassword", text)}
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => togglePasswordVisibility("new")}
              >
                {showPasswords.new ? (
                  <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                ) : (
                  <Eye size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {form.newPassword.length > 0 && (
              <View className="mt-2">
                <PasswordStrengthIndicator strength={passwordStrength} />
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className={`mb-2 font-medium ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}>
              Confirm New Password
            </Text>
            <View className={`flex-row items-center rounded-xl border ${
              showMismatchError 
                ? 'border-red-500' 
                : isDark ? 'bg-background border-gray-600' : 'bg-lightAccentGray border-lightBorderGray'
            } ${isDark ? 'bg-background' : 'bg-lightAccentGray'}`}>
              <TextInput
                className={`flex-1 px-4 py-3 ${isDark ? 'text-white' : 'text-lightTextPrimary'}`}
                placeholder="Confirm new password"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={form.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => togglePasswordVisibility("confirm")}
              >
                {showPasswords.confirm ? (
                  <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                ) : (
                  <Eye size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Password Mismatch Error */}
            {showMismatchError && (
              <Text className="text-red-400 text-sm mt-1">
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-600 rounded-xl py-3 items-center"
              onPress={handleClose}
              disabled={passwordChange.isPending}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 rounded-xl py-3 items-center ${
                passwordChange.isPending ||
                !form.currentPassword ||
                !form.newPassword ||
                !form.confirmPassword ||
                !passwordStrength.meetsMinimum ||
                !passwordsMatch
                  ? "bg-gray-600"
                  : "bg-primary"
              }`}
              onPress={handleSubmit}
              disabled={
                passwordChange.isPending ||
                !form.currentPassword ||
                !form.newPassword ||
                !form.confirmPassword ||
                !passwordStrength.meetsMinimum ||
                !passwordsMatch
              }
            >
              {passwordChange.isPending ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-white font-semibold ml-2">Updating...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
