import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { SafeAreaWrapper } from '@shared/components/SafeAreaWrapper';
import { FacilityCard, LocationModal, MapHeader, getCustomMapStyle } from '@shared/components/map';
import colors from '@shared/constants/custom-colors';
import { useMapLogic } from '@shared/hooks/useMapLogic';
import { Club } from '@shared/types';
import { isClubOpenNow } from '@shared/utils/openingHours';

// Local CustomMarker component - must be in mobile app to avoid loading react-native-maps at app startup
interface CustomMarkerProps {
  club: Club;
  onPress: () => void;
  distance: number | null;
}

const CustomMarker = ({ club, onPress, distance }: CustomMarkerProps) => {
  const isOpen = isClubOpenNow(club);
  const imageUrl =
    club.club_images?.find((img) => img.type === 'avatar')?.url ||
    club.avatar_url ||
    club.image_url;

  return (
    <Marker
      key={club.id}
      coordinate={{
        latitude: club.latitude!,
        longitude: club.longitude!,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View className="items-center">
        <View className="relative">
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: isOpen ? colors.accentGreen : colors.borderGray,
              backgroundColor: colors.surface,
            }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 24 }}>🏋️</Text>
              </View>
            )}
          </View>

          {/* Status indicator dot */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: isOpen ? colors.accentGreen : colors.borderGray,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />

          {/* Pointed bottom */}
          <View
            style={{
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid',
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 12,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: isOpen ? colors.accentGreen : colors.borderGray,
              alignSelf: 'center',
              marginTop: -1,
            }}
          />
        </View>

        {/* Distance badge */}
        {distance !== null && (
          <View
            style={{
              marginTop: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.borderGray,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
              {distance.toFixed(1)} km
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

export default function MapScreen() {
  const params = useLocalSearchParams();

  const { focusClubId, focusLatitude, focusLongitude, clubName, clubAddress } = useMemo(
    () => ({
      focusClubId: params.focusClubId as string | undefined,
      focusLatitude: params.latitude as string | undefined,
      focusLongitude: params.longitude as string | undefined,
      clubName: params.clubName as string | undefined,
      clubAddress: params.clubAddress as string | undefined,
    }),
    [params.focusClubId, params.latitude, params.longitude, params.clubName, params.clubAddress]
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
  }, [focusClubId, focusLatitude, focusLongitude, allClubs.length, openFacilityCard]);

  // Animate to new region if city/location changes (only if not focusing on a specific club)
  useEffect(() => {
    if (mapRef.current && mapRegion && !hasCenteredMap.current && !focusClubId) {
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
  }, [visibleClubs, location?.latitude, location?.longitude, calculateDistance]);

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

        {isDataReady &&
          (Platform.OS === 'web' ? (
            <View className="flex-1 items-center justify-center">
              <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 32 }}>
                Kartan är inte tillgänglig på webben ännu.
              </Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={mapRegion}
              showsUserLocation
              showsMyLocationButton
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
          ))}

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
