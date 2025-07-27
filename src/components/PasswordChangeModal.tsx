import { usePasswordChange } from "@/src/hooks/usePasswordChange";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import React, { useState } from "react";
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

  const passwordChange = usePasswordChange();

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
        <View className="bg-surface rounded-2xl p-6 w-full max-w-md">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Lock size={16} color="#6366F1" />
            </View>
            <Text className="text-white text-xl font-semibold">Change Password</Text>
          </View>

          {/* Current Password */}
          <View className="mb-4">
            <Text className="text-white mb-2 font-medium">Current Password</Text>
            <View className="flex-row items-center bg-background rounded-xl border border-gray-600">
              <TextInput
                className="flex-1 px-4 py-3 text-white"
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
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
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-white mb-2 font-medium">New Password</Text>
            <View className="flex-row items-center bg-background rounded-xl border border-gray-600">
              <TextInput
                className="flex-1 px-4 py-3 text-white"
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#9CA3AF"
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
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-white mb-2 font-medium">Confirm New Password</Text>
            <View className="flex-row items-center bg-background rounded-xl border border-gray-600">
              <TextInput
                className="flex-1 px-4 py-3 text-white"
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
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
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
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
              className="flex-1 bg-primary rounded-xl py-3 items-center"
              onPress={handleSubmit}
              disabled={
                passwordChange.isPending ||
                !form.currentPassword ||
                !form.newPassword ||
                !form.confirmPassword
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
