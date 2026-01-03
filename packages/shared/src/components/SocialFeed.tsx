import colors from '@shared/constants/custom-colors';
import { Plus, Search, TrendingUp, Trophy, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { SocialWorkoutCard } from './SocialWorkoutCard';

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
  current_streak: number;
  workouts_this_week: number;
  is_online: boolean;
}

interface WorkoutPost {
  id: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  workout: {
    type: string;
    facility_name: string;
    duration: number;
    timestamp: string;
    image_url?: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface SocialFeedProps {
  friends: Friend[];
  workoutPosts: WorkoutPost[];
  onAddFriend: () => void;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string) => void;
  onSharePost: (postId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  friends,
  workoutPosts,
  onAddFriend,
  onLikePost,
  onCommentPost,
  onSharePost,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'leaderboard'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendCard = (friend: Friend) => (
    <View key={friend.id} className="bg-surface rounded-xl p-4 mr-3 min-w-[160px]">
      <View className="items-center">
        <View className="relative mb-3">
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
            <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
          )}
        </View>
        <Text className="text-textPrimary font-semibold text-sm text-center mb-1">
          {friend.name}
        </Text>
        <Text className="text-primary text-xs font-bold mb-1">
          🔥 {friend.current_streak} day streak
        </Text>
        <Text className="text-textSecondary text-xs">
          {friend.workouts_this_week} workouts this week
        </Text>
      </View>
    </View>
  );

  const renderLeaderboardItem = (friend: Friend, index: number) => (
    <View key={friend.id} className="flex-row items-center p-4 bg-surface rounded-xl mb-3">
      <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
        <Text className="text-textPrimary font-bold text-sm">{index + 1}</Text>
      </View>
      <View className="w-12 h-12 rounded-full bg-accentGray overflow-hidden mr-3">
        {friend.avatar_url ? (
          <OptimizedImage
            source={{ uri: friend.avatar_url }}
            style={{ width: 48, height: 48 }}
          />
        ) : (
          <View className="w-full h-full bg-primary/20 items-center justify-center">
            <Text className="text-primary font-bold text-lg">
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-textPrimary font-semibold">{friend.name}</Text>
        <Text className="text-textSecondary text-sm">{friend.workouts_this_week} workouts</Text>
      </View>
      <View className="items-end">
        <Text className="text-primary font-bold text-lg">{friend.current_streak}</Text>
        <Text className="text-textSecondary text-xs">day streak</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {/* Tab Navigation */}
      <View className="flex-row bg-surface/50 rounded-xl mx-4 mb-4 p-1">
        {[
          { key: 'feed', label: 'Feed', icon: TrendingUp },
          { key: 'friends', label: 'Friends', icon: Users },
          { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key as any)}
            className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
              activeTab === key ? 'bg-primary' : ''
            }`}
          >
            <Icon
              size={16}
              color={activeTab === key ? '#FFFFFF' : 'colors.borderGray'}
            />
            <Text
              className={`ml-2 font-medium ${
                activeTab === key ? 'text-textPrimary' : 'text-textSecondary'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'feed' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View className="px-4 mb-4">
            <TouchableOpacity className="bg-surface rounded-xl p-4 border-2 border-dashed border-accentGray">
              <View className="flex-row items-center justify-center">
                <Plus size={20} color={colors.borderGray} />
                <Text className="text-textSecondary ml-2 font-medium">Share your workout</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Friends Activity Bar */}
          <View className="mb-6">
            <Text className="text-textPrimary font-bold text-lg px-4 mb-3">Friends Activity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              <TouchableOpacity
                onPress={onAddFriend}
                className="bg-surface rounded-xl p-4 mr-3 min-w-[160px] border-2 border-dashed border-accentGray"
              >
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-3">
                    <Plus size={24} color={colors.primary} />
                  </View>
                  <Text className="text-primary font-semibold text-sm">Add Friends</Text>
                </View>
              </TouchableOpacity>
              {friends.slice(0, 5).map(renderFriendCard)}
            </ScrollView>
          </View>

          {/* Workout Feed */}
          <View className="mb-4">
            <Text className="text-textPrimary font-bold text-lg px-4 mb-3">Recent Workouts</Text>
            {workoutPosts.map((post) => (
              <SocialWorkoutCard
                key={post.id}
                {...post}
                onLike={() => onLikePost(post.id)}
                onComment={() => onCommentPost(post.id)}
                onShare={() => onSharePost(post.id)}
                onPress={() => {}}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === 'friends' && (
        <View className="flex-1 px-4">
          {/* Search */}
          <View className="relative mb-4">
            <Search size={20} color={colors.borderGray} className="absolute left-4 top-3 z-10" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Sök efter vänner"
              placeholderTextColor={colors.borderGray}
              className="bg-surface rounded-xl pl-12 pr-4 py-3 text-textPrimary"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredFriends.map(renderFriendCard)}
          </ScrollView>
        </View>
      )}

      {activeTab === 'leaderboard' && (
        <View className="flex-1 px-4">
          <Text className="text-textSecondary text-center mb-4">This Week's Top Performers</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {friends
              .sort((a, b) => b.workouts_this_week - a.workouts_this_week)
              .map((friend, index) => renderLeaderboardItem(friend, index))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
