import { CustomAlert } from "@shared/components/CustomAlert";
import { ReviewsModal } from "@shared/components/ReviewsModal";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useAddReview, useDeleteReview } from "@shared/hooks/useClubs";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useRouter } from "expo-router";
import {
  DotsThreeOutlineVertical,
  PenIcon,
  Star,
  StarIcon,
  X,
} from "phosphor-react-native";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  user_id?: string;
}

interface Props {
  reviews: Review[];
  id: string;
  onToggleAddReview: () => void;
}

export function Reviews({ reviews, id, onToggleAddReview }: Props) {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>;
    type?: "default" | "destructive" | "warning";
  }>({ visible: false, title: "" });
  const router = useRouter();
  const auth = useAuth();
  const addReview = useAddReview();
  const deleteReview = useDeleteReview();
  const { showSuccess, showError } = useGlobalFeedback();

  const handleLoadMore = () => {
    setVisibleReviews((prev) => Math.min(prev + 3, reviews.length));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return colors.accentGreen;
    if (rating >= 4.0) return colors.intensityLow;
    if (rating >= 3.5) return colors.intensityMedium;
    if (rating >= 3.0) return colors.accentOrange;
    return colors.accentRed;
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[Math.floor(review.rating) as keyof typeof distribution]++;
    });
    return distribution;
  };

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();

  const handleDeleteReview = async (reviewId: string) => {
    if (!auth.user?.id) return;

    setAlertConfig({
      visible: true,
      title: "Ta bort recension",
      message:
        "Är du säker på att du vill ta bort denna recension? Detta kan inte ångras.",
      type: "destructive",
      buttons: [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReview.mutateAsync({
                reviewId,
                userId: auth.user!.id,
                clubId: id,
              });

              showSuccess(
                "Recension borttagen",
                "Din recension har tagits bort.",
              );

              setShowOptionsModal(null);
            } catch (error) {
              console.error("Error deleting review:", error);
              showError(
                "Borttagning misslyckades",
                "Kunde inte ta bort din recension. Försök igen.",
              );
            }
          },
        },
      ],
    });
  };

  const handleEditReview = (reviewId: string) => {
    setShowOptionsModal(null);
    // You can implement edit functionality here
    // For now, we'll just show the add review modal
    onToggleAddReview();
  };

  const handleReportReview = (reviewId: string) => {
    setShowOptionsModal(null);
    setAlertConfig({
      visible: true,
      title: "Rapportera recension",
      message:
        "Tack för att du rapporterar denna recension. Vi kommer att undersöka och vidta lämpliga åtgärder om det behövs.",
      type: "default",
      buttons: [{ text: "OK" }],
    });
  };

  return (
    <View className="mt-8">
      {/* Compact Reviews Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-textPrimary font-bold text-lg">
            Recensioner
          </Text>
          <View className="bg-primary/20 rounded-full px-2.5 py-0.5 ml-2">
            <Text className="text-primary text-xs font-semibold">
              {reviews.length}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {reviews.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllReviewsModal(true)}
              className="flex-row items-center bg-surface rounded-lg px-3 py-1.5"
            >
              <Text className="text-textSecondary font-medium text-xs ml-1">
                Alla
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onToggleAddReview}
            className="flex-row items-center bg-primary rounded-lg px-3 py-1.5"
          >
            <PenIcon size={14} color="white" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {reviews.length > 0 ? (
        <>
          {/* Compact Rating Summary */}
          <View className="bg-surface rounded-xl p-3 mb-4">
            <View className="flex-row items-center justify-between">
              {/* Left: Average Rating */}
              <View className="flex-row items-center">
                <View className="flex-col items-center justify-center">
                  <Text className="text-textPrimary font-bold text-2xl">
                    {averageRating.toFixed(1)}
                  </Text>
                  <View>
                    <View className="flex-row mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          size={14}
                          color={
                            star <= averageRating
                              ? getRatingColor(averageRating)
                              : colors.borderGray
                          }
                          weight="fill"
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-textSecondary text-xs">
                    {reviews.length}{" "}
                    {reviews.length === 1 ? "recension" : "recensioner"}
                  </Text>
                </View>
              </View>

              {/* Right: Compact Rating Distribution */}
              <View className="flex-1 ml-4">
                {[5, 4, 3, 2, 1]
                  .filter((rating) => {
                    const count =
                      ratingDistribution[
                        rating as keyof typeof ratingDistribution
                      ];
                    return count > 0;
                  })
                  .map((rating) => {
                    const count =
                      ratingDistribution[
                        rating as keyof typeof ratingDistribution
                      ];
                    const percentage =
                      reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <View key={rating} className="flex-row items-center mb-1">
                        <Text className="text-textSecondary text-xs w-3">
                          {rating}
                        </Text>
                        <View className="flex-1 h-1 bg-borderGray/30 rounded-full mx-2">
                          <View
                            className="h-1 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getRatingColor(rating),
                            }}
                          />
                        </View>
                        <Text className="text-textSecondary text-xs w-4 text-right">
                          {count}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        </>
      ) : (
        <View className="bg-surface rounded-xl p-6 mb-4 items-center">
          <Star size={32} color={colors.textSecondary} weight="duotone" />
          <Text className="text-textPrimary font-semibold text-base mt-3 mb-1">
            Inga recensioner än
          </Text>
          <Text className="text-textSecondary text-sm text-center">
            Bli först att dela din upplevelse
          </Text>
        </View>
      )}

      {/* Horizontal Scrolling Reviews */}
      {reviews.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            className="-mx-4 px-4"
          >
            {reviews.map((review) => (
              <TouchableOpacity
                key={review.id}
                onPress={() => setSelectedReview(review)}
                activeOpacity={0.7}
                className="mr-3"
                style={{ width: 280 }}
              >
                <View className="bg-surface rounded-xl p-3">
                  {/* Header with 3-dot menu */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={{ uri: review.avatar }}
                        className="w-9 h-9 rounded-full"
                      />
                      <View className="ml-2.5 flex-1">
                        <Text
                          className="text-textPrimary font-semibold text-sm"
                          numberOfLines={1}
                        >
                          {review.user}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <Text className="text-textSecondary text-xs">
                            {review.date}
                          </Text>
                          <View
                            className="rounded-full px-1.5 py-0.5 ml-2"
                            style={{
                              backgroundColor: `${getRatingColor(review.rating)}20`,
                            }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{
                                color: getRatingColor(review.rating),
                              }}
                            >
                              {review.rating.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="p-1 ml-2"
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowOptionsModal(review.id);
                      }}
                    >
                      <DotsThreeOutlineVertical
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Star Rating */}
                  <View className="flex-row items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        size={12}
                        color={
                          star <= review.rating
                            ? getRatingColor(review.rating)
                            : colors.borderGray
                        }
                        weight="fill"
                      />
                    ))}
                  </View>

                  {/* Truncated Review Text */}
                  {review.text && (
                    <Text
                      className="text-textSecondary text-sm leading-snug"
                      numberOfLines={3}
                    >
                      {review.text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* View All Button */}
          {reviews.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllReviewsModal(true)}
              className="bg-surface/50 border border-borderGray/30 rounded-xl p-3 flex-row items-center justify-center mt-4"
            >
              <Text className="text-textSecondary font-medium text-sm">
                Visa alla {reviews.length} recensioner
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Review Detail Modal */}
      <Modal
        visible={selectedReview !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReview(null)}
      >
        <View className="flex-1 bg-background/70 justify-end">
          <View className="bg-surface rounded-t-3xl max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-borderGray/20">
              <Text className="text-textPrimary font-bold text-lg">
                Recension
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedReview(null)}
                className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              >
                <X size={16} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedReview && (
              <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-surface rounded-xl p-4">
                  {/* User Info */}
                  <View className="flex-row items-center mb-4">
                    <Image
                      source={{ uri: selectedReview.avatar }}
                      className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-textPrimary font-bold text-base">
                        {selectedReview.user}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {selectedReview.date}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setShowOptionsModal(selectedReview.id);
                        setSelectedReview(null);
                      }}
                      className="p-2"
                    >
                      <DotsThreeOutlineVertical
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Rating */}
                  <View className="flex-row items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        size={20}
                        color={
                          star <= selectedReview.rating
                            ? getRatingColor(selectedReview.rating)
                            : colors.borderGray
                        }
                        weight="fill"
                      />
                    ))}
                    <View
                      className="rounded-full px-3 py-1 ml-3"
                      style={{
                        backgroundColor: `${getRatingColor(selectedReview.rating)}20`,
                      }}
                    >
                      <Text
                        className="text-sm font-bold"
                        style={{
                          color: getRatingColor(selectedReview.rating),
                        }}
                      >
                        {selectedReview.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Full Review Text */}
                  {selectedReview.text && (
                    <View className="bg-background rounded-lg p-4">
                      <Text className="text-textPrimary text-base leading-relaxed">
                        {selectedReview.text}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reviews Modal */}
      <ReviewsModal
        visible={showAllReviewsModal}
        reviews={reviews}
        averageRating={calculateAverageRating()}
        currentUserId={auth.user?.id}
        showOptions={true}
        onClose={() => setShowAllReviewsModal(false)}
        onOptionsPress={(reviewId) => setShowOptionsModal(reviewId)}
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
            <View className="p-4 border-b border-accentGray">
              <Text className="text-textPrimary font-semibold text-center text-xl">
                Recensionsalternativ
              </Text>
            </View>

            <View className="flex-col justify-between items-center">
              {showOptionsModal &&
              reviews.find((r) => r.id === showOptionsModal)?.user_id ===
                auth.user?.id ? (
                <>
                  <TouchableOpacity
                    className="flex-row items-center p-4 border-b border-accentGray"
                    onPress={() => handleEditReview(showOptionsModal)}
                  >
                    <Text className="text-primary font-medium">
                      Redigera recension
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center p-4"
                    onPress={() => handleDeleteReview(showOptionsModal)}
                  >
                    <Text className="text-accentRed font-medium">
                      Ta bort recension
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Options for other users' reviews
                <TouchableOpacity
                  className="flex-row items-center p-4"
                  onPress={() => handleReportReview(showOptionsModal || "")}
                >
                  <Text className="text-accentRed font-medium">
                    Rapportera recension
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}
export default Reviews;
