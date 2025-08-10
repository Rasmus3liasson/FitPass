import { Calendar, Star, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ReviewCard } from "./ReviewCard";
import { ViewAllModal } from "./ViewAllModal";

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
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#4CAF50";
    if (rating >= 4.0) return "#8BC34A";
    if (rating >= 3.5) return "#FFC107";
    if (rating >= 3.0) return "#FF9800";
    return "#F44336";
  };

  const getSortedAndFilteredReviews = () => {
    let filtered = reviews;

    if (filterRating) {
      filtered = reviews.filter(
        (review) => Math.floor(review.rating) === filterRating
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
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
        mainValue: averageRating?.toFixed(1) || "0.0",
        mainLabel: "",
        subValue: reviews.length.toString(),
        subLabel: "reviews",
        customContent: (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-2xl mr-2">
                {averageRating?.toFixed(1) || "0.0"}
              </Text>
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={
                      star <= (averageRating || 0) ? "#FFCA28" : "#ffffff40"
                    }
                    fill={star <= (averageRating || 0) ? "#FFCA28" : "none"}
                  />
                ))}
              </View>
            </View>
            <Text className="text-gray-400 text-sm">
              {reviews.length} reviews
            </Text>
          </View>
        ),
      }}
      filterOptions={[
        { key: "newest", label: "Newest", icon: Calendar },
        { key: "highest", label: "Highest Rated", icon: TrendingUp },
        { key: "lowest", label: "Lowest Rated", icon: TrendingUp },
        { key: "oldest", label: "Oldest", icon: Calendar },
      ]}
      selectedFilter={sortBy}
      onFilterChange={(filter) => setSortBy(filter as any)}
      secondaryFilters={{
        options: [
          { key: null, label: "All" },
          ...[5, 4, 3, 2, 1].map((rating) => ({
            key: rating.toString(),
            label: rating.toString(),
            icon: (
              <Star
                size={12}
                color={filterRating === rating ? "#FFFFFF" : "#A0A0A0"}
                fill={filterRating === rating ? "#FFFFFF" : "#A0A0A0"}
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
        icon: <Star size={24} color="#6366F1" />,
        title: "No reviews match your filter",
        subtitle: "Try adjusting your filter settings",
      }}
    />
  );
}
