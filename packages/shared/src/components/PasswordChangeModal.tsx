import colors from '@fitpass/shared/constants/custom-colors';
import { Eye, EyeSlash, Lock, X } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePasswordChange } from '../hooks/usePasswordChange';
import { validatePassword } from '../utils/passwordValidation';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useTheme } from './ThemeProvider';

interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ visible, onClose }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    }
  };

  const handleClose = () => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View
          className={`rounded-2xl p-6 w-full max-w-md ${isDark ? 'bg-surface' : 'bg-lightSurface'}`}
        >
          {/* Header with close button */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Lock size={16} color={colors.primary} />
              </View>
              <Text
                className={`text-xl font-semibold ${
                  isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
                }`}
              >
                Ändra lösenord
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-accentGray/50 items-center justify-center ml-4"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Current Password */}
          <View className="mb-4">
            <Text
              className={`mb-2 font-medium ${
                isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
              }`}
            >
              Nuvarande lösenord
            </Text>
            <View
              className={`flex-row items-center rounded-xl border ${
                isDark
                  ? 'bg-background border-accentGray'
                  : 'bg-lightAccentGray border-lightBorderGray'
              }`}
            >
              <TextInput
                className={`flex-1 px-4 py-3 ${
                  isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
                }`}
                placeholder="Ange nuvarande lösenord"
                placeholderTextColor={isDark ? colors.borderGray : colors.borderGray}
                value={form.currentPassword}
                onChangeText={(text) => handleChange('currentPassword', text)}
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeSlash size={20} color={isDark ? colors.borderGray : colors.borderGray} />
                ) : (
                  <Eye size={20} color={isDark ? colors.borderGray : colors.borderGray} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text
              className={`mb-2 font-medium ${
                isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
              }`}
            >
              Nytt lösenord
            </Text>
            <View
              className={`flex-row items-center rounded-xl border ${
                isDark
                  ? 'bg-background border-accentGray'
                  : 'bg-lightAccentGray border-lightBorderGray'
              }`}
            >
              <TextInput
                className={`flex-1 px-4 py-3 ${
                  isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
                }`}
                placeholder="Ange nytt lösenord"
                placeholderTextColor={isDark ? colors.borderGray : colors.borderGray}
                value={form.newPassword}
                onChangeText={(text) => handleChange('newPassword', text)}
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
              />
              <TouchableOpacity className="px-3" onPress={() => togglePasswordVisibility('new')}>
                {showPasswords.new ? (
                  <EyeSlash size={20} color={isDark ? colors.borderGray : colors.borderGray} />
                ) : (
                  <Eye size={20} color={isDark ? colors.borderGray : colors.borderGray} />
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
            <Text
              className={`mb-2 font-medium ${
                isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
              }`}
            >
              Benkräfta nytt lösenord
            </Text>
            <View
              className={`flex-row items-center rounded-xl border ${
                showMismatchError
                  ? 'border-accentRed'
                  : isDark
                    ? 'bg-background border-accentGray'
                    : 'bg-lightAccentGray border-lightBorderGray'
              } ${isDark ? 'bg-background' : 'bg-lightAccentGray'}`}
            >
              <TextInput
                className={`flex-1 px-4 py-3 ${
                  isDark ? 'text-textPrimary' : 'text-lightTextPrimary'
                }`}
                placeholder="Bekräfta nytt lösenord"
                placeholderTextColor={isDark ? colors.borderGray : colors.borderGray}
                value={form.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeSlash size={20} color={isDark ? colors.borderGray : colors.borderGray} />
                ) : (
                  <Eye size={20} color={isDark ? colors.borderGray : colors.borderGray} />
                )}
              </TouchableOpacity>
            </View>

            {/* Password Mismatch Error */}
            {showMismatchError && (
              <Text className="text-accentRed text-sm mt-1">Lösenorden matchar inte</Text>
            )}
          </View>

          {/* Single Update Button */}
          <View>
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                passwordChange.isPending ||
                !form.currentPassword ||
                !form.newPassword ||
                !form.confirmPassword ||
                !passwordStrength.meetsMinimum ||
                !passwordsMatch
                  ? 'bg-accentGray'
                  : 'bg-primary'
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
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-textPrimary font-semibold ml-2">Uppdaterar...</Text>
                </View>
              ) : (
                <Text className="text-textPrimary font-semibold">Uppdatera lösenord</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
