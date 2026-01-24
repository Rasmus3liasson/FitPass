import { MapPinIcon, UserIcon, UserMinusIcon, UserPlusIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/custom-colors';
import { UserProfileModal } from './UserProfileModal';

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
  const [showProfileModal, setShowProfileModal] = useState(false);

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
            className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 active:opacity-70"
            activeOpacity={0.7}
          >
            <UserPlusIcon size={18} color={colors.primary} weight="regular" />
          </TouchableOpacity>
        );

      case 'request_received':
        return (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => onAcceptFriend?.(friend.id)}
              className="bg-accentGreen/10 border border-accentGreen/20 rounded-xl px-4 py-2.5 flex-row items-center active:opacity-70"
              activeOpacity={0.7}
            >
              <UserPlusIcon size={18} color={colors.accentGreen} weight="regular" />
              <Text className="text-accentGreen text-sm font-semibold ml-2">Acceptera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeclineFriend?.(friend.id)}
              className="bg-surface border border-borderGray rounded-xl px-4 py-2.5 active:opacity-70"
              activeOpacity={0.7}
            >
              <UserMinusIcon size={18} color={colors.textSecondary} weight="regular" />
            </TouchableOpacity>
          </View>
        );

      case 'request_sent':
        return (
          <View className="flex-row gap-2 items-center">
            <View className="bg-accentYellow/10 border border-accentYellow/20 rounded-xl px-3 py-2 flex-row items-center">
              <Text className="text-accentYellow text-xs font-mediums">Väntar</Text>
            </View>
            {onRemoveFriend && (
              <TouchableOpacity
                onPress={() => onRemoveFriend?.(friend.id)}
                className="bg-surface border border-borderGray rounded-xl px-3 py-2 active:opacity-70"
                activeOpacity={0.7}
              >
                <UserMinusIcon size={18} color={colors.textSecondary} weight="regular" />
              </TouchableOpacity>
            )}
          </View>
        );

      case 'friend':
        return (
          <View className="flex-row gap-2">
            {onRemoveFriend && (
              <TouchableOpacity
                onPress={() => onRemoveFriend?.(friend.id)}
                className="bg-surface border border-borderGray rounded-xl px-4 py-2.5 active:opacity-70"
                activeOpacity={0.7}
              >
                <UserMinusIcon size={18} color={colors.textSecondary} weight="regular" />
              </TouchableOpacity>
            )}
            {!onMessage && !onRemoveFriend && (
              <Animated.View
                style={{ transform: [{ scale: scaleAnim }] }}
                className="bg-accentGreen/10 border border-accentGreen/20 rounded-xl px-4 py-2.5"
              >
                <UserPlusIcon size={18} color={colors.accentGreen} weight="regular" />
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
              <Image source={{ uri: friend.avatar_url }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-accentGray items-center justify-center">
                <UserIcon size={24} color={colors.textSecondary} />
              </View>
            )}
            {friend.is_online && (
              <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
            )}
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-textPrimary font-semibold text-base">{friend.name}</Text>
            </View>

            {type === 'suggestion' && friend.mutual_friends_count !== undefined && (
              <Text className="text-textSecondary text-sm">
                {friend.mutual_friends_count > 0
                  ? `${friend.mutual_friends_count} mutual friends`
                  : 'Förslag till dig'}
              </Text>
            )}

            {type === 'friend' && (
              <View className="mt-1">
                <View className="flex-row space-x-4">
                  {friend.current_streak !== undefined && (
                    <Text className="text-textSecondary text-sm">
                      {friend.current_streak} dagars streak
                    </Text>
                  )}
                  {friend.workouts_this_week !== undefined && (
                    <Text className="text-textSecondary text-sm">
                      {friend.workouts_this_week} träningar denna vecka
                    </Text>
                  )}
                </View>

                {/* Gym/Club Information */}
                {friend.profile_visibility !== false && friend.frequent_gym && (
                  <View className="flex-row items-center mt-1">
                    <MapPinIcon size={12} color={colors.textSecondary} />
                    <Text className="text-textSecondary text-xs ml-1">
                      Tränar ofta på {friend.frequent_gym.name}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity className="ml-2" onPress={(e) => e.stopPropagation()} activeOpacity={1}>
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
