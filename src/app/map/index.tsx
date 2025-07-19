import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useMapLogic } from "@/src/hooks/useMapLogic";

export default function MapScreen() {
  const {
    // State
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
    clubs,
    clubsLoading,

    openFacilityCard,
    closeFacilityCard,
    handleCitySelection,
    useCurrentLocation,
    updateMapRegion,
    calculateDistance,

    setIsLocationModalVisible,
  } = useMapLogic();

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* <MapHeader
          isLoadingLocation={isLoadingLocation}
          isUsingCustomLocation={isUsingCustomLocation}
          selectedCity={selectedCity}
          locationAddress={location?.address}
          onLocationPress={() => setIsLocationModalVisible(true)}
        />

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
          {clubs
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
        /> */}
      </View>
    </SafeAreaWrapper>
  );
}
