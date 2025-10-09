import { MessageCircle, User, UserCheck, UserPlus, UserX } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";

interface FriendCardProps {
  friend: {
    id: string;
    name: string;
    avatar_url?: string;
    status?: 'pending' | 'accepted' | 'blocked';
    current_streak?: number;
    workouts_this_week?: number;
    is_online?: boolean;
    mutual_friends_count?: number;
  };
  type: 'friend' | 'suggestion' | 'request_received' | 'request_sent';
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

  // Animate when type changes to 'friend'
  useEffect(() => {
    if (type === 'friend') {
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
      case 'suggestion':
        return (
          <TouchableOpacity
            onPress={() => onAddFriend?.(friend.id)}
            className="bg-primary rounded-lg px-3 py-2 flex-row items-center space-x-1"
          >
            <UserPlus size={16} color="white" />
            <Text className="text-white text-sm font-medium">Add</Text>
          </TouchableOpacity>
        );

      case 'request_received':
        return (
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => onAcceptFriend?.(friend.id)}
              className="bg-green-500 rounded-lg px-3 py-2 flex-row items-center space-x-1"
            >
              <UserCheck size={16} color="white" />
              <Text className="text-white text-sm font-medium">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeclineFriend?.(friend.id)}
              className="bg-gray-500 rounded-lg px-3 py-2"
            >
              <UserX size={16} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 'request_sent':
        return (
          <View className="bg-gray-200 rounded-lg px-3 py-2">
            <Text className="text-gray-600 text-sm">Pending</Text>
          </View>
        );

      case 'friend':
        return (
          <View className="flex-row space-x-2">
            {onMessage && (
              <TouchableOpacity
                onPress={() => onMessage?.(friend.id)}
                className="bg-primary rounded-lg px-3 py-2"
              >
                <MessageCircle size={16} color="white" />
              </TouchableOpacity>
            )}
            {onRemoveFriend && (
              <TouchableOpacity
                onPress={() => onRemoveFriend?.(friend.id)}
                className="bg-red-500 rounded-lg px-3 py-2"
              >
                <UserX size={16} color="white" />
              </TouchableOpacity>
            )}
            {!onMessage && !onRemoveFriend && (
              <Animated.View 
                style={{ transform: [{ scale: scaleAnim }] }}
                className="bg-green-500 rounded-lg px-3 py-2 flex-row items-center space-x-1"
              >
                <UserCheck size={16} color="white" />
                <Text className="text-white text-sm font-medium">Friends</Text>
              </Animated.View>
            )}
          </View>
        );
    }
  };

  return (
    <View className="bg-surface rounded-xl p-4 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="relative">
          {friend.avatar_url ? (
            <Image
              source={{ uri: friend.avatar_url }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
              <User size={24} color="#666" />
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
            {type === 'friend' && (
              <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-medium">Friend</Text>
              </View>
            )}
          </View>
          
          {type === 'suggestion' && friend.mutual_friends_count !== undefined && (
            <Text className="text-textSecondary text-sm">
              {friend.mutual_friends_count > 0
                ? `${friend.mutual_friends_count} mutual friends`
                : 'Suggested for you'}
            </Text>
          )}

          {type === 'friend' && (
            <View className="flex-row space-x-4 mt-1">
              {friend.current_streak !== undefined && (
                <Text className="text-textSecondary text-sm">
                  🔥 {friend.current_streak} day streak
                </Text>
              )}
              {friend.workouts_this_week !== undefined && (
                <Text className="text-textSecondary text-sm">
                  💪 {friend.workouts_this_week} workouts this week
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {renderActionButtons()}
    </View>
  );
}
