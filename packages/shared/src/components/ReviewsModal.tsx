import colors from '@fitpass/shared/constants/custom-colors';
import { CalendarIcon, StarIcon, TrendUpIcon } from 'phosphor-react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ReviewCard } from './ReviewCard';
import { ViewAllModal } from './ViewAllModal';

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  user_id?: string;
}

interface ReviewsModalProps {
  visible: boolean;
  reviews: Review[];
  facilityName?: string;
  averageRating?: number;
  currentUserId?: string;
  onClose: () => void;
  onOptionsPress?: (reviewId: string) => void;
  showOptions?: boolean;
}

export function ReviewsModal({
  visible,
  reviews,
  facilityName,
  averageRating,
  currentUserId,
  onClose,
  onOptionsPress,
  showOptions = false,
}: ReviewsModalProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return colors.accentGreen;
    if (rating >= 4.0) return colors.intensityLow;
    if (rating >= 3.5) return colors.intensityMedium;
    if (rating >= 3.0) return colors.accentOrange;
    return colors.accentRed;
  };

  const getSortedAndFilteredReviews = () => {
    let filtered = reviews;

    if (filterRating) {
      filtered = reviews.filter((review) => Math.floor(review.rating) === filterRating);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  };

  const sortedReviews = getSortedAndFilteredReviews();

  const renderReview = (review: Review) => (
    <ReviewCard
      key={review.id}
      rating={review.rating}
      date={review.date}
      text={review.text}
      userName={review.user}
      userAvatar={review.avatar}
      reviewId={review.id}
      userId={review.user_id}
      currentUserId={currentUserId}
      onOptionsPress={onOptionsPress}
    />
  );

  return (
    <ViewAllModal
      visible={visible}
      onClose={onClose}
      title="Reviews"
      subtitle={facilityName}
      stats={{
        mainValue: averageRating?.toFixed(1) || '0.0',
        mainLabel: '',
        subValue: reviews.length.toString(),
        subLabel: 'recensioner',
        customContent: (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-textPrimary font-bold text-2xl mr-2">
                {averageRating?.toFixed(1) || '0.0'}
              </Text>
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    size={16}
                    color={star <= (averageRating || 0) ? colors.accentYellow : '#ffffff40'}
                  />
                ))}
              </View>
            </View>
            <Text className="text-textSecondary text-sm">{reviews.length} recensioner</Text>
          </View>
        ),
      }}
      filterOptions={[
        { key: 'newest', label: 'Nyaste', icon: CalendarIcon },
        { key: 'highest', label: 'ögst betyg', icon: TrendUpIcon },
        { key: 'lowest', label: 'Lägst betyg', icon: TrendUpIcon },
        { key: 'oldest', label: 'Äldsta', icon: CalendarIcon },
      ]}
      selectedFilter={sortBy}
      onFilterChange={(filter) => setSortBy(filter as any)}
      secondaryFilters={{
        options: [
          { key: null, label: 'All' },
          ...[5, 4, 3, 2, 1].map((rating) => ({
            key: rating.toString(),
            label: rating.toString(),
            icon: (
              <StarIcon
                size={12}
                color={filterRating === rating ? 'white' : colors.textSecondary}
              />
            ),
          })),
        ],
        selected: filterRating?.toString() || null,
        onSelectionChange: (key) => setFilterRating(key ? parseInt(key) : null),
      }}
      data={sortedReviews}
      renderItem={renderReview}
      emptyState={{
        icon: <StarIcon size={24} color={colors.primary} />,
        title: 'No reviews match your filter',
        subtitle: 'Try adjusting your filter settings',
      }}
    />
  );
}
