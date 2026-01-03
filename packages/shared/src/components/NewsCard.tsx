import colors from '@shared/constants/custom-colors';
import { Calendar, MapPin, MessageCircle, Users } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface NewsCardProps {
  news: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    type: string;
    club_name?: string;
    class_name?: string;
    author_name?: string;
    image_url?: string;
    action_text?: string;
    published_at: string;
    viewed_by_user?: boolean;
  };
  onPress?: () => void;
  onAction?: () => void;
}

export function NewsCard({ news, onPress, onAction }: NewsCardProps) {
  const getTypeIcon = () => {
    switch (news.type) {
      case 'new_class':
        return <Calendar size={16} color={colors.accentGreen} />;
      case 'event':
        return <Calendar size={16} color={colors.accentBlue} />;
      case 'promotion':
        return <Users size={16} color={colors.accentYellow} />;
      default:
        return <MessageCircle size={16} color={colors.accentPurple} />;
    }
  };

  const getTypeColor = () => {
    switch (news.type) {
      case 'new_class':
        return 'bg-green-100 text-green-700';
      case 'event':
        return 'bg-blue-100 text-blue-700';
      case 'promotion':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`bg-surface rounded-xl p-4 mb-3 ${!news.viewed_by_user ? 'border-l-4 border-primary' : ''}`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            {getTypeIcon()}
            <Text className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${getTypeColor()}`}>
              {news.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          <Text className="text-lg font-bold text-textPrimary mb-1" numberOfLines={2}>
            {news.title}
          </Text>
          
          {news.description && (
            <Text className="text-textSecondary text-sm" numberOfLines={2}>
              {news.description}
            </Text>
          )}
        </View>

        {news.image_url && (
          <Image
            source={{ uri: news.image_url }}
            className="w-16 h-16 rounded-lg ml-3"
          />
        )}
      </View>

      {/* Metadata */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-3">
          {news.club_name && (
            <View className="flex-row items-center">
              <MapPin size={14} color={colors.textSecondary} />
              <Text className="text-textSecondary text-sm ml-1">{news.club_name}</Text>
            </View>
          )}
          
          <Text className="text-textSecondary text-sm">
            {new Date(news.published_at).toLocaleDateString()}
          </Text>
        </View>

        {!news.viewed_by_user && (
          <View className="w-2 h-2 bg-primary rounded-full" />
        )}
      </View>

      {/* Action Button */}
      {news.action_text && onAction && (
        <TouchableOpacity 
          onPress={onAction}
          className="bg-primary rounded-lg py-2 px-4 self-start"
        >
          <Text className="text-textPrimary font-medium text-sm">{news.action_text}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
