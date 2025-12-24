import colors from "../../constants/custom-colors";
import { User, X } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
  user: {
    name: string;
    avatar_url?: string;
    is_online?: boolean;
    current_streak?: number;
    status?: "pending" | "accepted" | "blocked";
  };
  onClose: () => void;
  onMessage: () => void;
  onAddFriend?: () => void;
  onShowOptions?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onClose,
  onMessage,
  onAddFriend,
  onShowOptions,
}) => {
  return (
    <View className="px-6 pt-6 pb-6">
      {/* Close Button */}
      <View className="flex-row items-center justify-end mb-4">
        <TouchableOpacity
          onPress={onClose}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface/50"
          activeOpacity={0.7}
        >
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Profile Picture & Name */}
      <View className="items-center mb-6">
        <View className="relative">
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-surface/50 items-center justify-center">
              <User size={40} color={colors.textSecondary} />
            </View>
          )}
          {user.is_online && (
            <View className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-background" />
          )}
        </View>
        <Text className="text-textPrimary font-bold text-2xl mt-4">
          {user.name}
        </Text>
        {user.current_streak !== undefined && user.current_streak > 0 && (
          <View className="flex-row items-center mt-2">
            <Text className="text-textSecondary text-sm">
              🔥 {user.current_streak} dagars streak
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onMessage}
          activeOpacity={0.7}
          className="flex-1 bg-primary rounded-xl py-3.5 items-center justify-center"
        >
          <Text className="text-textPrimary font-semibold">Meddelande</Text>
        </TouchableOpacity>

        {/*     <TouchableOpacity
          activeOpacity={0.7}
          onPress={onShowOptions}
          className="w-12 h-12 bg-surface/50 rounded-xl items-center justify-center"
        >
          <MoreVertical size={20} color={colors.textPrimary} />
        </TouchableOpacity> */}
      </View>
    </View>
  );
};
