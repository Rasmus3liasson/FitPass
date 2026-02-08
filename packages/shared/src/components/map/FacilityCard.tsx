import { CaretRight, X } from 'phosphor-react-native';
import React from 'react';
import { Animated, Dimensions, Image, Text, View } from 'react-native';
import { ROUTES } from '../../config/constants';
import colors from '../../constants/custom-colors';
import { useNavigation } from '../../services/navigationService';
import { Club } from '../../types';
import { isClubOpenNow } from '../../utils/openingHours';
import { SmoothPressable } from '../SmoothPressable';

interface FacilityCardProps {
  facility: Club | null;
  isVisible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
}

export const FacilityCard = ({ facility, isVisible, slideAnim, onClose }: FacilityCardProps) => {
  const navigation = useNavigation();
  const windowHeight = Dimensions.get('window').height;

  if (!isVisible || !facility) return null;

  const isOpen = isClubOpenNow(facility);

  // Interpolated card height from animation value
  const cardHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  const cardOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        height: cardHeight,
        opacity: cardOpacity,
      }}
      className="bg-surface rounded-2xl border border-borderGray/10"
    >
      {/* Drag handle indicator */}
      <View className="absolute top-2 left-1/2 -ml-6 w-12 h-1 bg-borderGray/30 rounded-full" />

      {/* Close button */}
      <SmoothPressable
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-background/80 items-center justify-center"
        onPress={onClose}
      >
        <X size={16} color={colors.textSecondary} weight="bold" />
      </SmoothPressable>

      <View className="flex-row px-4 pt-6 pb-4">
        {/* Image */}
        <View className="mr-3">
          <Image
            source={{
              uri:
                facility.club_images?.find((img) => img.type === 'avatar')?.url ||
                facility.avatar_url ||
                facility.image_url ||
                'https://via.placeholder.com/150',
            }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: isOpen ? colors.accentGreen : colors.borderGray + '40',
            }}
            resizeMode="cover"
          />
          {/* Status badge on image */}
          <View
            className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full ${
              isOpen ? 'bg-accentGreen' : 'bg-borderGray'
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Text className="text-white text-[8px] font-bold">{isOpen ? 'ÖPPET' : 'STÄNGT'}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 justify-between">
          {/* Info section */}
          <View>
            {/* Type badge */}
            <View className="bg-primary/10 self-start px-2 py-0.5 rounded-md mb-1">
              <Text className="text-textPrimary text-[8px] font-bold tracking-wide">
                {facility.type || 'GYM'}
              </Text>
            </View>

            {/* Title */}
            <Text
              className="text-textPrimary text-sm font-bold mb-1 leading-tight"
              numberOfLines={2}
            >
              {facility.name}
            </Text>

            {/* Distance */}
            <View className="flex-row items-center">
              <Text className="text-textSecondary text-[10px]">
                {facility.distance ? `${facility.distance.toFixed(1)} km bort` : 'Avstånd okänt'}
              </Text>
            </View>
          </View>

          {/* Button */}
          <SmoothPressable
            className="bg-primary rounded-lg py-1.5 px-3 flex-row items-center justify-center mt-1"
            onPress={() => navigation.push(ROUTES.FACILITY(facility.id) as any)}
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text className="text-white text-[11px] font-semibold">Visa klubb</Text>
            <CaretRight size={11} color="white" weight="bold" style={{ marginLeft: 4 }} />
          </SmoothPressable>
        </View>
      </View>
    </Animated.View>
  );
};
