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

  // Filter clubs based on city or location
  useEffect(() => {
    if (selectedCity) {
      setVisibleClubs(
        allClubs.filter((club) => club.city === selectedCity.name)
      );
    } else {
      setVisibleClubs(nearbyClubs.length > 0 ? nearbyClubs : allClubs);
    }
  }, [selectedCity, allClubs, nearbyClubs]);

  // Animate to new region if city/location changes
  useEffect(() => {
    if (mapRef.current && mapRegion && !hasCenteredMap) {
      mapRef.current.animateToRegion(mapRegion, 500);
      setHasCenteredMap(true);
    }
  }, [mapRegion]);

  const isDataReady =
    mapRegion &&
    (allClubs.length > 0 || nearbyClubs.length > 0 || visibleClubs.length > 0);

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
            key={visibleClubs.map((c) => c.id).join(",")}
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
