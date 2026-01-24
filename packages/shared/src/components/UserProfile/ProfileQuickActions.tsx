import colors from '@shared/constants/custom-colors';
import { CalendarPlus, User } from 'phosphor-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ProfileQuickActionsProps {
  userStatus?: 'pending' | 'accepted' | 'blocked';
  onPlanWorkout?: () => void;
  onInviteToGroup?: () => void;
}

export const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({
  userStatus,
  onPlanWorkout,
  onInviteToGroup,
}) => {
  if (userStatus !== 'accepted') {
    return null;
  }

  const handlePlanWorkout = () => {
    onPlanWorkout?.();
    // TODO: Navigate to workout planning
  };

  const handleInviteToGroup = () => {
    onInviteToGroup?.();
    // TODO: Navigate to group invitation
  };

  return (
    <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
      <Text className="text-textPrimary font-semibold text-base mb-4">Snabbåtgärder</Text>
      <View className="space-y-3">
        <TouchableOpacity
          onPress={handlePlanWorkout}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-background rounded-xl p-4 border border-border"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center mr-3">
              <CalendarPlus size={18} color={colors.accentBlue} />
            </View>
            <View>
              <Text className="text-textPrimary font-medium">Planera träning</Text>
              <Text className="text-textSecondary text-xs">Träna tillsammans</Text>
            </View>
          </View>
          <Text className="text-textPrimary text-sm">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleInviteToGroup}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-background rounded-xl p-4 border border-border"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-green-500/10 items-center justify-center mr-3">
              <User size={18} color={colors.accentGreen} />
            </View>
            <View>
              <Text className="text-textPrimary font-medium">Bjud in till grupp</Text>
              <Text className="text-textSecondary text-xs">Skapa träningsgrupp</Text>
            </View>
          </View>
          <Text className="text-textPrimary text-sm">→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
