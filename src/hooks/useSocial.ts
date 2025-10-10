import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useActivityFeed, useCreateWorkoutActivity } from './useActivities';
import { useAuth } from './useAuth';
import { useFriends, useFriendSuggestions, useSendFriendRequest } from './useFriends';
import { useNewsForUser } from './useNews';

export interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
  current_streak: number;
  workouts_this_week: number;
  is_online: boolean;
  created_at: string;
}

export interface WorkoutPost {
  id: string;
  user_id: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  workout: {
    type: string;
    facility_name: string;
    facility_id?: string;
    duration: number;
    timestamp: string;
    image_url?: string;
    notes?: string;
  };
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'custom';
  target_value: number;
  current_progress: number;
  participants_count: number;
  end_date: string;
  reward?: string;
  is_participating: boolean;
  created_by: {
    name: string;
    avatar_url?: string;
  };
}

export const useSocial = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Use the new hooks for real data
  const friends = useFriends(user?.id || "");
  const friendSuggestions = useFriendSuggestions(user?.id || "");
  const news = useNewsForUser(user?.id || "");
  const activityFeed = useActivityFeed(user?.id || "");
  
  // Mutations
  const sendFriendRequestMutation = useSendFriendRequest();
  const createWorkoutMutation = useCreateWorkoutActivity();

  // Friends Management
  const addFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await sendFriendRequestMutation.mutateAsync({ userId: user.id, friendId });
      Alert.alert('Success!', 'Friend request sent!');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  }, [user, sendFriendRequestMutation]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement remove friend mutation
      Alert.alert('Success!', 'Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Workout Posts
  const shareWorkout = useCallback(async (workoutData: {
    workout_type: string;
    facility_name: string;
    facility_id?: string;
    duration: number;
    caption: string;
    visibility: 'public' | 'friends' | 'private';
    notes?: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      await createWorkoutMutation.mutateAsync({
        userId: user.id,
        workoutData: {
          club_id: workoutData.facility_id,
          workout_type: workoutData.workout_type,
          duration: workoutData.duration,
          notes: `${workoutData.caption}\n${workoutData.notes || ''}`.trim()
        },
        visibility: workoutData.visibility
      });
      Alert.alert('Success!', 'Workout shared!');
    } catch (error) {
      console.error('Error sharing workout:', error);
      Alert.alert('Error', 'Failed to share workout');
    } finally {
      setLoading(false);
    }
  }, [user, createWorkoutMutation]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      // TODO: Implement API call to like post
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, [user]);

  const commentOnPost = useCallback(async (postId: string, comment: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement API call to comment on post
      Alert.alert('Success!', 'Comment added!');
    } catch (error) {
      console.error('Error commenting on post:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Achievement system
  const completeWorkout = useCallback(async (workoutData: {
    type: string;
    duration: number;
    facility_name: string;
    facility_id?: string;
    calories_burned?: number;
    notes?: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      await createWorkoutMutation.mutateAsync({
        userId: user.id,
        workoutData: {
          club_id: workoutData.facility_id,
          workout_type: workoutData.type,
          duration: workoutData.duration,
          notes: workoutData.notes
        },
        visibility: 'friends'
      });
      
      // Mock achievement check
      const achievements = ['First Workout', 'Week Streak', 'Month Milestone'];
      const newAchievement = achievements[Math.floor(Math.random() * achievements.length)];
      
      Alert.alert('Workout Complete!', `Congratulations! You earned: ${newAchievement}`);
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  }, [user, createWorkoutMutation]);

  // Challenge system
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement API call to join challenge
      Alert.alert('Success!', 'Challenge joined!');
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', 'Failed to join challenge');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement API call to leave challenge
      Alert.alert('Success!', 'Left challenge');
    } catch (error) {
      console.error('Error leaving challenge:', error);
      Alert.alert('Error', 'Failed to leave challenge');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get real data functions
  const getFriends = useCallback(async (): Promise<Friend[]> => {
    return (friends.data || []).map(friend => ({
      id: friend.friend_profile?.id || friend.user_profile?.id || '',
      name: friend.friend_profile?.display_name || friend.user_profile?.display_name || 'User',
      avatar_url: friend.friend_profile?.avatar_url || friend.user_profile?.avatar_url,
      current_streak: 0, // TODO: Calculate from activities
      workouts_this_week: 0, // TODO: Calculate from activities
      is_online: Math.random() > 0.5, // TODO: Implement real online status
      created_at: friend.created_at
    }));
  }, [friends.data]);

  const getFeed = useCallback(async (): Promise<WorkoutPost[]> => {
    return (activityFeed.data || []).map(activity => ({
      id: activity.id,
      user_id: activity.user_id,
      user: {
        name: activity.user_profile?.display_name || 'User',
        avatar_url: activity.user_profile?.avatar_url
      },
      workout: {
        type: activity.activity_data?.workout_type || activity.activity_type,
        facility_name: activity.club?.name || 'Gym',
        facility_id: activity.club_id,
        duration: activity.activity_data?.duration || 60,
        timestamp: activity.created_at,
        notes: activity.activity_data?.notes
      },
      caption: activity.activity_data?.notes || '',
      likes_count: 0, // TODO: Implement likes
      comments_count: 0, // TODO: Implement comments
      is_liked_by_user: false, // TODO: Implement likes
      visibility: activity.visibility,
      created_at: activity.created_at
    }));
  }, [activityFeed.data]);

  const getChallenges = useCallback(async (): Promise<Challenge[]> => {
    // TODO: Implement challenges table and queries
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: 'January Fitness Challenge',
        description: 'Complete 20 workouts this month and win exclusive FitPass gear!',
        type: 'monthly',
        target_value: 20,
        current_progress: 12,
        participants_count: 156,
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        reward: 'FitPass Premium Gear',
        is_participating: true,
        created_by: {
          name: 'FitPass Team',
          avatar_url: undefined,
        },
      },
      {
        id: '2',
        title: 'Weekend Warrior',
        description: 'Work out both Saturday and Sunday this weekend!',
        type: 'weekly',
        target_value: 2,
        current_progress: 1,
        participants_count: 89,
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        reward: '50 bonus credits',
        is_participating: false,
        created_by: {
          name: 'SATS Södermalm',
          avatar_url: undefined,
        },
      },
    ];
    
    return mockChallenges;
  }, []);

  return {
    loading,
    addFriend,
    removeFriend,
    shareWorkout,
    likePost,
    commentOnPost,
    completeWorkout,
    joinChallenge,
    leaveChallenge,
    getFriends,
    getFeed,
    getChallenges,
    // Real data from hooks
    friends: friends.data || [],
    friendSuggestions: friendSuggestions.data || [],
    news: news.news || [],
    activityFeed: activityFeed.data || [],
    unreadNewsCount: news.unreadCount || 0,
    // Loading states
    friendsLoading: friends.isLoading,
    suggestionsLoading: friendSuggestions.isLoading,
    newsLoading: news.isLoading,
    feedLoading: activityFeed.isLoading
  };
};
