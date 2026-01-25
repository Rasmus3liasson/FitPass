import { ChatDotsIcon, GiftIcon, MegaphoneIcon, SparkleIcon } from 'phosphor-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { SwipeableModal } from './SwipeableModal';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  gym_name: string;
  gym_logo?: string;
  image_url?: string;
  timestamp: string;
  type: 'new_class' | 'event' | 'update' | 'promotion' | 'promo' | 'announcement';
  action_text?: string;
  action_data?: any;
  views_count?: number;
  published_at?: string;
  created_at?: string;
}

interface NewsModalProps {
  visible: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
  onActionPress?: (item: NewsItem) => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  visible,
  onClose,
  newsItem,
  onActionPress,
}) => {
  if (!newsItem) return null;

  const getTypeIcon = (type: string) => {
    const iconProps = { size: 12 };
    switch (type) {
      case 'new_class':
        return <SparkleIcon {...iconProps} color="text-accentGreen" />;
      case 'event':
        return <SparkleIcon {...iconProps} color="text-accentPurple" />;
      case 'update':
        return <MegaphoneIcon {...iconProps} color="text-accentBlue" />;
      case 'promotion':
      case 'promo':
        return <GiftIcon {...iconProps} color="text-accentYellow" />;
      case 'announcement':
        return <ChatDotsIcon {...iconProps} color="text-accentRed" />;
      default:
        return <ChatDotsIcon {...iconProps} color="text-textSecondary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_class':
        return 'bg-accentGreen/20 text-accentGreen border-accentGreen/30';
      case 'event':
        return 'bg-accentPurple/20 text-accentPurple border-accentPurple/30';
      case 'update':
        return 'bg-accentBlue/20 text-accentBlue border-accentBlue/30';
      case 'promotion':
      case 'promo':
        return 'bg-accentYellow/20 text-accentYellow border-accentYellow/30';
      case 'announcement':
        return 'bg-accentRed/20 text-accentRed border-accentRed/30';
      default:
        return 'bg-accentGray/20 text-textSecondary border-accentGray/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new_class':
        return 'Nytt Pass';
      case 'event':
        return 'Event';
      case 'update':
        return 'Uppdatering';
      case 'promotion':
      case 'promo':
        return 'Erbjudande';
      case 'announcement':
        return 'Meddelande';
      default:
        return 'Nyheter';
    }
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Nyss';
    if (diffInHours < 24) return `${diffInHours}t sedan`;
    return `${Math.floor(diffInHours / 24)}d sedan`;
  };

  return (
    <SwipeableModal visible={visible} onClose={onClose} snapPoint={0.9}>
      <View className="flex-1 pb-6">
        {/* Header with gym info */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-surface overflow-hidden mr-3">
              {newsItem.gym_logo ? (
                <OptimizedImage
                  source={{ uri: newsItem.gym_logo }}
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <View className="w-full h-full bg-primary/20 items-center justify-center">
                  <Text className="text-textPrimary font-bold text-lg">
                    {newsItem.gym_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold text-base mb-1">
                {newsItem.gym_name}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`px-3 py-1 rounded-full mr-3 border ${getTypeColor(newsItem.type)}`}
                >
                  <View className="flex-row items-center">
                    <View className="mr-1">{getTypeIcon(newsItem.type)}</View>
                    <Text
                      className={`text-xs font-medium ${getTypeColor(newsItem.type).split(' ')[1]}`}
                    >
                      {getTypeLabel(newsItem.type)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className="text-textSecondary text-sm">{timeAgo(newsItem.timestamp)}</Text>
            {newsItem.views_count !== undefined && (
              <>
                <Text className="text-textSecondary text-sm mx-2">•</Text>
                <Text className="text-textSecondary text-sm">{newsItem.views_count} visningar</Text>
              </>
            )}
          </View>
        </View>

        {/* Main image */}
        {newsItem.image_url && (
          <View className="mx-6 mb-6 rounded-xl overflow-hidden bg-surface">
            <OptimizedImage
              source={{ uri: newsItem.image_url }}
              style={{ width: '100%', height: 220 }}
              className="bg-surface"
            />
          </View>
        )}

        {/* Content */}
        <View className="px-6 flex-1">
          <Text className="text-textPrimary font-bold text-2xl mb-4 leading-tight">
            {newsItem.title}
          </Text>

          <Text className="text-textSecondary text-base leading-relaxed mb-4">
            {newsItem.description}
          </Text>

          {newsItem.content && newsItem.content !== newsItem.description && (
            <Text className="text-textSecondary text-base leading-relaxed">{newsItem.content}</Text>
          )}
        </View>
      </View>
    </SwipeableModal>
  );
};
