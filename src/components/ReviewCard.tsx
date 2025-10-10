import { MoreHorizontal, Star } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ReviewCardProps {
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  text: string;
  reviewId?: string;
  userId?: string;
  currentUserId?: string;
  onOptionsPress?: (reviewId: string) => void;
  onEditReview?: (reviewId: string) => void;
  onDeleteReview?: (reviewId: string) => void;
  onReportReview?: (reviewId: string) => void;
  showOptions?: boolean;
}

export function ReviewCard({
  userName,
  userAvatar,
  rating,
  date,
  text,
  reviewId,
  userId,
  currentUserId,
  onOptionsPress,
  onEditReview,
  onDeleteReview,
  onReportReview,
  showOptions,
}: ReviewCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#4CAF50";
    if (rating >= 4.0) return "#8BC34A";
    if (rating >= 3.5) return "#FFC107";
    if (rating >= 3.0) return "#FF9800";
    return "#F44336";
  };

  const handleOptionsPress = () => {
    if (reviewId && onOptionsPress) {
      onOptionsPress(reviewId);
    }
  };

  const isOwnReview = userId === currentUserId;

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      {/* Review Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: userAvatar }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="text-textPrimary font-semibold text-base">
              {userName}
            </Text>
            <Text className="text-gray-400 text-sm">{date}</Text>
          </View>
        </View>
        {showOptions && reviewId && (
          <TouchableOpacity className="p-1" onPress={handleOptionsPress}>
            <MoreHorizontal size={16} color="#A0A0A0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Rating */}
      <View className="flex-row items-center mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={star <= rating ? getRatingColor(rating) : "#374151"}
            fill={star <= rating ? getRatingColor(rating) : "none"}
          />
        ))}
        <View
          className={`rounded-full px-2 py-1 ml-3`}
          style={{
            backgroundColor: `${getRatingColor(rating)}20`,
          }}
        >
          <Text
            className="text-xs font-medium"
            style={{
              color: getRatingColor(rating),
            }}
          >
            {rating.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Review Text */}
      {text && (
        <Text className="text-gray-300 text-sm leading-relaxed mb-3">
          {text}
        </Text>
      )}

      {/* Border */}
      <View className="flex-row items-center pt-3 border-t border-gray-700"></View>
    </View>
  );
}
