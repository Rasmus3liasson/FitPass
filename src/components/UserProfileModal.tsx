import { MapPin, Trophy, User } from "lucide-react-native";
import React from "react";
import { Image, Text, View } from "react-native";
import { BaseModal } from "./BaseModal";

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    status?: "pending" | "accepted" | "blocked";
    current_streak?: number;
    workouts_this_week?: number;
    is_online?: boolean;
    mutual_friends_count?: number;
    bio?: string;
    created_at?: string;
    city?: string;
    total_workouts?: number;
    favorite_activities?: string[];
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "Nyligen registrerad";
    const date = new Date(dateString);
    return `Medlem sedan ${date.toLocaleDateString("sv-SE", {
      month: "long",
      year: "numeric",
    })}`;
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title={user.name}>
      {/* Profile Header */}
      <View className="items-center mb-6">
        <View className="relative mb-4">
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-surface items-center justify-center">
              <User size={40} color="#666" strokeWidth={1.5} />
            </View>
          )}
          {user.is_online && (
            <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-accentGreen rounded-full border-3 border-background" />
          )}
        </View>

        {user.bio && (
          <Text className="text-textSecondary text-center text-base mb-4 leading-relaxed">
            {user.bio}
          </Text>
        )}

        <View className="flex-row items-center justify-center space-x-4 mb-4">
          {user.city && (
            <View className="flex-row items-center space-x-1">
              <MapPin size={16} color="#666" strokeWidth={1.5} />
              <Text className="text-textSecondary text-sm">{user.city}</Text>
            </View>
          )}
          <View className="flex-row items-center space-x-1">
            <Text className="text-textSecondary text-sm">
              {formatJoinDate(user.created_at)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row space-x-4 mb-6 gap-3">
        <View className="flex-1 bg-surface rounded-xl p-4 items-center">
          <View className="flex-row items-center space-x-2 mb-2">
            <Text className="text-textSecondary text-sm">Träningar i rad</Text>
          </View>
          <Text className="text-textPrimary text-2xl font-bold">
            {user.current_streak || 0}
          </Text>
          <Text className="text-textSecondary text-xs">dagar</Text>
        </View>

        <View className="flex-1 bg-surface rounded-xl p-4 items-center">
          <View className="flex-row items-center space-x-2 mb-2">
            <Text className="text-textSecondary text-sm">Denna vecka</Text>
          </View>
          <Text className="text-textPrimary text-2xl font-bold">
            {user.workouts_this_week || 0}
          </Text>
          <Text className="text-textSecondary text-xs">träningar</Text>
        </View>
      </View>

      {/* Additional Stats */}
      {user.total_workouts !== undefined && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center space-x-2 mb-2">
            <Trophy size={18} color="#6366f1" strokeWidth={1.5} />
            <Text className="text-textSecondary text-sm">Totalt träningar</Text>
          </View>
          <Text className="text-textPrimary text-xl font-bold">
            {user.total_workouts}
          </Text>
        </View>
      )}

      {/* Favorite Activities */}
      {user.favorite_activities && user.favorite_activities.length > 0 && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-textPrimary font-semibold mb-3">
            Favoritaktiviteter
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {user.favorite_activities.map((activity, index) => (
              <View
                key={index}
                className="bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Text className="text-primary text-sm font-medium">
                  {activity}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mutual Friends */}
      {user.mutual_friends_count !== undefined &&
        user.mutual_friends_count > 0 && (
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-textPrimary font-semibold mb-2">
              Gemensamma kontakter
            </Text>
            <Text className="text-textSecondary">
              Ni har {user.mutual_friends_count} gemensam
              {user.mutual_friends_count !== 1 ? "ma" : ""} vän
              {user.mutual_friends_count !== 1 ? "ner" : ""}
            </Text>
          </View>
        )}
    </BaseModal>
  );
};
