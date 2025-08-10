import { Clock, Heart, MapPin, MessageCircle, Share2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { OptimizedImage } from './OptimizedImage';

interface SocialWorkoutCardProps {
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
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onPress: () => void;
}

export const SocialWorkoutCard: React.FC<SocialWorkoutCardProps> = ({
  user,
  workout,
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  onPress,
}) => {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const workoutTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - workoutTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl p-4 mb-4 mx-4"
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden mr-3">
          {user.avatar_url ? (
            <OptimizedImage
              source={{ uri: user.avatar_url }}
              style={{ width: 48, height: 48 }}
            />
          ) : (
            <View className="w-full h-full bg-primary/20 items-center justify-center">
              <Text className="text-primary font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{user.name}</Text>
          <Text className="text-gray-400 text-sm">completed a workout</Text>
        </View>
        <Text className="text-gray-500 text-sm">{timeAgo(workout.timestamp)}</Text>
      </View>

      {/* Workout Content */}
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2">
            <Text className="text-primary text-xs font-bold">💪</Text>
          </View>
          <Text className="text-white font-bold text-lg">{workout.type}</Text>
        </View>
        
        <View className="flex-row items-center space-x-4 mb-3">
          <View className="flex-row items-center">
            <MapPin size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm ml-1">{workout.facility_name}</Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm ml-1">{workout.duration} min</Text>
          </View>
        </View>

        {workout.image_url && (
          <View className="rounded-xl overflow-hidden mb-3">
            <OptimizedImage
              source={{ uri: workout.image_url }}
              style={{ width: '100%', height: 200 }}
              className="bg-gray-800"
            />
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-800">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center space-x-2"
        >
          <Heart
            size={20}
            color={isLiked ? "#EF4444" : "#9CA3AF"}
            fill={isLiked ? "#EF4444" : "transparent"}
          />
          <Text className={`text-sm ${isLiked ? 'text-red-400' : 'text-gray-400'}`}>
            {likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onComment}
          className="flex-row items-center space-x-2"
        >
          <MessageCircle size={20} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm">{comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          className="flex-row items-center space-x-2"
        >
          <Share2 size={20} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm">Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
