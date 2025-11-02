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
          const result = await initializeLocation(userProfile);

          setHasInitializedLocation(true);
        } catch (error) {
          console.error(
            "🚨 Failed to initialize location in NearbyFacilities:",
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

  // Get all clubs and calculate distance client-side
  const { data: allClubs, isLoading } = useClubs();

  // Calculate distance and filter clubs within 10 Swedish miles (100km)
  const clubsToShow = React.useMemo(() => {
    if (!allClubs) return [];

    // If no location, show first 8 clubs without distance
    if (!location?.latitude || !location?.longitude) {
      return allClubs
        .slice(0, 8)
        .map((club) => ({ ...club, distance: undefined }));
    }

    // Helper function to calculate distance using Haversine formula
    const calculateDistance = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Calculate distance for each club
    const clubsWithDistance = allClubs.map((club) => {
      if (club.latitude && club.longitude) {
        const distance = calculateDistance(
          location.latitude!,
          location.longitude!,
          club.latitude,
          club.longitude
        );

        return { ...club, distance };
      } else {
        return { ...club, distance: undefined };
      }
    });

    // Filter within 100km (10 Swedish miles) and sort by distance
    const nearbyClubs = clubsWithDistance
      .filter((club) => club.distance !== undefined && club.distance <= 100)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 8);

    // If no clubs within range, show closest 8 clubs
    if (nearbyClubs.length === 0) {
      return clubsWithDistance
        .filter((club) => club.distance !== undefined)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 8);
    }

    return nearbyClubs;
  }, [allClubs, location]);

  return (
    <Section
      title="Anläggningar"
      description="Utforska tillgängliga träningsplatser"
      actionText="Visa karta"
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
            return (
              <FacilityCard
                key={club.id}
                name={club.name}
                type={club.type}
                image={club.image_url ?? ""}
                open_hours={club.open_hours}
                rating={club.avg_rating || 0}
                distance={
                  club.distance !== undefined &&
                  club.distance !== null &&
                  club.distance > 0
                    ? `${club.distance.toFixed(1)} km`
                    : undefined
                }
                club_images={club.club_images}
                avatar_url={club.avatar_url}
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
