import { CheckInModal } from "@/components/CheckInModal";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookDirectVisit, useUserBookings } from "@/src/hooks/useBookings";
import {
  useAddReview,
  useClub,
  useClubClasses,
  useClubReviews,
} from "@/src/hooks/useClubs";
import {
  useAddDailyAccessGym,
  useDailyAccessStatus,
  useGymDailyAccessStatus,
  useRemoveDailyAccessGym,
} from "@/src/hooks/useDailyAccess";
import {
  useAddFavorite,
  useIsFavorite,
  useRemoveFavorite,
} from "@/src/hooks/useFavorites";
import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import { useMembership } from "@/src/hooks/useMembership";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { EnhancedAddReview } from "../EnhancedAddReview";
import { EnhancedFacilityDetails } from "../EnhancedFacilityDetails";
import { EnhancedFacilityHeader } from "../EnhancedFacilityHeader";
import { EnhancedPosterCarousel } from "../EnhancedPosterCarousel";
import { EnhancedReviews } from "../EnhancedReviews";

import { ROUTES } from "@/src/config/constants";
import { ClubImage } from "@/src/types";
import { formatSwedishTime } from "@/src/utils/time";
import { FacilityAmenities } from "../facilityAmenties";
import { FacilityClasses } from "../facilityClasses";

