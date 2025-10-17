import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubs } from "@/src/hooks/useClubs";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLocationService } from "@/src/services/locationService";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Club, ClubImage } from "../types";

export const NearbyFacilities = () => {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile } = useUserProfile(auth.user?.id || "");
  const { location, initializeLocation } = useLocationService();
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  
  // Initialize location when user profile is available
  useEffect(() => {
    const setupLocation = async () => {
      if (userProfile !== undefined && !hasInitializedLocation) {
        try {
          await initializeLocation(userProfile);
          setHasInitializedLocation(true);
        } catch (error) {
          console.error("Failed to initialize location in NearbyFacilities:", error);
          setHasInitializedLocation(true); // Set to true to prevent infinite retries
        }
      }
    };

    setupLocation();
  }, [userProfile?.id, userProfile?.enable_location_services, hasInitializedLocation, initializeLocation]);
  
  // First try to get nearby clubs, then fallback to all clubs if none found
  const { data: nearbyClubs, isLoading: isLoadingNearby } = useClubs({
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: 5,
  });

  // Fallback query for all clubs when no nearby clubs are found
  const { data: allClubs, isLoading: isLoadingAll } = useClubs({
    // No location filters - get all clubs
  });

  // Determine which clubs to show and loading state
  const clubsToShow = nearbyClubs && nearbyClubs.length > 0 ? nearbyClubs : allClubs;
  const isLoading = isLoadingNearby || (nearbyClubs?.length === 0 && isLoadingAll);
  const showingFallback = nearbyClubs?.length === 0 && allClubs && allClubs.length > 0;

  return (
    <Section
      title={showingFallback ? "All Facilities" : "Nearby Facilities"}
      description={
        showingFallback 
          ? "Explore all available locations"
          : "Check out these locations close to you"
      }
      actionText="View Map"
      onAction={() => router.push(ROUTES.MAP as any)}
    >
      <ScrollView
        className="mt-4"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {isLoading ? (
          <Text className="text-textSecondary">Loading facilities...</Text>
        ) : clubsToShow && clubsToShow.length > 0 ? (
          clubsToShow.map((club: Club) => {
            const avatarImage = club.club_images?.find(
              (img: ClubImage) => img.type === "avatar"
            );
            const imageUri =
              avatarImage?.url ||
              club.avatar_url ||
              "https://via.placeholder.com/150";

            return (
                            <FacilityCard
                key={club.id}
                name={club.name}
                type={club.type}
                image={club.image_url ?? ""}
                club_images={club.club_images}
                avatar_url={club.avatar_url}
                open_hours={club.open_hours}
                rating={club.avg_rating || 0}
                distance={
                  club.distance !== undefined && club.distance !== null
                    ? `${club.distance.toFixed(1)} km`
                    : undefined
                }
                onPress={() => router.push(ROUTES.FACILITY(club.id) as any)}
              />
            );
          })
        ) : (
          <Text className="text-textSecondary text-center py-4">
            No facilities found
          </Text>
        )}
      </ScrollView>
    </Section>
  );
};
