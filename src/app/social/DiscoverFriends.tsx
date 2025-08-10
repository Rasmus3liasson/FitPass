import { OptimizedImage } from "@/src/components/OptimizedImage";
import { SimpleSearchBar } from "@/src/components/search/SimpleSearchBar";
import { MapPin, UserPlus, Users } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface SuggestedFriend {
  id: string;
  name: string;
  avatar_url?: string;
  mutual_friends: number;
  common_gym?: string;
  is_online: boolean;
  bio?: string;
}

interface DiscoverFriendsProps {
  suggestedFriends: SuggestedFriend[];
  onAddFriend: (friendId: string) => void;
  onSearchFriends: (query: string) => void;
}

export const DiscoverFriends: React.FC<DiscoverFriendsProps> = ({
  suggestedFriends,
  onAddFriend,
  onSearchFriends,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearchFriends(query);
  };

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Search */}
      <SimpleSearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        onSearch={handleSearch}
        placeholder="Search for friends..."
      />

      {/* Suggested Friends */}
      <Text className="text-textPrimary font-bold text-lg mb-4 mt-6">
        People You May Know
      </Text>

      {suggestedFriends.map((friend) => (
        <View key={friend.id} className="bg-surface rounded-2xl p-4 mb-3">
          <View className="flex-row items-start">
            {/* Avatar */}
            <View className="relative mr-4">
              <View className="w-16 h-16 rounded-full bg-accentGray overflow-hidden">
                {friend.avatar_url ? (
                  <OptimizedImage
                    source={{ uri: friend.avatar_url }}
                    style={{ width: 64, height: 64 }}
                  />
                ) : (
                  <View className="w-full h-full bg-primary/20 items-center justify-center">
                    <Text className="text-primary font-bold text-xl">
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              {friend.is_online && (
                <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-accentGreen border-2 border-surface rounded-full" />
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-lg mb-1">
                {friend.name}
              </Text>

              {friend.bio && (
                <Text className="text-textSecondary text-sm mb-2 leading-relaxed">
                  {friend.bio}
                </Text>
              )}

              <View className="flex-row items-center space-x-4 mb-3">
                {friend.mutual_friends > 0 && (
                  <View className="flex-row items-center">
                    <Users size={14} color="#A0A0A0" />
                    <Text className="text-textSecondary text-sm ml-1">
                      {friend.mutual_friends} mutual friend
                      {friend.mutual_friends !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}

                {friend.common_gym && (
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#A0A0A0" />
                    <Text className="text-textSecondary text-sm ml-1">
                      {friend.common_gym}
                    </Text>
                  </View>
                )}
              </View>

              {/* Add Friend Button */}
              <TouchableOpacity
                onPress={() => onAddFriend(friend.id)}
                className="bg-primary rounded-xl py-2 px-4 flex-row items-center justify-center self-start"
              >
                <UserPlus size={16} color="#FFFFFF" />
                <Text className="text-textPrimary font-medium ml-2">
                  Add Friend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* Empty State */}
      {suggestedFriends.length === 0 && (
        <View className="items-center py-12">
          <View className="w-20 h-20 bg-accentGray rounded-full items-center justify-center mb-4">
            <Users size={32} color="#A0A0A0" />
          </View>
          <Text className="text-textSecondary text-center text-lg mb-2">
            No suggestions yet
          </Text>
          <Text className="text-borderGray text-center text-sm">
            Try searching for friends or visit more gyms to get personalized
            suggestions
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
