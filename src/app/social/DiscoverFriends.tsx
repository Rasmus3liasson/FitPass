import { FriendCard } from "@/components/FriendCard";
import SearchBarComponent from "@/src/components/SearchBarComponent";
import { useAuth } from "@/src/hooks/useAuth";
import {
  useAcceptFriendRequest,
  useFriends,
  useMemberProfiles,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
} from "@/src/hooks/useFriends";
import { useNotifications } from "@/src/hooks/useNotifications";
import { RefreshCw, UserPlus, Users } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  // Keep for backwards compatibility, but we'll use real data from hooks
  suggestedFriends?: SuggestedFriend[];
  onAddFriend?: (friendId: string) => void;
  onSearchFriends?: (query: string) => void;
}

export const DiscoverFriends: React.FC<DiscoverFriendsProps> = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<
    "suggestions" | "friends" | "requests"
  >("suggestions");
  const [refreshing, setRefreshing] = useState(false);
  const [recentlyAddedFriends, setRecentlyAddedFriends] = useState<Set<string>>(
    new Set()
  );
  const spinValue = useState(new Animated.Value(0))[0];

  // Animated rotation for refresh button
  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [refreshing, spinValue]);

  // Real data hooks - always call hooks before any early returns
  const friends = useFriends(user?.id || "");
  const memberProfiles = useMemberProfiles(user?.id || "", searchQuery);
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const rejectFriendRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const { sendFriendRequestNotification, sendFriendAcceptedNotification } =
    useNotifications();

  // Return early if no user
  if (!user?.id) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-textSecondary text-lg">
          Please log in to see friends
        </Text>
      </View>
    );
  }

  // Filter suggestions based on search - show ALL people with friend status
  const filteredSuggestions = useMemo(() => {
    const profiles = (memberProfiles.data || []).filter(
      (profile) => profile.id !== user?.id
    ); // Exclude self

    const friendIds = new Set(
      friends.data
        ?.filter((f) => f.status === "accepted")
        ?.map((f) => (f.friend_id === user?.id ? f.user_id : f.friend_id)) || []
    );

    const pendingFriendIds = new Set(
      friends.data
        ?.filter((f) => f.status === "pending")
        .map((f) => (f.friend_id === user?.id ? f.user_id : f.friend_id)) || []
    );

    // Add friend status to each profile first
    const profilesWithStatus = profiles.map((profile) => ({
      ...profile,
      isFriend: friendIds.has(profile.id),
      isPending: pendingFriendIds.has(profile.id),
      isRecentlyAdded: recentlyAddedFriends.has(profile.id),
    }));

    // Apply search filter if there's a search query
    const filteredBySearch = profilesWithStatus.filter((profile) => {
      if (!searchQuery) return true; // Show all if no search

      const name =
        profile.display_name ||
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Always show everyone in suggestions - whether searching or not
    return filteredBySearch;
  }, [
    memberProfiles.data,
    friends.data,
    user?.id,
    searchQuery,
    recentlyAddedFriends,
  ]);

  // Separate friends by status
  const friendsData = useMemo(() => {
    if (!friends.data) return { accepted: [], pending: [], sent: [] };

    return {
      accepted: friends.data.filter((f) => f.status === "accepted"),
      pending: friends.data.filter(
        (f) => f.status === "pending" && f.friend_id === user?.id
      ), // Requests received
      sent: friends.data.filter(
        (f) => f.status === "pending" && f.user_id === user?.id
      ), // Requests sent
    };
  }, [friends.data, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([friends.refetch(), memberProfiles.refetch()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    }
    setRefreshing(false);
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    try {
      // Immediately add to recently added friends for UI feedback
      setRecentlyAddedFriends((prev) => new Set(prev).add(friendId));

      await sendFriendRequest.mutateAsync({ userId: user.id, friendId });

      // Get friend's name for notification
      const friendProfile = filteredSuggestions.find((p) => p.id === friendId);
      const friendName =
        friendProfile?.display_name ||
        `${friendProfile?.first_name || ""} ${
          friendProfile?.last_name || ""
        }`.trim() ||
        "Someone";
      
      const currentUserName = user.user_metadata?.display_name || 
        `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() || 
        "Someone";

      // Check if production mode - send friend request notification or friend accepted
      const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
      
      if (isProduction) {
        // In production, send a friend request notification to the recipient
        await sendFriendRequestNotification(currentUserName, friendId);
      } else {
        // In development, they're friends immediately, so send accepted notification
        await sendFriendAcceptedNotification(friendName, friendId);
      }

      // Friend added successfully - the UI will automatically update due to the mutation
      // Clear from recently added after a delay to let the real data take over
      setTimeout(() => {
        setRecentlyAddedFriends((prev) => {
          const newSet = new Set(prev);
          newSet.delete(friendId);
          return newSet;
        });
      }, 5000); // 5 seconds delay to give more time to see the status change
    } catch (error) {
      console.error("Error adding friend:", error);
      // Remove from recently added if there was an error
      setRecentlyAddedFriends((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      await acceptFriendRequest.mutateAsync(friendshipId);

      // Find the friend request to get user info for notification
      const request = friendsData.pending.find((r) => r.id === friendshipId);
      if (request && request.user_profile) {
        const currentUserName = user?.user_metadata?.display_name || 
          `${user?.user_metadata?.first_name || ""} ${user?.user_metadata?.last_name || ""}`.trim() || 
          "Someone";
        
        // Send notification to the person who sent the request that it was accepted
        await sendFriendAcceptedNotification(currentUserName, request.user_id);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    try {
      await rejectFriendRequest.mutateAsync(friendshipId);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await removeFriend.mutateAsync(friendshipId);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Section Tabs */}
      <View className="flex-row bg-surface rounded-xl p-1 mb-6">
        <TouchableOpacity
          onPress={() => setActiveSection("suggestions")}
          className={`flex-1 py-3 rounded-lg items-center ${
            activeSection === "suggestions" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`font-medium ${
              activeSection === "suggestions"
                ? "text-textPrimary"
                : "text-textSecondary"
            }`}
          >
            Upptäck
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSection("friends")}
          className={`flex-1 py-3 rounded-lg items-center ${
            activeSection === "friends" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`font-medium ${
              activeSection === "friends"
                ? "text-textPrimary"
                : "text-textSecondary"
            }`}
          >
            Vänner ({friendsData.accepted.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSection("requests")}
          className={`flex-1 py-3 rounded-lg items-center relative ${
            activeSection === "requests" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`font-medium ${
              activeSection === "requests"
                ? "text-textPrimary"
                : "text-textSecondary"
            }`}
          >
            Förfrågningar
          </Text>
          {friendsData.pending.length > 0 && (
            <View className="absolute -top-1 -right-1 bg-accentRed rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-textPrimary text-xs font-bold">
                {friendsData.pending.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content based on active section */}
      {activeSection === "suggestions" && (
        <View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-textPrimary font-bold text-lg">
              Föreslagna Vänner
            </Text>
            <TouchableOpacity
              onPress={() => onRefresh()}
              disabled={refreshing}
              className={`${refreshing ? "opacity-75" : ""}`}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <RefreshCw size={20} color="#666" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          {/* Search */}
          <View className="mb-4">
            <SearchBarComponent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </View>

          {memberProfiles.isLoading ? (
            <View className="items-center py-8">
              <Text className="text-textSecondary">Laddar förslag...</Text>
            </View>
          ) : filteredSuggestions.length === 0 ? (
            <View className="items-center py-8">
              <UserPlus size={48} color="#ccc" />
              <Text className="text-textSecondary text-center mt-4 text-lg">
                {searchQuery
                  ? "Inga personer hittades"
                  : "Inga förslag tillgängliga"}
              </Text>
              <Text className="text-textSecondary text-center mt-2">
                {searchQuery
                  ? "Prova en annan sökterm"
                  : "Kom tillbaka senare för nya förslag"}
              </Text>
            </View>
          ) : (
            filteredSuggestions.map((person: any) => (
              <View key={person.id} className="mb-3">
                <FriendCard
                  friend={{
                    id: person.id,
                    name:
                      person.display_name ||
                      `${person.first_name || ""} ${
                        person.last_name || ""
                      }`.trim() ||
                      "User",
                    avatar_url: person.avatar_url,
                    mutual_friends_count: 0, // Not calculated from profiles table
                  }}
                  type={
                    person.isFriend || person.isRecentlyAdded
                      ? "friend"
                      : person.isPending
                      ? "request_sent"
                      : "suggestion"
                  }
                  onAddFriend={
                    person.isFriend ||
                    person.isPending ||
                    person.isRecentlyAdded
                      ? undefined
                      : handleAddFriend
                  }
                  onRemoveFriend={undefined} // Friends can only be removed from the "Vänner" tab
                />
              </View>
            ))
          )}
        </View>
      )}

      {activeSection === "friends" && (
        <View>
          <Text className="text-textPrimary font-bold text-lg mb-4">
            Mina Vänner ({friendsData.accepted.length})
          </Text>

          {friends.isLoading ? (
            <View className="items-center py-8">
              <Text className="text-textSecondary">Laddar vänner...</Text>
            </View>
          ) : friendsData.accepted.length === 0 ? (
            <View className="items-center py-8">
              <Users size={48} color="#ccc" />
              <Text className="text-textSecondary text-center mt-4 text-lg">
                Inga vänner än
              </Text>
              <Text className="text-textSecondary text-center mt-2">
                Börja lägga till vänner för att bygga din träningsgemenskap!
              </Text>
              <TouchableOpacity
                onPress={() => setActiveSection("suggestions")}
                className="bg-primary rounded-lg px-6 py-3 mt-4"
              >
                <Text className="text-textPrimary font-medium">
                  Hitta Vänner
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            friendsData.accepted.map((friend) => {
              // Safely extract friend data with fallbacks
              const friendData =
                friend.friend_id === user?.id
                  ? friend.user_profile
                  : friend.friend_profile;

              // Ensure we have basic data even if profile is missing
              const safeFriendData = {
                id:
                  friendData?.id ||
                  friend.friend_id ||
                  friend.user_id ||
                  friend.id,
                name: friendData?.display_name || "User",
                avatar_url: friendData?.avatar_url || undefined,
              };

              return (
                <View key={friend.id} className="mb-3">
                  <FriendCard
                    friend={{
                      id: safeFriendData.id,
                      name: safeFriendData.name,
                      avatar_url: safeFriendData.avatar_url,
                      is_online: Math.random() > 0.5, // TODO: Implement real online status
                    }}
                    type="friend"
                    onMessage={() => {
                      /* TODO: Implement message functionality */
                    }}
                    onRemoveFriend={() => handleRemoveFriend(friend.id)}
                  />
                </View>
              );
            })
          )}
        </View>
      )}

      {activeSection === "requests" && (
        <View>
          {/* Header with badge */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Text className="text-textPrimary font-bold text-xl">
                Vänförfrågningar
              </Text>
              {friendsData.pending.length > 0 && (
                <View className="ml-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full px-3 py-1 shadow-lg">
                  <Text className="text-white text-sm font-bold">
                    {friendsData.pending.length}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {friends.isLoading ? (
            <View className="items-center py-12">
              <Text className="text-textSecondary">
                Laddar förfrågningar...
              </Text>
            </View>
          ) : friendsData.pending.length === 0 ? (
            <View className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 items-center border-2 border-blue-100">
              <View className="bg-white rounded-full p-4 mb-4 shadow-md">
                <Users size={48} color="#6366f1" strokeWidth={1.5} />
              </View>
              <Text className="text-gray-800 text-center font-bold text-lg mb-2">
                Inga vänförfrågningar
              </Text>
              <Text className="text-gray-600 text-center leading-6">
                Vänförfrågningar kommer att visas här när någon vill ansluta med dig
              </Text>
              <TouchableOpacity
                onPress={() => setActiveSection("suggestions")}
                className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl px-6 py-3 mt-6 shadow-lg"
                style={{
                  shadowColor: "#6366f1",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold">Upptäck vänner</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Info banner */}
              <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4 flex-row items-start">
                <View className="bg-blue-500 rounded-full p-1 mr-3 mt-0.5">
                  <Text className="text-white text-xs font-bold">ℹ️</Text>
                </View>
                <Text className="text-blue-800 flex-1 leading-5">
                  Godkänn förfrågningar för att ansluta med nya vänner och se deras aktiviteter
                </Text>
              </View>

              {/* Requests list */}
              {friendsData.pending.map((request) => {
                // Safely extract request data with fallbacks
                const requestData = request.user_profile;
                const safeRequestData = {
                  id: requestData?.id || request.user_id || request.id,
                  name: requestData?.display_name || "User",
                  avatar_url: requestData?.avatar_url || undefined,
                };

                return (
                  <View key={request.id} className="mb-3">
                    <FriendCard
                      friend={{
                        id: safeRequestData.id,
                        name: safeRequestData.name,
                        avatar_url: safeRequestData.avatar_url,
                        status: request.status,
                      }}
                      type="request_received"
                      onAcceptFriend={() => handleAcceptFriend(request.id)}
                      onDeclineFriend={() => handleRejectFriend(request.id)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};
