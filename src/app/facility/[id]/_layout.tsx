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
  useAddFavorite,
  useIsFavorite,
  useRemoveFavorite,
} from "@/src/hooks/useFavorites";
import { useMembership } from "@/src/hooks/useMembership";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Toast from "react-native-toast-message";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { EnhancedAddReview } from "../EnhancedAddReview";
import { EnhancedFacilityDetails } from "../EnhancedFacilityDetails";
import { EnhancedFacilityHeader } from "../EnhancedFacilityHeader";
import { EnhancedPosterCarousel } from "../EnhancedPosterCarousel";
import { EnhancedReviews } from "../EnhancedReviews";

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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      Toast.show({
        type: 'error',
        text1: 'Insufficient Credits',
        text2: 'You need at least 1 credit to check in. Please upgrade your membership.',
      });
      return;
    }

    // Check if user already has an active booking (confirmed status) that hasn't been used
    const activeBookings = userBookings.filter(booking => 
      booking.status === "confirmed" && (
        // Check for class bookings in the future
        (booking.classes && new Date(booking.classes.start_time) > new Date()) ||
        // Check for direct visit bookings within 24 hours
        (!booking.classes && new Date(booking.created_at).getTime() + 24 * 60 * 60 * 1000 > new Date().getTime())
      )
    );

    if (activeBookings.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Active Booking Found',
        text2: 'You already have an active booking. Please use it before creating a new one.',
      });
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
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          clubs: {
            name: club?.name || "Facility",
            image_url: club?.club_images?.[0]?.url || undefined,
          },
        };

        // Set the current booking and show the CheckInModal
        setCurrentBooking(newBooking);
        setShowCheckInModal(true);
      }
    } catch (error) {
      console.error("Failed to book direct visit:", error);
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: 'Could not complete your check-in. Please try again.',
      });
    }
  };

  const handleViewOnMap = () => {
    // For now, just navigate to the map screen
    // In a real implementation, you would pass coordinates via query params
    router.push("/(user)/map" as any);
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
    })) || [];

  // Ensure images array is string[]
  const images = club.club_images?.map((img: ClubImage) => img.url) || [];

  if (images.length === 0 && club.image_url) {
    images.push(club.image_url);
  }

  // Format opening hours
  const formatOpeningHours = () => {
    if (!club.open_hours) return "Closed";

    try {
      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const today = new Date().getDay();
      const dayKey = days[today];
      const hours = club.open_hours[dayKey];

      if (!hours) return "Closed";

      return hours;
    } catch (error) {
      console.error("Error formatting opening hours:", error);
      return "Hours vary";
    }
  };

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
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
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

      result.push(`${dayRange}: ${currentHours}`);
      rangeStart = rangeEnd + 1;
    }

    return result;
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />

      <EnhancedFacilityHeader
        isBookmarked={isFavorite}
        onToggle={handleToggleFavorite}
        facilityName={club.name}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <EnhancedPosterCarousel 
          images={images} 
          facilityName={club.name}
        />

        <View className="px-4 pt-5 pb-10">
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

      {/* Floating Check-In Button */}
      <FloatingActionButton
        variant="checkin"
        onPress={handleDirectVisitBooking}
        credits={membership ? membership.credits - membership.credits_used : 0}
        facilityName={club.name}
        isVisible={!showAddReview && auth.user !== null}
      />

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
