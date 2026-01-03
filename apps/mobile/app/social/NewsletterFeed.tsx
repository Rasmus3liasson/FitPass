import colors from '@shared/constants/custom-colors';
import { OptimizedImage } from "@shared/components/OptimizedImage";
import { Edit3, Eye, Trash2 } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  gym_name: string;
  gym_logo?: string;
  image_url?: string;
  timestamp: string;
  type:
    | "new_class"
    | "event"
    | "update"
    | "promotion"
    | "promo"
    | "announcement";
  action_text?: string;
  action_data?: any;
  views_count?: number;
  published_at?: string;
  created_at?: string;
}

interface NewsletterFeedProps {
  newsItems: NewsItem[];
  onNewsItemPress: (item: NewsItem) => void;
  // Club management props
  isClubMode?: boolean;
  onEditNews?: (item: NewsItem) => void;
  onDeleteNews?: (newsId: string, title: string) => void;
  isDeleting?: boolean;
}

export const NewsletterFeed: React.FC<NewsletterFeedProps> = ({
  newsItems,
  onNewsItemPress,
  isClubMode = false,
  onEditNews,
  onDeleteNews,
  isDeleting = false,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "new_class":
        return "🆕";
      case "event":
        return "🎉";
      case "update":
        return "📢";
      case "promotion":
      case "promo":
        return "🎁";
      case "announcement":
        return "📣";
      default:
        return "📰";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_class":
        return "bg-green-500/20 text-green-400";
      case "event":
        return "bg-purple-500/20 text-purple-400";
      case "update":
        return "bg-blue-500/20 text-blue-400";
      case "promotion":
      case "promo":
        return "bg-yellow-500/20 text-yellow-400";
      case "announcement":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-accentGray/20 text-textSecondary";
    }
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return isClubMode ? "Nyss" : "Just now";
    if (diffInHours < 24)
      return `${diffInHours}${isClubMode ? "t sedan" : "h sedan"}`;
    return `${Math.floor(diffInHours / 24)}${
      isClubMode ? "d sedan" : "d sedan"
    }`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(
      isClubMode ? "sv-SE" : "en-US"
    );
  };

  return (
    <ScrollView
      className={`flex-1 ${isClubMode ? "" : "px-4"}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      {!isClubMode && (
        <Text className="text-textPrimary font-bold text-lg mb-4">
          Senaste Uppdateringar
        </Text>
      )}

      {newsItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onNewsItemPress(item)}
          className="bg-surface rounded-2xl mb-4 overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row items-center p-4 pb-3">
            <View className="w-12 h-12 rounded-full bg-accentGray overflow-hidden mr-3">
              {item.gym_logo ? (
                <OptimizedImage
                  source={{ uri: item.gym_logo }}
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <View className="w-full h-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold text-lg">
                    {item.gym_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold text-base">
                {item.gym_name}
              </Text>
              <View className="flex-row items-center">
                {/* <View
                  className={`px-2 py-1 rounded-full mr-2 ${getTypeColor(
                    item.type
                  )}`}
                >
                  <Text className="text-xs font-medium">
                    {getTypeIcon(item.type)}
                  </Text>
                </View> */}
                <Text className="text-textSecondary text-sm">
                  {timeAgo(item.timestamp)}
                </Text>
              </View>
            </View>

            {/* Club Management Actions */}
            {isClubMode && (
              <View className="flex-row items-center ml-3">
                {onEditNews && (
                  <TouchableOpacity
                    onPress={() => onEditNews(item)}
                    className="bg-blue-500/20 p-2 rounded-full mr-2"
                  >
                    <Edit3 size={16} color={colors.accentBlue} />
                  </TouchableOpacity>
                )}
                {onDeleteNews && (
                  <TouchableOpacity
                    onPress={() => onDeleteNews(item.id, item.title)}
                    className="bg-red-500/20 p-2 rounded-full"
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} color={colors.accentRed} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Content */}
          <View className="px-4 pb-3">
            <Text className="text-textPrimary font-bold text-lg mb-2">
              {item.title}
            </Text>
            <Text className="text-textSecondary text-base leading-relaxed mb-3">
              {item.description}
            </Text>
          </View>

          {/* Image */}
          {item.image_url && (
            <View className="mx-4 mb-3 rounded-xl overflow-hidden">
              <OptimizedImage
                source={{ uri: item.image_url }}
                style={{ width: "100%", height: 180 }}
                className="bg-accentGray"
              />
            </View>
          )}

          {/* Club Mode Stats */}
          {isClubMode && (
            <View className="px-4 pb-3 pt-2 border-t border-accentGray flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Eye size={14} color={colors.borderGray} />
                <Text className="text-textSecondary text-sm ml-1">
                  {item.views_count || 0} visningar
                </Text>
              </View>
              <Text className="text-textSecondary text-sm">
                {formatDate(
                  item.published_at || item.created_at || item.timestamp
                )}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
