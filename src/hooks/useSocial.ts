import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

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

  // Friends Management
  const addFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement API call to add friend
      console.log('Adding friend:', friendId);
      Alert.alert('Success!', 'Friend request sent!');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement API call to remove friend
      console.log('Removing friend:', friendId);
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
    include_location: boolean;
    image_url?: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      // TODO: Implement API call to create workout post
      console.log('Sharing workout:', workoutData);
      
      // Mock success
      Alert.alert('Success!', 'Your workout has been shared!');
      return true;
    } catch (error) {
      console.error('Error sharing workout:', error);
      Alert.alert('Error', 'Failed to share workout');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      // TODO: Implement API call to like/unlike post
      console.log('Toggling like for post:', postId);
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }, [user]);

  const commentOnPost = useCallback(async (postId: string, comment: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // TODO: Implement API call to add comment
      console.log('Adding comment to post:', postId, comment);
      return true;
    } catch (error) {
      console.error('Error commenting on post:', error);
      Alert.alert('Error', 'Failed to add comment');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Challenges
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // TODO: Implement API call to join challenge
      console.log('Joining challenge:', challengeId);
      Alert.alert('Success!', 'You joined the challenge!');
      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', 'Failed to join challenge');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // TODO: Implement API call to leave challenge
      console.log('Leaving challenge:', challengeId);
      Alert.alert('Success!', 'You left the challenge');
      return true;
    } catch (error) {
      console.error('Error leaving challenge:', error);
      Alert.alert('Error', 'Failed to leave challenge');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createChallenge = useCallback(async (challengeData: {
    title: string;
    description: string;
    type: 'weekly' | 'monthly' | 'custom';
    target_value: number;
    end_date: string;
    reward?: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      // TODO: Implement API call to create challenge
      console.log('Creating challenge:', challengeData);
      Alert.alert('Success!', 'Challenge created!');
      return true;
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mock data functions (replace with real API calls)
  const getFriends = useCallback(async (): Promise<Friend[]> => {
    // TODO: Replace with real API call
    return [
      {
        id: '1',
        name: 'Emma Johnson',
        avatar_url: undefined,
        current_streak: 7,
        workouts_this_week: 4,
        is_online: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Mike Chen',
        avatar_url: undefined,
        current_streak: 12,
        workouts_this_week: 6,
        is_online: false,
        created_at: new Date().toISOString(),
      },
    ];
  }, []);

  const getFeed = useCallback(async (): Promise<WorkoutPost[]> => {
    // TODO: Replace with real API call
    return [
      {
        id: '1',
        user_id: '1',
        user: {
          name: 'Emma Johnson',
          avatar_url: undefined,
        },
        workout: {
          type: 'HIIT Training',
          facility_name: 'SATS Södermalm',
          duration: 45,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        caption: 'Great HIIT session today! Feeling energized 💪',
        likes_count: 12,
        comments_count: 3,
        is_liked_by_user: false,
        visibility: 'friends',
        created_at: new Date().toISOString(),
      },
    ];
  }, []);

  const getChallenges = useCallback(async (): Promise<Challenge[]> => {
    // TODO: Replace with real API call
    return [
      {
        id: '1',
        title: '30-Day Workout Challenge',
        description: 'Complete 30 workouts in 30 days',
        type: 'monthly',
        target_value: 30,
        current_progress: 15,
        participants_count: 24,
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        reward: 'Free massage session',
        is_participating: true,
        created_by: {
          name: 'SATS Fitness',
          avatar_url: undefined,
        },
      },
    ];
  }, []);

  return {
    loading,
    
    // Friends
    addFriend,
    removeFriend,
    getFriends,
    
    // Posts
    shareWorkout,
    likePost,
    commentOnPost,
    getFeed,
    
    // Challenges
    joinChallenge,
    leaveChallenge,
    createChallenge,
    getChallenges,
  };
};