export default function FacilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const auth = useAuth();
  const { membership } = useMembership();
  const { data: userBookings = [] } = useUserBookings(auth.user?.id || "");
  const [showAddReview, setShowAddReview] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const { showSuccess, showError, showInfo } = useGlobalFeedback();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daily Access hooks
  const { data: dailyAccessStatus } = useDailyAccessStatus(auth.user?.id);
  const { data: gymStatus } = useGymDailyAccessStatus(
    auth.user?.id,
    id as string
  );
  const addGymMutation = useAddDailyAccessGym();
  const removeGymMutation = useRemoveDailyAccessGym();

  const hasDailyAccessEligibility = dailyAccessStatus?.hasDailyAccess || false;
  const isInDailyAccess = gymStatus?.isSelected || false;
  const dailyAccessLoading =
    addGymMutation.isPending || removeGymMutation.isPending;
  const canAddMoreGyms = true; // We'll check this in the mutation

  // Debug logging to track state changes
  React.useEffect(() => {
    console.log('Daily Access Status Update:', {
      gymId: id,
      userId: auth.user?.id,
      gymStatus,
      isInDailyAccess,
      hasDailyAccessEligibility,
      dailyAccessLoading
    });
  }, [gymStatus, isInDailyAccess, hasDailyAccessEligibility, dailyAccessLoading, id, auth.user?.id]);

  const handleDailyAccessToggle = async () => {
    if (!auth.user?.id || !id || !club) return;

    try {
      if (isInDailyAccess) {
        await removeGymMutation.mutateAsync({
          userId: auth.user.id,
          gymId: id as string,
        });
        showSuccess("Gym borttaget", `${club.name} har tagits bort från din Daily Access`);
      } else {
        await addGymMutation.mutateAsync({
          userId: auth.user.id,
          gymId: id as string,
        });
        showSuccess("Gym tillagt", `${club.name} har lagts till i din Daily Access`);
      }
    } catch (error: any) {
      Alert.alert("Fel", error.message || "Kunde inte uppdatera Daily Access");
    }
  };

  // Fetch club data
  const { data: club, isLoading: isLoadingClub } = useClub(id as string);
  const { data: classes, isLoading: isLoadingClasses } = useClubClasses(
    id as string
  );

  const { data: reviews, isLoading: isLoadingReviews } = useClubReviews(
    id as string
  );
  const { data: isFavorite = false } = useIsFavorite(
    auth.user?.id || "",
    id as string
  );

  // Favorite mutations
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addReview = useAddReview();
  const bookDirectVisit = useBookDirectVisit();

  const handleToggleFavorite = async () => {
    if (!auth.user?.id) {
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync({
          userId: auth.user.id,
          clubId: id as string,
        });
      } else {
        await addFavorite.mutateAsync({
          userId: auth.user.id,
          clubId: id as string,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleSubmitReview = async ({
    rating,
    comment,
  }: {
    rating: number;
    comment: string;
  }) => {
    if (!auth.user?.id) {
      router.push("/login");
      return;
    }

    try {
      await addReview.mutateAsync({
        userId: auth.user.id,
        clubId: id as string,
        rating,
        comment,
      });

      setShowAddReview(!showAddReview);
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  const handleCheckIn = () => {
    if (!auth.user?.id) {
      router.push("/login");
      return;
    }
    setShowCheckInModal(true);
  };

  const handleDirectVisitBooking = async () => {
    if (!auth.user?.id) {
      router.push("/login");
      return;
    }

    // Check if user has enough credits
    if (!membership || membership.credits - membership.credits_used < 1) {
      showError("Otillräckliga krediter", "Du behöver minst 1 kredit för att checka in. Uppgradera ditt medlemskap.");
      return;
    }

    // Check if user already has an active booking (confirmed status) that hasn't been used
    const activeBookings = userBookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        // Check for class bookings in the future
        ((booking.classes &&
          new Date(booking.classes.start_time) > new Date()) ||
          // Check for direct visit bookings within 24 hours
          (!booking.classes &&
            new Date(booking.created_at).getTime() + 24 * 60 * 60 * 1000 >
              new Date().getTime()))
    );

    if (activeBookings.length > 0) {
      showError("Aktiv bokning hittades", "Du har redan en aktiv bokning. Använd den innan du skapar en ny.");
      return;
    }

    try {
      const result = await bookDirectVisit.mutateAsync({
        userId: auth.user.id,
        clubId: id as string,
        creditsToUse: 1,
      });

      if (result.bookingData && result.bookingData.length > 0) {
        const newBooking = {
          id: result.bookingData[0].id,
          user_id: auth.user.id,
          class_id: "",
          credits_used: 1,
          status: "confirmed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          clubs: {
            name: club?.name || "Anläggning",
            image_url: club?.club_images?.[0]?.url || undefined,
          },
        };

        // Set the current booking and show the CheckInModal
        setCurrentBooking(newBooking);
        setShowCheckInModal(true);
      }
    } catch (error) {
      console.error("Failed to book direct visit:", error);
      showError("Incheckning misslyckades", "kunde inte slutföra din incheckning. Försök igen.");
    }
  };

  const handleViewOnMap = () => {
    if (club?.latitude && club?.longitude) {
      router.push({
        pathname: ROUTES.MAP,
        params: {
          focusClubId: club.id,
          latitude: club.latitude.toString(),
          longitude: club.longitude.toString(),
          clubName: club.name,
          clubAddress: club.address || "",
        },
      } as any);
    } else {
      router.push("/(user)/map" as any);
    }
  };

  if (isLoadingClub || !club) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  // Transform classes to match the expected format
  const transformedClasses =
    classes?.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      time: formatSwedishTime(classItem.start_time),
      duration: `${classItem.duration} min`,
      intensity: classItem.intensity as "Low" | "Medium" | "High",
      spots: classItem.max_participants - (classItem.current_participants || 0),
    })) || [];

  // Transform reviews to match the expected format
  const transformedReviews =
    reviews?.map((review) => ({
      id: review.id,
      user: `${review.profiles?.first_name || ""} ${
        review.profiles?.last_name || ""
      }`.trim(),
      avatar: review.profiles?.avatar_url || "https://via.placeholder.com/40",
      rating: review.rating,
      date: format(new Date(review.created_at), "MMM d, yyyy"),
      text: review.comment || "",
      user_id: review.user_id, // Add user_id for ownership checking
    })) || [];

  // Ensure images array is string[]
  const images = club.club_images?.map((img: ClubImage) => img.url) || [];

  if (images.length === 0 && club.image_url) {
    images.push(club.image_url);
  }

  const formatAllOpeningHours = () => {
    if (!club.open_hours) return [];

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayLabels = [
      "Måndag",
      "Tisdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "Lördag",
      "Söndag",
    ];

    const result = [];
    let rangeStart = 0;

    while (rangeStart < days.length) {
      const currentHours = club.open_hours[days[rangeStart]] || "Closed";
      let rangeEnd = rangeStart;

      // Find the end of the range with the same hours
      while (
        rangeEnd + 1 < days.length &&
        (club.open_hours[days[rangeEnd + 1]] || "Closed") === currentHours
      ) {
        rangeEnd++;
      }

      // Format the day label
      const dayRange =
        rangeStart === rangeEnd
          ? dayLabels[rangeStart]
          : `${dayLabels[rangeStart]}–${dayLabels[rangeEnd]}`;

      result.push(
        `${dayRange}: ${currentHours === "Closed" ? "Stängt" : currentHours}`
      );
      rangeStart = rangeEnd + 1;
    }

    return result;
  };

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <EnhancedFacilityHeader
        isBookmarked={isFavorite}
        onToggle={handleToggleFavorite}
        facilityName={club.name}
        showDailyAccess={hasDailyAccessEligibility}
        isInDailyAccess={isInDailyAccess}
        canAddMoreGyms={canAddMoreGyms}
        onDailyAccessToggle={handleDailyAccessToggle}
        isDailyAccessLoading={dailyAccessLoading}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <EnhancedPosterCarousel images={images} facilityName={club.name} />

        <View className="px-4 pt-5">
          <EnhancedFacilityDetails
            facility={{
              type: club.type,
              name: club.name,
              rating: club.avg_rating || 0,
              reviewCount: reviews?.length || 0,
              address: club.address || "",
              openingHours: formatAllOpeningHours().join("\n"),
              credits: club.credits,
              description: club.description || "",
            }}
            club={club}
            onViewOnMap={handleViewOnMap}
          />
          <FacilityAmenities />
          <FacilityClasses
            facilityName={club.name}
            images={images}
            facilityId={club.id}
          />
          {showAddReview ? (
            <EnhancedAddReview
              onSubmit={handleSubmitReview}
              onCancel={() => setShowAddReview(false)}
              isSubmitting={addReview.isPending}
              facilityName={club.name}
            />
          ) : (
            <EnhancedReviews
              reviews={transformedReviews}
              id={club.id}
              onToggleAddReview={() => setShowAddReview(!showAddReview)}
            />
          )}
        </View>
      </ScrollView>

      {/* Fixed Buttons at Bottom */}
      <View className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-background/95 backdrop-blur-sm">
        <View className="px-4">
          <FloatingActionButton
            variant="checkin"
            onPress={handleDirectVisitBooking}
            credits={
              membership ? membership.credits - membership.credits_used : 0
            }
            facilityName={club.name}
            isVisible={!showAddReview && auth.user !== null}
            position="bottom-center"
          />
        </View>
      </View>

      {/* Check-In Modal */}
      <CheckInModal
        visible={showCheckInModal}
        booking={currentBooking}
        onClose={() => {
          setShowCheckInModal(false);
          setCurrentBooking(null);
        }}
      />
    </SafeAreaWrapper>
  );
}
