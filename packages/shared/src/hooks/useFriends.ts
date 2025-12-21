import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    acceptFriendRequest,
    blockUser,
    getFilteredMemberProfiles,
    getFriends,
    getFriendshipStatus,
    getFriendsInClass,
    getFriendsInClub,
    getFriendSuggestions,
    getPendingFriendRequests,
    getSentFriendRequests,
    getSocialStats,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
    sendFriendRequest
} from "../lib/integrations/supabase/queries/friendQueries";

// ================================================
// PROFILES AND USER DISCOVERY HOOKS
// ================================================

export const useMemberProfiles = (currentUserId: string, searchQuery?: string) => {
  return useQuery({
    queryKey: ["memberProfiles", currentUserId, searchQuery],
    queryFn: () => getFilteredMemberProfiles(currentUserId, searchQuery),
    enabled: !!currentUserId,
  });
};

// ================================================
// FRIENDS IN ACTIVITIES HOOKS
// ================================================

export const useFriendsInClass = (userId: string, classId: string) => {
  return useQuery({
    queryKey: ["friendsInClass", userId, classId],
    queryFn: () => getFriendsInClass(userId, classId),
    enabled: !!userId && !!classId,
  });
};

export const useFriendsInClub = (userId: string, clubId: string) => {
  return useQuery({
    queryKey: ["friendsInClub", userId, clubId],
    queryFn: () => getFriendsInClub(userId, clubId),
    enabled: !!userId && !!clubId,
  });
};

// ================================================
// FRIENDS HOOKS
// ================================================

export const useFriends = (userId: string) => {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: () => getFriends(userId),
    enabled: !!userId,
  });
};

export const usePendingFriendRequests = (userId: string) => {
  return useQuery({
    queryKey: ["pendingFriendRequests", userId],
    queryFn: () => getPendingFriendRequests(userId),
    enabled: !!userId,
  });
};

export const useSentFriendRequests = (userId: string) => {
  return useQuery({
    queryKey: ["sentFriendRequests", userId],
    queryFn: () => getSentFriendRequests(userId),
    enabled: !!userId,
  });
};

export const useFriendSuggestions = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["friendSuggestions", userId, limit],
    queryFn: () => getFriendSuggestions(userId, limit),
    enabled: !!userId,
  });
};

export const useSocialStats = (userId: string) => {
  return useQuery({
    queryKey: ["socialStats", userId],
    queryFn: () => getSocialStats(userId),
    enabled: !!userId,
  });
};

export const useFriendshipStatus = (userId: string, otherUserId: string) => {
  return useQuery({
    queryKey: ["friendshipStatus", userId, otherUserId],
    queryFn: () => getFriendshipStatus(userId, otherUserId),
    enabled: !!userId && !!otherUserId,
  });
};

// ================================================
// FRIEND MUTATIONS
// ================================================

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, friendId }: { userId: string; friendId: string }) =>
      sendFriendRequest(userId, friendId),
    onSuccess: (_, { userId, friendId }) => {
      // Invalidate relevant queries - since we're bypassing pending, invalidate friends too
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["sentFriendRequests", userId] });
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus", userId, friendId] });
      queryClient.invalidateQueries({ queryKey: ["friendSuggestions", userId] });
      queryClient.invalidateQueries({ queryKey: ["memberProfiles", userId] });
      queryClient.invalidateQueries({ queryKey: ["socialStats", userId] });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: (friendship) => {
      // Invalidate relevant queries for both users
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["socialStats"] });
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["memberProfiles"] });
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["memberProfiles"] });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["socialStats"] });
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus"] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, friendId }: { userId: string; friendId: string }) =>
      blockUser(userId, friendId),
    onSuccess: (_, { userId, friendId }) => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["friendshipStatus", userId, friendId] });
    },
  });
};

// ================================================
// SEARCH HOOKS
// ================================================

export const useSearchUsers = (query: string, currentUserId: string) => {
  return useQuery({
    queryKey: ["searchUsers", query, currentUserId],
    queryFn: () => searchUsers(query, currentUserId),
    enabled: !!query && query.length >= 2 && !!currentUserId,
    staleTime: 30000, // Cache for 30 seconds
  });
};

// ================================================
// COMBINED SOCIAL HOOK
// ================================================

export const useSocialData = (userId: string) => {
  const friends = useFriends(userId);
  const pendingRequests = usePendingFriendRequests(userId);
  const suggestions = useFriendSuggestions(userId);
  const stats = useSocialStats(userId);

  return {
    friends: friends.data || [],
    pendingRequests: pendingRequests.data || [],
    suggestions: suggestions.data || [],
    stats: stats.data || { friend_count: 0, pending_requests: 0, activities_this_week: 0, streak_days: 0 },
    isLoading: friends.isLoading || pendingRequests.isLoading || suggestions.isLoading || stats.isLoading,
    error: friends.error || pendingRequests.error || suggestions.error || stats.error,
  };
};
