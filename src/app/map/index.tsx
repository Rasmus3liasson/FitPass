import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import MapView from "react-native-maps";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import {
  CustomMarker,
  FacilityCard,
  getCustomMapStyle,
  LocationModal,
  MapHeader,
} from "@/src/components/map";
import { useMapLogic } from "@/src/hooks/useMapLogic";
import { Club } from "@/src/types";

export default function MapScreen() {
  const params = useLocalSearchParams();
  const {
    focusClubId,
    latitude: focusLatitude,
    longitude: focusLongitude,
    clubName,
    clubAddress,
  } = params as {
    focusClubId?: string;
    latitude?: string;
    longitude?: string;
    clubName?: string;
    clubAddress?: string;
  };

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
  const [hasCenteredMap, setHasCenteredMap] = useState(false);
  const [hasHandledFocusClub, setHasHandledFocusClub] = useState(false);

  // Always show all clubs on the map, regardless of selected city or location
  useEffect(() => {
    setVisibleClubs(allClubs);
  }, [allClubs]);

  // Handle focus club navigation from other screens
  useEffect(() => {
    if (
      focusClubId &&
      focusLatitude &&
      focusLongitude &&
      allClubs.length > 0 &&
      mapRef.current &&
      !hasHandledFocusClub
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

        setHasHandledFocusClub(true);
      }
    }
  }, [focusClubId, focusLatitude, focusLongitude, allClubs, hasHandledFocusClub, openFacilityCard]);

  // Animate to new region if city/location changes (only if not focusing on a specific club)
  useEffect(() => {
    if (mapRef.current && mapRegion && !hasCenteredMap && !focusClubId) {
      mapRef.current.animateToRegion(mapRegion, 500);
      setHasCenteredMap(true);
    }
  }, [mapRegion, focusClubId, hasCenteredMap]);

  const isDataReady = mapRegion && allClubs.length > 0;

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
            userLocationAnnotationTitle="You are here"
          >
            {visibleClubs
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

                return (
                  <CustomMarker
                    key={club.id}
                    club={club}
                    distance={distance}
                    onPress={() => openFacilityCard(club)}
                  />
                );
              })}
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
