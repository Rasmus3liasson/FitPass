import colors from '@fitpass/shared/constants/custom-colors';
import { DotsThreeOutlineVertical, Star } from 'phosphor-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

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
    if (rating >= 4.5) return colors.accentGreen;
    if (rating >= 4.0) return colors.intensityLow;
    if (rating >= 3.5) return colors.intensityMedium;
    if (rating >= 3.0) return colors.accentOrange;
    return colors.accentRed;
  };

  const handleOptionsPress = () => {
    if (reviewId && onOptionsPress) {
      onOptionsPress(reviewId);
    }
  };

  const isOwnReview = userId === currentUserId;

  return (
    <View className="bg-surface rounded-xl p-3 mb-2.5">
      {/* Compact Review Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Image source={{ uri: userAvatar }} className="w-9 h-9 rounded-full" />
          <View className="ml-2.5 flex-1">
            <Text className="text-textPrimary font-semibold text-sm">{userName}</Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-textSecondary text-xs">{date}</Text>
              <View
                className="rounded-full px-1.5 py-0.5 ml-2"
                style={{
                  backgroundColor: `${getRatingColor(rating)}20`,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: getRatingColor(rating),
                  }}
                >
                  {rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {showOptions && reviewId && (
          <TouchableOpacity className="p-1 ml-2" onPress={handleOptionsPress}>
            <DotsThreeOutlineVertical size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Compact Star Rating */}
      <View className="flex-row items-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= rating ? getRatingColor(rating) : colors.borderGray}
            weight="fill"
          />
        ))}
      </View>

      {/* Review Text */}
      {text && <Text className="text-textSecondary text-sm leading-snug">{text}</Text>}
    </View>
  );
}
