import { CustomAlert } from "@shared/components/CustomAlert";
import { ReviewCard } from "@shared/components/ReviewCard";
import { ReviewsModal } from "@shared/components/ReviewsModal";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useAddReview, useDeleteReview } from "@shared/hooks/useClubs";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useRouter } from "expo-router";
import {
  Edit,
  ExternalLink,
  Eye,
  Star,
  Trash2,
  Users
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

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
    if (rating >= 4.0) return "#8BC34A";
    if (rating >= 3.5) return colors.intensityMedium;
    if (rating >= 3.0) return "#FF9800";
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
                "Din recension har tagits bort."
              );

              setShowOptionsModal(null);
            } catch (error) {
              console.error("Error deleting review:", error);
              showError(
                "Borttagning misslyckades",
                "Kunde inte ta bort din recension. Försök igen."
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
      {/* Reviews Header */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <Text className="text-textPrimary font-semibold text-lg">
              Recensioner & Betyg
            </Text>
            <View className="bg-primary/20 rounded-full px-3 py-1 ml-2">
              <Text className="text-primary text-sm font-medium">
                {reviews.length}
              </Text>
            </View>
          </View>
          {reviews.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllReviewsModal(true)}
              className="flex-row items-center bg-primary/10 rounded-lg px-3 py-2 ml-2"
            >
              <Eye size={16} color={colors.primary} />
              <Text className="text-primary font-semibold text-sm ml-1">
                Alla
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews.length > 0 ? (
          <>
            {/* Overall Rating */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text className="text-textPrimary font-bold text-3xl mr-2">
                    {averageRating.toFixed(1)}
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        color={
                          star <= averageRating
                            ? getRatingColor(averageRating)
                            : "#374151"
                        }
                        fill={
                          star <= averageRating
                            ? getRatingColor(averageRating)
                            : "none"
                        }
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-textSecondary text-sm">
                  Baserat på {reviews.length} recensioner
                </Text>
              </View>

              {/* Rating Distribution */}
              <View className="ml-4">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <View key={rating} className="flex-row items-center mb-1">
                    <Text className="text-textSecondary text-xs w-4">
                      {rating}
                    </Text>
                    <View className="w-16 h-1.5 bg-accentGray rounded-full ml-2 mr-2">
                      <View
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${
                            (ratingDistribution[
                              rating as keyof typeof ratingDistribution
                            ] /
                              reviews.length) *
                            100
                          }%`,
                          backgroundColor: getRatingColor(rating),
                        }}
                      />
                    </View>
                    <Text className="text-textSecondary text-xs">
                      {
                        ratingDistribution[
                          rating as keyof typeof ratingDistribution
                        ]
                      }
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View className="items-center py-8">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Star size={24} color={colors.primary} />
            </View>
            <Text className="text-textPrimary font-semibold text-lg mb-2">
              Inga recensioner än
            </Text>
            <Text className="text-textSecondary text-sm text-center mb-4">
              Bli den första att dela din upplevelse av denna anläggning
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          onPress={onToggleAddReview}
          className="bg-primary rounded-xl p-4 flex-row items-center justify-center"
          style={{
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Star size={18} color={colors.textPrimary} fill={colors.textPrimary} />
          <Text className="text-white font-bold text-base ml-2">
            Skriv en recension
          </Text>
        </TouchableOpacity>
      </View>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <View>
          {reviews.slice(0, visibleReviews).map((review, index) => (
            <ReviewCard
              key={review.id}
              userName={review.user}
              userAvatar={review.avatar}
              rating={review.rating}
              date={review.date}
              text={review.text}
              reviewId={review.id}
              userId={review.user_id}
              currentUserId={auth.user?.id}
              showOptions={true}
              onOptionsPress={() => setShowOptionsModal(review.id)}
            />
          ))}

          {/* Load More Button */}
          {visibleReviews < reviews.length && (
            <TouchableOpacity
              onPress={handleLoadMore}
              className="bg-surface/50 border border-accentGray rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Users size={16} color={colors.primary} />
              <Text className="text-primary font-semibold ml-2">
                Visa {Math.min(3, reviews.length - visibleReviews)} fler
                recensioner
              </Text>
            </TouchableOpacity>
          )}

          {/* View All Reviews */}
          {reviews.length > 5 && visibleReviews >= reviews.length && (
            <TouchableOpacity
              onPress={() => setShowAllReviewsModal(true)}
              className="bg-primary/10 rounded-xl p-4 flex-row items-center justify-center"
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text className="text-primary font-semibold ml-2">
                Visa alla {reviews.length} recensioner
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
              <Text className="text-textPrimary font-semibold text-center">
                Recensionsalternativ
              </Text>
            </View>

            {showOptionsModal &&
            reviews.find((r) => r.id === showOptionsModal)?.user_id ===
              auth.user?.id ? (
              // Options for user's own review
              <>
                <TouchableOpacity
                  className="flex-row items-center p-4 border-b border-accentGray"
                  onPress={() => handleEditReview(showOptionsModal)}
                >
                  <Edit size={18} color={colors.primary} />
                  <Text className="text-textPrimary ml-3 font-medium">
                    Redigera recension
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center p-4"
                  onPress={() => handleDeleteReview(showOptionsModal)}
                >
                  <Trash2 size={18} color={colors.accentRed} />
                  <Text className="text-red-400 ml-3 font-medium">
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
                <ExternalLink size={18} color="#F59E0B" />
                <Text className="text-yellow-400 ml-3 font-medium">
                  Rapportera recension
                </Text>
              </TouchableOpacity>
            )}
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
