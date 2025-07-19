import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import MapView from "react-native-maps";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import {
  CustomMarker,
  FacilityCard,
  LocationModal,
  MapHeader,
  getCustomMapStyle
} from "@/src/components/map";
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
    
    // Data
    cities,
    citiesLoading,
    location,
    isLoadingLocation,
    clubs,
    clubsLoading,
    
    // Functions
    openFacilityCard,
    closeFacilityCard,
    handleCitySelection,
    useCurrentLocation,
    updateMapRegion,
    calculateDistance,
    
    // Setters
    setIsLocationModalVisible,
  } = useMapLogic();

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Header */}
        <MapHeader
          isLoadingLocation={isLoadingLocation}
          isUsingCustomLocation={isUsingCustomLocation}
          selectedCity={selectedCity}
          locationAddress={location?.address}
          onLocationPress={() => setIsLocationModalVisible(true)}
        />

        {/* Map */}
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
            .filter(club => club.latitude && club.longitude)
            .map((club) => {
              const distance = location && club.latitude && club.longitude 
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
              })
          }
        </MapView>

        {/* Facility card UI */}
        <FacilityCard
          facility={selectedFacility}
          isVisible={facilityVisible}
          slideAnim={slideAnim}
          onClose={closeFacilityCard}
        />

        {/* Location Selection Modal */}
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
