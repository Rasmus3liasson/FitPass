import React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import colors from '../../constants/custom-colors';
import { Club } from '../../types';
import { isClubOpenNow } from '../../utils/openingHours';

interface CustomMarkerProps {
  club: Club;
  onPress: () => void;
  distance: number | null;
}

export const CustomMarker = ({ club, onPress, distance }: CustomMarkerProps) => {
  // Return null for web - maps are mobile-only
  if (Platform.OS === 'web') {
    return null;
  }

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
