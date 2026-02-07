import { useNavigation } from '../services/navigationService';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type AuthType = 'sign-in' | 'register' | 'club' | 'forgot-password';

interface AuthNavigationProps {
  currentAuthType: AuthType;
  onAuthTypeChange: (authType: AuthType) => void;
  disabled?: boolean;
}

const AuthNavigation: React.FC<AuthNavigationProps> = ({
  currentAuthType,
  onAuthTypeChange,
  disabled = false,
}) => {
  const navigation = useNavigation();

  const getNavigationLinks = () => {
    switch (currentAuthType) {
      case 'sign-in':
        return {
          primary: {
            label: 'Sign Up',
            description: "Don't have an account?",
            onPress: () => onAuthTypeChange('register'),
          },
          secondary: {
            label: 'Club Login',
            description: 'Are you a business?',
            onPress: () => onAuthTypeChange('club'),
          },
        };
      case 'register':
        return {
          primary: {
            label: 'Sign In',
            description: 'Already have an account?',
            onPress: () => onAuthTypeChange('sign-in'),
          },
          secondary: {
            label: 'Club Login',
            description: 'Are you a business?',
            onPress: () => onAuthTypeChange('club'),
          },
        };
      case 'club':
        return {
          primary: {
            label: 'User Login',
            description: 'Personal account?',
            onPress: () => onAuthTypeChange('sign-in'),
          },
          secondary: {
            label: 'Sign Up',
            description: `New to ${process.env.APP_NAME}?`,
            onPress: () => onAuthTypeChange('register'),
          },
        };
      case 'forgot-password':
        return {
          primary: {
            label: 'Sign In',
            description: 'Remember your password?',
            onPress: () => onAuthTypeChange('sign-in'),
          },
          secondary: {
            label: 'Sign Up',
            description: "Don't have an account?",
            onPress: () => onAuthTypeChange('register'),
          },
        };
    }
  };

  const navigationLinks = getNavigationLinks();

  return (
    <View className="space-y-4">
      {/* Primary Navigation Cards */}
      <View className="space-y-3">
        <TouchableOpacity
          className={`bg-surface border border-accentGray rounded-xl p-4 ${
            disabled ? 'opacity-50' : 'active:bg-accentGray'
          }`}
          onPress={navigationLinks.primary.onPress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-textSecondary text-xs font-medium mb-1">
                {navigationLinks.primary.description}
              </Text>
              <Text className="text-textPrimary text-base font-semibold">
                {navigationLinks.primary.label}
              </Text>
            </View>
            <View className="w-6 h-6 bg-indigo-500 rounded-full items-center justify-center">
              <Text className="text-textPrimary font-bold text-xs">→</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`bg-surface border border-accentGray rounded-xl p-4 ${
            disabled ? 'opacity-50' : 'active:bg-accentGray'
          }`}
          onPress={navigationLinks.secondary.onPress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-textSecondary text-xs font-medium mb-1">
                {navigationLinks.secondary.description}
              </Text>
              <Text className="text-textPrimary text-base font-semibold">
                {navigationLinks.secondary.label}
              </Text>
            </View>
            <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
              <Text className="text-textPrimary font-bold text-xs">→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthNavigation;
