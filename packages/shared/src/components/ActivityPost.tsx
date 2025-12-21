import {
    Activity,
    Clock,
    Flame,
    Heart,
    MapPin,
    MessageCircle,
    MoreHorizontal,
    Share,
    Target,
    Trophy,
    Users
} from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ActivityPostProps {
  activity: {
    id: string;
    user_id: string;
    activity_type: string;
    created_at: string;
    user_profile?: {
      display_name?: string;
      avatar_url?: string;
    };
    club?: {
      name: string;
    };
    activity_data?: {
      workout_type?: string;
      duration?: number;
      notes?: string;
      calories_burned?: number;
    };
    visibility: string;
  };
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export function ActivityPost({ 
  activity, 
  onLike, 
  onComment, 
  onShare,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0
}: ActivityPostProps) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'gym_visit':
        return <Activity size={20} color="#10B981" />;
      case 'class_booking':
        return <Users size={20} color="#3B82F6" />;
      case 'achievement':
        return <Trophy size={20} color="#F59E0B" />;
      case 'workout':
        return <Target size={20} color="#EF4444" />;
      default:
        return <Activity size={20} color="#8B5CF6" />;
    }
  };

  const getActivityTitle = () => {
    switch (activity.activity_type) {
      case 'gym_visit':
        return 'Completed a workout';
      case 'class_booking':
        return 'Booked a class';
      case 'class_completion':
        return 'Completed a class';
      case 'achievement':
        return 'Earned an achievement';
      case 'workout':
        return 'Finished a workout';
      default:
        return 'Activity';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <View className="bg-surface rounded-xl p-4 mb-3">
      {/* User Info Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {activity.user_profile?.avatar_url ? (
            <Image
              source={{ uri: activity.user_profile.avatar_url }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-accentGray items-center justify-center">
              <Users size={20} color="#666" />
            </View>
          )}
          
          <View className="ml-3">
            <Text className="font-semibold text-textPrimary">
              {activity.user_profile?.display_name || 'User'}
            </Text>
            <Text className="text-textSecondary text-sm">
              {new Date(activity.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity>
          <MoreHorizontal size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Activity Content */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          {getActivityIcon()}
          <Text className="ml-2 font-semibold text-textPrimary">
            {getActivityTitle()}
          </Text>
        </View>

        {/* Location */}
        {activity.club?.name && (
          <View className="flex-row items-center mb-2">
            <MapPin size={16} color="#666" />
            <Text className="ml-2 text-textSecondary">{activity.club.name}</Text>
          </View>
        )}

        {/* Activity Details */}
        <View className="flex-row flex-wrap gap-3 mb-3">
          {activity.activity_data?.workout_type && (
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-sm font-medium">
                {activity.activity_data.workout_type}
              </Text>
            </View>
          )}
          
          {activity.activity_data?.duration && (
            <View className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
              <Clock size={14} color="#10B981" />
              <Text className="ml-1 text-green-700 text-sm font-medium">
                {formatDuration(activity.activity_data.duration)}
              </Text>
            </View>
          )}

          {activity.activity_data?.calories_burned && (
            <View className="flex-row items-center bg-orange-50 px-3 py-1 rounded-full">
              <Flame size={14} color="#F97316" />
              <Text className="ml-1 text-orange-700 text-sm font-medium">
                {activity.activity_data.calories_burned} cal
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {activity.activity_data?.notes && (
          <Text className="text-textPrimary leading-5">
            {activity.activity_data.notes}
          </Text>
        )}
      </View>

      {/* Engagement Stats */}
      {(likesCount > 0 || commentsCount > 0) && (
        <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-accentGray">
          <View className="flex-row space-x-4">
            {likesCount > 0 && (
              <Text className="text-textSecondary text-sm">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </Text>
            )}
            {commentsCount > 0 && (
              <Text className="text-textSecondary text-sm">
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={onLike}
          className="flex-row items-center space-x-2 flex-1 justify-center py-2"
        >
          <Heart size={18} color={isLiked ? "#EF4444" : "#666"} fill={isLiked ? "#EF4444" : "none"} />
          <Text className={`text-sm ${isLiked ? 'text-red-500' : 'text-textSecondary'}`}>
            Like
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onComment}
          className="flex-row items-center space-x-2 flex-1 justify-center py-2"
        >
          <MessageCircle size={18} color="#666" />
          <Text className="text-textSecondary text-sm">Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onShare}
          className="flex-row items-center space-x-2 flex-1 justify-center py-2"
        >
          <Share size={18} color="#666" />
          <Text className="text-textSecondary text-sm">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
