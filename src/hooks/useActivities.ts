import { UserActivity } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createActivity,
    createClassBookingActivity,
    createFriendActivity,
    createWorkoutActivity,
    deleteActivity,
    getActivityFeed,
    getActivityStreak,
    getFriendsActivities,
    getPublicActivities,
    getUserActivities,
    getUserActivityStats,
    updateActivityVisibility
} from "../lib/integrations/supabase/queries/activityQueries";

// ================================================
// ACTIVITY QUERY HOOKS
// ================================================

export const useUserActivities = (
  userId: string,
  filters?: {
    activity_type?: string;
    visibility?: string;
    limit?: number;
    include_friends?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["userActivities", userId, filters],
    queryFn: () => getUserActivities(userId, filters),
    enabled: !!userId,
  });
};

export const useFriendsActivities = (userId: string, limit: number = 20) => {
  return useQuery({
    queryKey: ["friendsActivities", userId, limit],
    queryFn: () => getFriendsActivities(userId, limit),
    enabled: !!userId,
  });
};

export const useActivityFeed = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ["activityFeed", userId, limit],
    queryFn: () => getActivityFeed(userId, limit),
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute for fresh activity data
  });
};

export const usePublicActivities = (limit: number = 20) => {
  return useQuery({
    queryKey: ["publicActivities", limit],
    queryFn: () => getPublicActivities(limit),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

export const useUserActivityStats = (
  userId: string,
  timeframe: 'week' | 'month' | 'year' = 'week'
) => {
  return useQuery({
    queryKey: ["userActivityStats", userId, timeframe],
    queryFn: () => getUserActivityStats(userId, timeframe),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useActivityStreak = (userId: string) => {
  return useQuery({
    queryKey: ["activityStreak", userId],
    queryFn: () => getActivityStreak(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// ================================================
// ACTIVITY MUTATION HOOKS
// ================================================

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityData: Omit<UserActivity, 'id' | 'created_at'>) =>
      createActivity(activityData),
    onSuccess: (newActivity) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["userActivities", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendsActivities"] });
      queryClient.invalidateQueries({ queryKey: ["userActivityStats", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityStreak", newActivity.user_id] });
      
      if (newActivity.visibility === 'public') {
        queryClient.invalidateQueries({ queryKey: ["publicActivities"] });
      }
    },
  });
};

export const useUpdateActivityVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, visibility }: { activityId: string; visibility: 'public' | 'friends' | 'private' }) =>
      updateActivityVisibility(activityId, visibility),
    onSuccess: () => {
      // Invalidate activity queries to reflect visibility changes
      queryClient.invalidateQueries({ queryKey: ["userActivities"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendsActivities"] });
      queryClient.invalidateQueries({ queryKey: ["publicActivities"] });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => deleteActivity(activityId),
    onSuccess: () => {
      // Invalidate all activity queries
      queryClient.invalidateQueries({ queryKey: ["userActivities"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendsActivities"] });
      queryClient.invalidateQueries({ queryKey: ["publicActivities"] });
      queryClient.invalidateQueries({ queryKey: ["userActivityStats"] });
    },
  });
};

// ================================================
// SPECIALIZED ACTIVITY HOOKS
// ================================================

export const useCreateWorkoutActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      workoutData,
      visibility = 'friends'
    }: {
      userId: string;
      workoutData: {
        club_id?: string;
        class_id?: string;
        workout_type: string;
        duration?: number;
        notes?: string;
      };
      visibility?: 'public' | 'friends' | 'private';
    }) => createWorkoutActivity(userId, workoutData, visibility),
    onSuccess: (newActivity) => {
      queryClient.invalidateQueries({ queryKey: ["userActivities", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userActivityStats", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityStreak", newActivity.user_id] });
    },
  });
};

export const useCreateClassBookingActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, classId, clubId }: { userId: string; classId: string; clubId: string }) =>
      createClassBookingActivity(userId, classId, clubId),
    onSuccess: (newActivity) => {
      queryClient.invalidateQueries({ queryKey: ["userActivities", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
  });
};

export const useCreateFriendActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, friendId }: { userId: string; friendId: string }) =>
      createFriendActivity(userId, friendId),
    onSuccess: (newActivity) => {
      queryClient.invalidateQueries({ queryKey: ["userActivities", newActivity.user_id] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
  });
};

// ================================================
// COMBINED HOOKS
// ================================================

export const useUserDashboard = (userId: string) => {
  const activities = useUserActivities(userId, { limit: 10 });
  const stats = useUserActivityStats(userId, 'week');
  const streak = useActivityStreak(userId);

  return {
    recentActivities: activities.data || [],
    weeklyStats: stats.data,
    currentStreak: streak.data || 0,
    isLoading: activities.isLoading || stats.isLoading || streak.isLoading,
    error: activities.error || stats.error || streak.error,
  };
};

export const useSocialFeed = (userId: string) => {
  const activityFeed = useActivityFeed(userId, 30);
  const friendsActivities = useFriendsActivities(userId, 20);

  return {
    feed: activityFeed.data || [],
    friendsOnly: friendsActivities.data || [],
    isLoading: activityFeed.isLoading || friendsActivities.isLoading,
    error: activityFeed.error || friendsActivities.error,
  };
};
