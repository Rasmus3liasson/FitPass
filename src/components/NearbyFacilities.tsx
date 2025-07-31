import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubs } from "@/src/hooks/useClubs";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLocationService } from "@/src/services/locationService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Club } from "../types";

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
          console.error(
            "Failed to initialize location in NearbyFacilities:",
            error
          );
          setHasInitializedLocation(true); // Set to true to prevent infinite retries
        }
      }
    };

    setupLocation();
  }, [
    userProfile?.id,
    userProfile?.enable_location_services,
    hasInitializedLocation,
    initializeLocation,
  ]);

  // Get nearby clubs within 5km radius
  const { data: nearbyClubs, isLoading: isLoadingNearby } = useClubs({
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: 5,
  });

  // Get all clubs for fallback (sorted by distance)
  const { data: allClubs, isLoading: isLoadingAll } = useClubs({
    latitude: location?.latitude,
    longitude: location?.longitude,
    // No radius limit - get all clubs with distance calculated
  });

  // Smart club selection logic
  const clubsToShow = React.useMemo(() => {
    if (!allClubs) return [];

    // Sort all clubs by distance
    const sortedClubs = [...allClubs].sort((a, b) => {
      const distanceA = a.distance || Infinity;
      const distanceB = b.distance || Infinity;
      return distanceA - distanceB;
    });

    // If we have nearby clubs (within 5km), show them all
    if (nearbyClubs && nearbyClubs.length > 0) {
      const nearbyIds = new Set(nearbyClubs.map((club) => club.id));
      const nearby = sortedClubs.filter((club) => nearbyIds.has(club.id));

      // Add up to 3 more clubs from outside the radius
      const outsideRadius = sortedClubs
        .filter((club) => !nearbyIds.has(club.id))
        .slice(0, 3);

      return [...nearby, ...outsideRadius];
    }

    // If no nearby clubs, show first 6 closest clubs
    return sortedClubs.slice(0, 6);
  }, [nearbyClubs, allClubs]);

  const isLoading = isLoadingNearby || isLoadingAll;

  return (
    <Section
      title="Facilities"
      description="Explore available fitness locations"
      actionText="View Map"
      onAction={() => router.push(ROUTES.MAP as any)}
    >
      <ScrollView
        className="mt-4"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {isLoading ? (
          <Text className="text-gray-400">Loading facilities...</Text>
        ) : clubsToShow && clubsToShow.length > 0 ? (
          clubsToShow.map((club: Club) => {
            return (
              <FacilityCard
                key={club.id}
                name={club.name}
                type={club.type}
                image={club.image_url ?? ""}
                open_hours={club.open_hours}
                rating={club.avg_rating || 0}
                distance={
                  club.distance && club.distance <= 1000
                    ? `${club.distance.toFixed(1)} km`
                    : undefined
                }
                onPress={() => router.push(ROUTES.FACILITY(club.id) as any)}
              />
            );
          })
        ) : (
          <Text className="text-gray-400 text-center py-4">
            No facilities found
          </Text>
        )}
      </ScrollView>
    </Section>
  );
};
