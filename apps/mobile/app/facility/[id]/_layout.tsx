import { colors } from "@shared";
import { BookVisitButton } from "@shared/components/BookVisitButton";
import { CheckInModal } from "@shared/components/CheckInModal";
import { CustomAlert } from "@shared/components/CustomAlert";
import { FriendsAtFacility } from "@shared/components/FriendsAtFacility";
import { useAuth } from "@shared/hooks/useAuth";
import { useBookDirectVisit, useUserBookings } from "@shared/hooks/useBookings";
import {
  useAddReview,
  useClub,
  useClubClasses,
  useClubReviews,
} from "@shared/hooks/useClubs";
import {
  useAddDailyAccessGym,
  useDailyAccessGyms,
  useDailyAccessStatus,
  useGymDailyAccessStatus,
  useRemoveDailyAccessGym,
} from "@shared/hooks/useDailyAccess";
import {
  useAddFavorite,
  useFriendsWhoFavoritedClub,
  useIsFavorite,
  useRemoveFavorite,
} from "@shared/hooks/useFavorites";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useMembership } from "@shared/hooks/useMembership";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { EnhancedAddReview } from "../EnhancedAddReview";
import { EnhancedFacilityDetails } from "../EnhancedFacilityDetails";
import { EnhancedFacilityHeader } from "../EnhancedFacilityHeader";
import { EnhancedPosterCarousel } from "../EnhancedPosterCarousel";
import { EnhancedReviews } from "../EnhancedReviews";

