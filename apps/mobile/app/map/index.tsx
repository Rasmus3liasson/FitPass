import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import MapView from "react-native-maps";

import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import {
    CustomMarker,
    FacilityCard,
    getCustomMapStyle,
    LocationModal,
    MapHeader,
} from "@shared/components/map";
import { useMapLogic } from "@shared/hooks/useMapLogic";
import { Club } from "@shared/types";

export default function MapScreen() {
  const params = useLocalSearchParams();

  const { focusClubId, focusLatitude, focusLongitude, clubName, clubAddress } =
    useMemo(
      () => ({
        focusClubId: params.focusClubId as string | undefined,
        focusLatitude: params.latitude as string | undefined,
        focusLongitude: params.longitude as string | undefined,
        clubName: params.clubName as string | undefined,
        clubAddress: params.clubAddress as string | undefined,
      }),
      [
        params.focusClubId,
        params.latitude,
        params.longitude,
        params.clubName,
        params.clubAddress,
      ]
    );

  const {
    isLocationModalVisible,
    selectedCity,
    isUsingCustomLocation,
    facilityVisible,
    selectedFacility,
    slideAnim,
    mapRegion,
    mapRef,

    cities,
    citiesLoading,
    location,
    isLoadingLocation,
    allClubs = [],
    nearbyClubs = [],

    openFacilityCard,
    closeFacilityCard,
    handleCitySelection,
    useCurrentLocation,
    updateMapRegion,
    calculateDistance,

    setIsLocationModalVisible,
  } = useMapLogic();

  const [visibleClubs, setVisibleClubs] = useState<Club[]>([]);
  const hasCenteredMap = useRef(false);
  const hasHandledFocusClub = useRef(false);

  // Always show all clubs on the map, regardless of selected city or location
  useEffect(() => {
    if (allClubs.length > 0) {
      setVisibleClubs(allClubs);
    }
  }, [allClubs.length]); // Only depend on length to prevent unnecessary updates

  // Handle focus club navigation from other screens
  useEffect(() => {
    if (
      focusClubId &&
      focusLatitude &&
      focusLongitude &&
      allClubs.length > 0 &&
      mapRef.current &&
      !hasHandledFocusClub.current
    ) {
      const focusClub = allClubs.find((club) => club.id === focusClubId);

      if (focusClub) {
        // Create custom region for the focused club
        const focusRegion = {
          latitude: parseFloat(focusLatitude),
          longitude: parseFloat(focusLongitude),
          latitudeDelta: 0.01, // Zoom in closer for focused view
          longitudeDelta: 0.01,
        };

        // Animate to the club location
        mapRef.current.animateToRegion(focusRegion, 1000);

        // Open the facility card for the focused club
        setTimeout(() => {
          openFacilityCard(focusClub);
        }, 500); // Small delay to let the map animation start

        hasHandledFocusClub.current = true;
      }
    }
  }, [
    focusClubId,
    focusLatitude,
    focusLongitude,
    allClubs.length,
    openFacilityCard,
  ]);

  // Animate to new region if city/location changes (only if not focusing on a specific club)
  useEffect(() => {
    if (
      mapRef.current &&
      mapRegion &&
      !hasCenteredMap.current &&
      !focusClubId
    ) {
      mapRef.current.animateToRegion(mapRegion, 500);
      hasCenteredMap.current = true;
    }
  }, [mapRegion?.latitude, mapRegion?.longitude, focusClubId]); // Only depend on specific region values

  const isDataReady = useMemo(() => {
    return mapRegion && allClubs.length > 0;
  }, [mapRegion?.latitude, mapRegion?.longitude, allClubs.length]);

  // Memoize markers to prevent recalculation on every render
  const markers = useMemo(() => {
    return visibleClubs
      .filter((club) => club.latitude && club.longitude)
      .map((club) => {
        const distance =
          location && club.latitude && club.longitude
            ? calculateDistance(
                location.latitude,
                location.longitude,
                club.latitude,
                club.longitude
              )
            : null;

        return {
          club,
          distance,
          key: club.id,
        };
      });
  }, [
    visibleClubs,
    location?.latitude,
    location?.longitude,
    calculateDistance,
  ]);

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <MapHeader
          isLoadingLocation={isLoadingLocation}
          isUsingCustomLocation={isUsingCustomLocation}
          selectedCity={selectedCity}
          locationAddress={location?.address}
          onLocationPress={() => setIsLocationModalVisible(true)}
        />

        {isDataReady && (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton
            provider="google"
            customMapStyle={getCustomMapStyle()}
            userLocationAnnotationTitle="Du är här"
          >
            {markers.map(({ club, distance, key }) => (
              <CustomMarker
                key={key}
                club={club}
                distance={distance}
                onPress={() => openFacilityCard(club)}
              />
            ))}
          </MapView>
        )}

        <FacilityCard
          facility={selectedFacility}
          isVisible={facilityVisible}
          slideAnim={slideAnim}
          onClose={closeFacilityCard}
        />

        <LocationModal
          isVisible={isLocationModalVisible}
          cities={cities}
          citiesLoading={citiesLoading}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelection}
          onUseCurrentLocation={useCurrentLocation}
          onClose={() => setIsLocationModalVisible(false)}
        />
      </View>
    </SafeAreaWrapper>
  );
}
