import {
  MapPin,
  MessageCircle,
  User,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";
import { UserProfileModal } from "./UserProfileModal";

interface FriendCardProps {
  friend: {
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
    favorite_clubs?: Array<{
      id: string;
      name: string;
      type?: string;
    }>;
    frequent_gym?: {
      id: string;
      name: string;
      type?: string;
    };
    profile_visibility?: boolean;
  };
  type: "friend" | "suggestion" | "request_received" | "request_sent";
  onAddFriend?: (friendId: string) => void;
  onAcceptFriend?: (friendId: string) => void;
  onDeclineFriend?: (friendId: string) => void;
  onRemoveFriend?: (friendId: string) => void;
  onMessage?: (friendId: string) => void;
}

export function FriendCard({
  friend,
  type,
  onAddFriend,
  onAcceptFriend,
  onDeclineFriend,
  onRemoveFriend,
  onMessage,
}: FriendCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Animate when type changes to 'friend'
  useEffect(() => {
    if (type === "friend") {
      // Scale up briefly then back to normal for a gentle "success" feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [type]);
  const renderActionButtons = () => {
    switch (type) {
      case "suggestion":
        return (
          <TouchableOpacity
            onPress={() => onAddFriend?.(friend.id)}
            className="bg-primary/90 rounded-xl px-4 py-2.5 flex-row items-center space-x-2 shadow-sm"
          >
            <UserPlus size={14} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
        );

      case "request_received":
        return (
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => onAcceptFriend?.(friend.id)}
              className="bg-green-500/90 rounded-xl px-3 py-2.5 flex-row items-center space-x-2 shadow-sm"
            >
              <UserCheck size={14} color="white" strokeWidth={1.5} />
              <Text className="text-white text-sm font-medium">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeclineFriend?.(friend.id)}
              className="bg-surface border border-gray-300 rounded-xl px-3 py-2.5 shadow-sm"
            >
              <UserX size={14} color="#666" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        );

      case "request_sent":
        return (
          <View className="bg-surface border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm">
            <Text className="text-textSecondary text-sm font-medium">
              Pending
            </Text>
          </View>
        );

      case "friend":
        return (
          <View className="flex-row space-x-2 gap-2">
            {onMessage && (
              <TouchableOpacity
                onPress={() => onMessage?.(friend.id)}
                className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5 shadow-sm"
              >
                <MessageCircle size={14} color="#6366f1" strokeWidth={1.5} />
              </TouchableOpacity>
            )}
            {onRemoveFriend && (
              <TouchableOpacity
                onPress={() => onRemoveFriend?.(friend.id)}
                className="bg-accentRed/50 rounded-xl px-3 py-2.5 shadow-sm"
              >
                <UserX size={14} color="#ef4444" strokeWidth={1.5} />
              </TouchableOpacity>
            )}
            {!onMessage && !onRemoveFriend && (
              <Animated.View
                style={{ transform: [{ scale: scaleAnim }] }}
                className="bg-accentGreen/10 rounded-xl px-4 py-2.5 flex-row items-center space-x-2 shadow-sm"
              >
                <UserCheck size={16} color="#22c55e" strokeWidth={1.5} />
              </Animated.View>
            )}
          </View>
        );
    }
  };

  return (
    <>
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
        onPress={() => setShowProfileModal(true)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View className="relative">
            {friend.avatar_url ? (
              <Image
                source={{ uri: friend.avatar_url }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-accentGray items-center justify-center">
                <User size={24} color="#666" strokeWidth={1.5} />
              </View>
            )}
            {friend.is_online && (
              <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            )}
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-textPrimary font-semibold text-base">
                {friend.name}
              </Text>
            </View>

            {type === "suggestion" &&
              friend.mutual_friends_count !== undefined && (
                <Text className="text-textSecondary text-sm">
                  {friend.mutual_friends_count > 0
                    ? `${friend.mutual_friends_count} mutual friends`
                    : "Förslag till dig"}
                </Text>
              )}

            {type === "friend" && (
              <View className="mt-1">
                <View className="flex-row space-x-4">
                  {friend.current_streak !== undefined && (
                    <Text className="text-textSecondary text-sm">
                      🔥 {friend.current_streak} dagars streak
                    </Text>
                  )}
                  {friend.workouts_this_week !== undefined && (
                    <Text className="text-textSecondary text-sm">
                      💪 {friend.workouts_this_week} träningar denna vecka
                    </Text>
                  )}
                </View>
                
                {/* Gym/Club Information */}
                {friend.profile_visibility !== false && friend.frequent_gym && (
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#666" strokeWidth={1.5} />
                    <Text className="text-textSecondary text-xs ml-1">
                      Tränar ofta på {friend.frequent_gym.name}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="ml-2"
          onPress={(e) => e.stopPropagation()}
          activeOpacity={1}
        >
          {renderActionButtons()}
        </TouchableOpacity>
      </TouchableOpacity>

      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={friend}
      />
    </>
  );
}