import { ROUTES } from "@shared/config/constants";
import { ClubImage } from "@shared/types";
import { formatSwedishTime } from "@shared/utils/time";
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
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: "default" | "destructive" | "warning";
  }>({ visible: false, title: "" });
  const { showSuccess, showError, showInfo, hideFeedback } =
    useGlobalFeedback();

  // Daily Access hooks
  const { data: dailyAccessStatus } = useDailyAccessStatus(auth.user?.id);
  const { data: dailyAccessGyms } = useDailyAccessGyms(auth.user?.id);
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
  const canAddMoreGyms = true;

  useEffect(() => {}, [
    gymStatus,
    isInDailyAccess,
    hasDailyAccessEligibility,
    dailyAccessLoading,
    id,
    auth.user?.id,
  ]);

  const handleDailyAccessToggle = async () => {
    if (!auth.user?.id || !id || !club) return;

    try {
      if (isInDailyAccess) {
        await removeGymMutation.mutateAsync({
          userId: auth.user.id,
          gymId: id as string,
        });
        showSuccess(
          "Gym borttaget",
          `${club.name} har tagits bort från din Daily Access`
        );
      } else {
        // Add the gym
        await addGymMutation.mutateAsync({
          userId: auth.user.id,
          gymId: id as string,
        });
        
        // Check if user has active gyms after adding (data will be stale, need to check from mutation result)
        // Since we can't easily get fresh data here, we'll check the current state
        const currentActiveCount = dailyAccessGyms?.current?.length || 0;
        
        // If user has no active gyms, they need to confirm their selection
        if (currentActiveCount === 0) {
          showSuccess(
            "Gym tillagt!",
            `${club.name} har lagts till i din Daily Access. Bekräfta dina gym-val för att börja använda dina krediter.`,
            {
              buttonText: "Bekräfta klubb-val",
              onButtonPress: () => {
                hideFeedback();
                router.push(`${ROUTES.PROFILE_MEMBERSHIP_MANAGEMENT}?openModal=true` as any);
              },
              secondaryButtonText: "Fortsätt söka",
              onSecondaryButtonPress: () => {
                hideFeedback();
              }
            }
          );
        } else {
          // User already has active gyms, just show simple success
          showSuccess(
            "Gym tillagt",
            `${club.name} har lagts till i din Daily Access och kommer aktiveras nästa faktureringsperiod.`
          );
        }
      }
    } catch (error: any) {
      // Check if it's a duplicate gym error
      if (error.message?.includes("redan valt")) {
        showInfo(
          "Gym redan valt",
          `${club.name} är redan tillagt i din Daily Access.`,
          {
            buttonText: "OK",
            onButtonPress: () => {},
          }
        );
      } else if (error.message?.includes("nått max antal")) {
        showError(
          "Max antal gym",
          "Du har redan valt 3 gym för Daily Access. Ta bort ett gym för att lägga till ett nytt."
        );
      } else {
        setAlertConfig({
          visible: true,
          title: "Fel",
          message: error.message || "Kunde inte uppdatera Daily Access",
          type: "destructive",
        });
      }
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
  const { data: friendsWhoFavorited = [] } = useFriendsWhoFavoritedClub(
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
      router.push(ROUTES.LOGIN as any);
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
      router.push(ROUTES.LOGIN as any);
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
      router.push(ROUTES.LOGIN as any);
      return;
    }
    setShowCheckInModal(true);
  };

  const handleDirectVisitBooking = async () => {
    if (!auth.user?.id) {
      router.push(ROUTES.LOGIN as any);
      return;
    }

    // Check if user has enough credits
    if (!membership || membership.credits - membership.credits_used < 1) {
      showError(
        "Otillräckliga krediter",
        "Du behöver minst 1 kredit för att checka in. Uppgradera ditt medlemskap."
      );
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
      showError(
        "Aktiv bokning hittades",
        "Du har redan en aktiv bokning. Använd den innan du skapar en ny."
      );
      return;
    }

    try {
      const result = await bookDirectVisit.mutateAsync({
        userId: auth.user.id,
        clubId: id as string,
        creditsToUse: 1,
      });

      if (result.bookingData) {
        const newBooking = {
          ...result.bookingData,
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          clubs: {
            name: club?.name || "Anläggning",
            image_url: club?.club_images?.[0]?.url || undefined,
          },
        };

        // Set the current booking first
        setCurrentBooking(newBooking);

        // Show success feedback with button to open CheckInModal
        showSuccess(
          "Biljett skapad!",
          `Din incheckning-biljett för ${club?.name} är nu redo! Biljetten gäller i 24 timmar. Använd QR-koden för att checka in på gymmet.`,
          {
            buttonText: "Visa biljett",
            onButtonPress: () => {
              hideFeedback();
              setShowCheckInModal(true);
            },
          }
        );
      }
    } catch (error) {
      // Check if it's a Daily Access validation error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("bekräfta dina Daily Access gym-val")) {
        showInfo(
          "Bekräfta dina gym-val",
          "Du måste bekräfta dina Daily Access gym-val innan du kan boka. Vill du gå till din kreditfördelning och bekräfta dina val?",
          {
            buttonText: "Gå till kreditfördelning",
            onButtonPress: () => {
              hideFeedback();
              router.push(ROUTES.PROFILE_MEMBERSHIP_MANAGEMENT as any);
            },
            secondaryButtonText: "Fortsätt söka",
            onSecondaryButtonPress: () => {
              hideFeedback();
              router.back();
            }
          }
        );
      } else if (errorMessage.includes("inte inkluderat i din Daily Access")) {
        showInfo(
          "Gym ej inkluderat",
          `${club?.name} är inte inkluderat i din Daily Access. Du kan endast boka på gym som du har valt i din Daily Access-fördelning.`,
          {
            buttonText: "Hantera gym-val",
            onButtonPress: () => {
              hideFeedback();
              router.push(ROUTES.PROFILE_MEMBERSHIP_MANAGEMENT as any);
            },
            secondaryButtonText: "Fortsätt söka",
            onSecondaryButtonPress: () => {
              hideFeedback();
              router.back();
            }
          }
        );
      } else {
        showError(
          "Incheckning misslyckades",
          errorMessage || "Kunde inte slutföra din incheckning. Försök igen."
        );
      }
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
      router.push(ROUTES.MAP as any);
    }
  };

  if (isLoadingClub || !club) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
    <SafeAreaWrapper edges={["bottom"]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <EnhancedPosterCarousel images={images} facilityName={club.name} />

        <EnhancedFacilityHeader
          isBookmarked={isFavorite}
          onToggle={handleToggleFavorite}
          facilityName={club.name}
          showDailyAccess={hasDailyAccessEligibility}
          isInDailyAccess={isInDailyAccess}
          canAddMoreGyms={canAddMoreGyms}
          onDailyAccessToggle={handleDailyAccessToggle}
          isDailyAccessLoading={dailyAccessLoading}
          gymStatus={gymStatus?.status}
        />

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
          <FriendsAtFacility friends={friendsWhoFavorited} />

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
      <BookVisitButton
        onPress={handleDirectVisitBooking}
        credits={membership ? membership.credits - membership.credits_used : 0}
        facilityName={club.name}
        isVisible={!showAddReview && !!auth.user}
      />
      {/* Check-In Modal - Only render when actually needed */}
      {showCheckInModal && currentBooking ? (
        <CheckInModal
          key={`checkin-modal-${currentBooking.id}`}
          visible={true}
          booking={currentBooking}
          onClose={() => {
            console.log("Closing CheckInModal - clearing all state");
            setShowCheckInModal(false);
            setCurrentBooking(null);
          }}
        />
      ) : null}
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ visible: false, title: "" })}
        buttons={[{ text: "OK" }]}
      />
    </SafeAreaWrapper>
  );
}
