import { BaseModal } from "@/src/components/BaseModal";
import { OptimizedImage } from "@/src/components/OptimizedImage";
import {
  Calendar,
  Eye,
  Gift,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Sparkles
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const NEWS_MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
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
    const getIconColor = (type: string) => {
      switch (type) {
        case "new_class":
          return "#4ADE80"; // green-400
        case "event":
          return "#A78BFA"; // purple-400
        case "update":
          return "#60A5FA"; // blue-400
        case "promotion":
        case "promo":
          return "#FBBF24"; // yellow-400
        case "announcement":
          return "#F87171"; // red-400
        default:
          return "#9CA3AF"; // accentGray
      }
    };

    const iconProps = { size: 12, color: getIconColor(type) };
    switch (type) {
      case "new_class":
        return <Sparkles {...iconProps} />;
      case "event":
        return <PartyPopper {...iconProps} />;
      case "update":
        return <Megaphone {...iconProps} />;
      case "promotion":
      case "promo":
        return <Gift {...iconProps} />;
      case "announcement":
        return <MessageSquare {...iconProps} />;
      default:
        return <MessageSquare {...iconProps} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_class":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "event":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "update":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "promotion":
      case "promo":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "announcement":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-accentGray/20 text-textSecondary border-accentGray/30";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "new_class":
        return "Nytt Pass";
      case "event":
        return "Event";
      case "update":
        return "Uppdatering";
      case "promotion":
      case "promo":
        return "Erbjudande";
      case "announcement":
        return "Meddelande";
      default:
        return "Nyheter";
    }
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Nyss";
    if (diffInHours < 24) return `${diffInHours}t sedan`;
    return `${Math.floor(diffInHours / 24)}d sedan`;
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={newsItem.gym_name}
      maxHeight={NEWS_MODAL_HEIGHT}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* Header with gym info */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-accentGray overflow-hidden mr-3">
              {newsItem.gym_logo ? (
                <OptimizedImage
                  source={{ uri: newsItem.gym_logo }}
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <View className="w-full h-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold text-lg">
                    {newsItem.gym_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <View
                  className={`px-3 py-1 rounded-full mr-3 border ${getTypeColor(
                    newsItem.type
                  )}`}
                >
                  <View className="flex-row items-center">
                    <View className="mr-1">{getTypeIcon(newsItem.type)}</View>
                    <Text
                      className={`text-xs font-medium ${
                        getTypeColor(newsItem.type).split(" ")[1]
                      }`}
                    >
                      {getTypeLabel(newsItem.type)}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center mt-1">
                <Calendar size={12} color="#9CA3AF" />
                <Text className="text-textSecondary text-sm ml-1">
                  {timeAgo(newsItem.timestamp)}
                </Text>
                {newsItem.views_count !== undefined && (
                  <>
                    <Eye size={12} color="#9CA3AF" className="ml-3" />
                    <Text className="text-textSecondary text-sm ml-1">
                      {newsItem.views_count} visningar
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Main image */}
        {newsItem.image_url && (
          <View className="mx-6 mb-6 rounded-xl overflow-hidden">
            <OptimizedImage
              source={{ uri: newsItem.image_url }}
              style={{ width: "100%", height: 200 }}
              className="bg-accentGray"
            />
          </View>
        )}

        {/* Content */}
        <View className="px-6">
          <Text className="text-textPrimary font-bold text-xl mb-3">
            {newsItem.title}
          </Text>

          <Text className="text-textSecondary text-base leading-relaxed mb-4">
            {newsItem.description}
          </Text>

          {newsItem.content && newsItem.content !== newsItem.description && (
            <Text className="text-textSecondary text-base leading-relaxed mb-6">
              {newsItem.content}
            </Text>
          )}
        </View>
      </ScrollView>
    </BaseModal>
  );
};
