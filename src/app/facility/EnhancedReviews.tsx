import { ReviewsModal } from "@/components/ReviewsModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useAddReview, useDeleteReview } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import {
    Edit,
    ExternalLink,
    Eye,
    MessageSquare,
    MoreHorizontal,
    Star,
    ThumbsUp,
    Trash2,
    Users
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Toast from "react-native-toast-message";

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  user_id?: string; // Add user_id to identify review owner
}

interface Props {
  reviews: Review[];
  id: string;
  onToggleAddReview: () => void;
}

export function EnhancedReviews({ reviews, id, onToggleAddReview }: Props) {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const addReview = useAddReview();
  const deleteReview = useDeleteReview();

  const handleLoadMore = () => {
    setVisibleReviews((prev) => Math.min(prev + 3, reviews.length));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#8BC34A';
    if (rating >= 3.5) return '#FFC107';
    if (rating >= 3.0) return '#FF9800';
    return '#F44336';
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[Math.floor(review.rating) as keyof typeof distribution]++;
    });
    return distribution;
  };

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();

  const handleDeleteReview = async (reviewId: string) => {
    if (!auth.user?.id) return;

    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReview.mutateAsync({
                reviewId,
                userId: auth.user!.id,
                clubId: id,
              });
              
              Toast.show({
                type: 'success',
                text1: 'Review Deleted',
                text2: 'Your review has been successfully removed.',
              });
              
              setShowOptionsModal(null);
            } catch (error) {
              console.error("Error deleting review:", error);
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Could not delete your review. Please try again.',
              });
            }
          },
        },
      ]
    );
  };

  const handleEditReview = (reviewId: string) => {
    setShowOptionsModal(null);
    // You can implement edit functionality here
    // For now, we'll just show the add review modal
    onToggleAddReview();
  };

  const handleReportReview = (reviewId: string) => {
    setShowOptionsModal(null);
    Alert.alert(
      "Report Review",
      "Thank you for reporting this review. We'll investigate and take appropriate action if needed.",
      [{ text: "OK" }]
    );
  };

  return (
    <View className="mt-8">
      {/* Reviews Header */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <MessageSquare size={20} color="#6366F1" />
            <Text className="text-white font-semibold text-lg ml-3">
              Reviews & Ratings
            </Text>
          </View>
          <View className="bg-primary/20 rounded-full px-3 py-1">
            <Text className="text-primary text-sm font-medium">
              {reviews.length} reviews
            </Text>
          </View>
        </View>

        {reviews.length > 0 ? (
          <>
            {/* Overall Rating */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text className="text-white font-bold text-3xl mr-2">
                    {averageRating.toFixed(1)}
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        color={star <= averageRating ? getRatingColor(averageRating) : '#374151'}
                        fill={star <= averageRating ? getRatingColor(averageRating) : 'none'}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-gray-400 text-sm">
                  Based on {reviews.length} reviews
                </Text>
              </View>

              {/* Rating Distribution */}
              <View className="ml-4">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <View key={rating} className="flex-row items-center mb-1">
                    <Text className="text-gray-400 text-xs w-4">{rating}</Text>
                    <View className="w-16 h-1.5 bg-gray-700 rounded-full ml-2 mr-2">
                      <View
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100}%`,
                          backgroundColor: getRatingColor(rating),
                        }}
                      />
                    </View>
                    <Text className="text-gray-400 text-xs">
                      {ratingDistribution[rating as keyof typeof ratingDistribution]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View className="items-center py-8">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Star size={24} color="#6366F1" />
            </View>
            <Text className="text-white font-semibold text-lg mb-2">
              No reviews yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-4">
              Be the first to share your experience at this facility
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={onToggleAddReview}
            className="bg-primary rounded-xl p-4 flex-row items-center justify-center flex-1"
          >
            <Star size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Write a Review
            </Text>
          </TouchableOpacity>
          
          {reviews.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllReviewsModal(true)}
              className="bg-surface border border-primary rounded-xl p-4 flex-row items-center justify-center"
            >
              <Eye size={16} color="#6366F1" />
              <Text className="text-primary font-semibold ml-2">
                View All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <View>
          {reviews.slice(0, visibleReviews).map((review, index) => (
            <View key={review.id} className="bg-surface rounded-2xl p-4 mb-3">
              {/* Review Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{ uri: review.avatar }}
                    className="w-12 h-12 rounded-full"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold text-base">
                      {review.user}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {review.date}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  className="p-1"
                  onPress={() => setShowOptionsModal(review.id)}
                >
                  <MoreHorizontal size={16} color="#A0A0A0" />
                </TouchableOpacity>
              </View>

              {/* Rating */}
              <View className="flex-row items-center mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= review.rating ? getRatingColor(review.rating) : '#374151'}
                    fill={star <= review.rating ? getRatingColor(review.rating) : 'none'}
                  />
                ))}
                <View className={`rounded-full px-2 py-1 ml-3`} style={{
                  backgroundColor: `${getRatingColor(review.rating)}20`
                }}>
                  <Text className="text-xs font-medium" style={{
                    color: getRatingColor(review.rating)
                  }}>
                    {review.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Review Text */}
              {review.text && (
                <Text className="text-gray-300 text-sm leading-relaxed mb-3">
                  {review.text}
                </Text>
              )}

              {/* Review Actions */}
              <View className="flex-row items-center pt-3 border-t border-gray-700">
                <TouchableOpacity className="flex-row items-center mr-4">
                  <ThumbsUp size={14} color="#A0A0A0" />
                  <Text className="text-gray-400 text-sm ml-2">Helpful</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center">
                  <MessageSquare size={14} color="#A0A0A0" />
                  <Text className="text-gray-400 text-sm ml-2">Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Load More Button */}
          {visibleReviews < reviews.length && (
            <TouchableOpacity
              onPress={handleLoadMore}
              className="bg-surface/50 border border-gray-600 rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Users size={16} color="#6366F1" />
              <Text className="text-primary font-semibold ml-2">
                Show {Math.min(3, reviews.length - visibleReviews)} More Reviews
              </Text>
            </TouchableOpacity>
          )}

          {/* View All Reviews */}
          {reviews.length > 5 && visibleReviews >= reviews.length && (
            <TouchableOpacity 
              onPress={() => setShowAllReviewsModal(true)}
              className="bg-primary/10 rounded-xl p-4 flex-row items-center justify-center"
            >
              <ExternalLink size={16} color="#6366F1" />
              <Text className="text-primary font-semibold ml-2">
                View All {reviews.length} Reviews
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reviews Modal */}
      <ReviewsModal
        visible={showAllReviewsModal}
        reviews={reviews}
        averageRating={calculateAverageRating()}
        onClose={() => setShowAllReviewsModal(false)}
      />

      {/* Review Options Modal */}
      <Modal
        visible={showOptionsModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(null)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowOptionsModal(null)}
        >
          <View className="bg-surface rounded-2xl mx-4 min-w-[250px]">
            <View className="p-4 border-b border-gray-700">
              <Text className="text-white font-semibold text-center">Review Options</Text>
            </View>
            
            {showOptionsModal && reviews.find(r => r.id === showOptionsModal)?.user_id === auth.user?.id ? (
              // Options for user's own review
              <>
                <TouchableOpacity
                  className="flex-row items-center p-4 border-b border-gray-700"
                  onPress={() => handleEditReview(showOptionsModal)}
                >
                  <Edit size={18} color="#6366F1" />
                  <Text className="text-white ml-3 font-medium">Edit Review</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-row items-center p-4"
                  onPress={() => handleDeleteReview(showOptionsModal)}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text className="text-red-400 ml-3 font-medium">Delete Review</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Options for other users' reviews
              <TouchableOpacity
                className="flex-row items-center p-4"
                onPress={() => handleReportReview(showOptionsModal || '')}
              >
                <ExternalLink size={18} color="#F59E0B" />
                <Text className="text-yellow-400 ml-3 font-medium">Report Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
