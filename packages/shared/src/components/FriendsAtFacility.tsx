import colors from "../../constants/custom-colors";
import { FriendWhoFavoritedClub } from "../types";
import { Users } from "lucide-react-native";
import React from "react";
import { Image, Text, View } from "react-native";

interface FriendsAtFacilityProps {
  friends: FriendWhoFavoritedClub[];
}

export const FriendsAtFacility: React.FC<FriendsAtFacilityProps> = ({
  friends,
}) => {
  if (!friends || friends.length === 0) {
    return null;
  }

  const displayFriends = friends.slice(0, 3);
  const remainingCount = Math.max(0, friends.length - 3);

  // Helper to get initials
  const getInitials = (friend: FriendWhoFavoritedClub) => {
    const name =
      friend.profiles?.display_name || friend.profiles?.first_name || "?";
    return name[0].toUpperCase();
  };

  return (
    <View className="bg-surface rounded-xl p-4 mb-6">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-2">
          <Users size={16} color={colors.primary} />
        </View>
        <Text className="text-textPrimary font-semibold text-base">
          {friends.length === 1
            ? "1 vän tränar här"
            : `${friends.length} vänner tränar här`}
        </Text>
      </View>

      {/* Avatars and Text */}
      <View className="flex-row items-center">
        {/* Avatar Stack */}
        <View className="flex-row mr-3">
          {displayFriends.map((friend, index) => (
            <View
              key={friend.user_id}
              className="w-10 h-10 rounded-full border-2 border-surface overflow-hidden items-center justify-center"
              style={{
                marginLeft: index > 0 ? -8 : 0,
                zIndex: 3 - index,
                backgroundColor: friend.profiles?.avatar_url
                  ? "transparent"
                  : colors.primary + "40", // slightly transparent for initials
              }}
            >
              {friend.profiles?.avatar_url ? (
                <Image
                  source={{ uri: friend.profiles.avatar_url }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white text-xs font-bold">
                  {getInitials(friend)}
                </Text>
              )}
            </View>
          ))}

          {/* Remaining count */}
          {remainingCount > 0 && (
            <View
              className="w-10 h-10 rounded-full border-2 border-surface items-center justify-center bg-primary/20"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              <Text className="text-primary text-xs font-bold">
                +{remainingCount}
              </Text>
            </View>
          )}
        </View>

        {/* Friend Names */}
        <View className="flex-1">
          <Text className="text-textSecondary text-sm" numberOfLines={1}>
            {displayFriends
              .map(
                (f) =>
                  f.profiles?.display_name ||
                  f.profiles?.first_name ||
                  "Vän"
              )
              .join(", ")}
            {remainingCount > 0 && ` och ${remainingCount} till`}
          </Text>
        </View>
      </View>
    </View>
  );
};
