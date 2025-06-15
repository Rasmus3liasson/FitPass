import { useAuth } from "@/src/hooks/useAuth";
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
import { format, parse } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View
} from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import AddReview from "@/src/app/facility/addReview";
import { FacilityAmenities } from "./amenties";
import { FacilityActions } from "./facilityActions";
import { FacilityClasses } from "./facilityClasses";
import { FacilityDetails } from "./facilityDetails";
import { FacilityHeader } from "./facilityHeader";
import { PosterCarousel } from "./posterCarousel";
import { Reviews } from "./reviews";

export default function FacilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const auth = useAuth();
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
  const { data: isFavorite } = useIsFavorite(auth.user?.id || "", id as string);

  // Favorite mutations
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addReview = useAddReview();

  const handleToggleFavorite = async () => {
    if (!auth.user?.id) {
      router.push("/login/");
      return;
    }

    if (isFavorite) {
      await removeFavorite.mutate({
        userId: auth.user.id,
        clubId: id as string,
      });
    } else {
      await addFavorite.mutate({ userId: auth.user.id, clubId: id as string });
    }
  };

  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    if (!auth.user?.id) {
      router.push("/login/");
      return;
    }

    try {
      await addReview.mutateAsync({
        userId: auth.user.id,
        clubId: id as string,
        rating,
        comment,
      });
    } catch (error) {
      console.error("Error submitting review:", error);
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
      time: format(new Date(classItem.start_time), "h:mm a"),
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
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: review.rating,
      date: format(new Date(review.created_at), "MMM d, yyyy"),
      text: review.comment || "",
    })) || [];

  // Ensure images array is string[]
  const images = (club.photos ||
    [club.image_url].filter(Boolean) ||
    []) as string[];

  // Format opening hours
  const formatOpeningHours = () => {
    if (!club.open_hours) return "Closed";

    try {
      // Get today's day of week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      const dayKey = Object.keys(club.open_hours)[today];
      const hours = club.open_hours[dayKey];

      if (!hours) return "Closed";

      // Parse the time string (e.g., "09:00") and format it
      const [openTime, closeTime] = hours
        .split("-")
        .map((time) =>
          format(parse(time.trim(), "HH:mm", new Date()), "h:mm a")
        );

      return `${openTime} - ${closeTime}`;
    } catch (error) {
      console.error("Error formatting opening hours:", error);
      return "Hours vary";
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />

      <FacilityHeader
        isBookmarked={isFavorite || false}
        onToggle={handleToggleFavorite}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <PosterCarousel images={images} />

        <View className="px-4 pt-5 pb-10">
          <FacilityDetails
            facility={{
              type: club.type,
              name: club.name,
              rating: club.avg_rating || 0,
              reviewCount: reviews?.length || 0,
              address: club.address || "",
              hours: formatOpeningHours(),
              credits: 1, // This should come from the membership plan
              description: club.description || "",
            }}
          />
          <FacilityAmenities />
          <FacilityClasses
            classes={transformedClasses}
            facilityName={club.name}
            images={images}
          />
          <Reviews reviews={transformedReviews} id={club.id} />
          <AddReview
            onSubmit={handleSubmitReview}
            isSubmitting={addReview.isPending}
          />
          <FacilityActions id={club.id} />
          
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
