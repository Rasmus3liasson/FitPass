import colors from '@shared/constants/custom-colors';
import { Buildings, CaretRight, Heart, HeartIcon, MapPin, StarIcon } from "phosphor-react-native";
import React from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ProfileClubsTabProps {
  userVisits: any[];
  isLoadingVisits: boolean;
  favoriteClubs: any[];
  isLoadingFavorites: boolean;
  onNavigateToClub: (clubId: string) => void;
}

export const ProfileClubsTab: React.FC<ProfileClubsTabProps> = ({
  userVisits,
  isLoadingVisits,
  favoriteClubs,
  isLoadingFavorites,
  onNavigateToClub,
}) => {
  // Find most frequently visited club
  const clubVisitCounts = userVisits.reduce((acc: any, visit: any) => {
    const clubId = visit.gym?.id;
    if (clubId) {
      acc[clubId] = (acc[clubId] || 0) + 1;
    }
    return acc;
  }, {});

  const mostVisitedClubId = Object.keys(clubVisitCounts).length > 0
    ? Object.keys(clubVisitCounts).reduce((a, b) =>
        clubVisitCounts[a] > clubVisitCounts[b] ? a : b
      )
    : null;

  const mostVisitedClub = userVisits.find(
    (visit: any) => visit.gym?.id === mostVisitedClubId
  )?.gym;

  const mostVisitedCount = mostVisitedClubId
    ? clubVisitCounts[mostVisitedClubId]
    : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Most Frequent Gym */}
      {isLoadingVisits ? (
        <View className="bg-surface/50 rounded-3xl p-8 mb-6 items-center">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : mostVisitedClub ? (
        <TouchableOpacity
          onPress={() => onNavigateToClub(mostVisitedClub.id)}
          activeOpacity={0.8}
          className="bg-surface/50 rounded-3xl overflow-hidden mb-6"
        >
          <View className="relative">
            {mostVisitedClub.cover_image_url || mostVisitedClub.image_url ? (
              <Image
                source={{ uri: mostVisitedClub.cover_image_url || mostVisitedClub.image_url }}
                className="w-full h-40"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-40 bg-surface items-center justify-center">
                <Buildings size={48} color={colors.primary} />
              </View>
            )}
            <View className="absolute top-3 right-3 bg-accentGreen px-3 py-1.5 rounded-full">
              <View className="flex-row items-center">
                <StarIcon size={14} color="white" weight="fill" />
                <Text className="text-white font-bold text-sm ml-1">
                  Oftast besökt
                </Text>
              </View>
            </View>
          </View>
          <View className="p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-textPrimary font-bold text-xl mb-2">
                  {mostVisitedClub.name}
                </Text>
                {mostVisitedClub.city && (
                  <View className="flex-row items-center mb-3">
                    <MapPin size={16} color={colors.borderGray} />
                    <Text className="text-textSecondary text-sm ml-1.5">
                      {mostVisitedClub.city}
                    </Text>
                  </View>
                )}
                <View className="bg-primary/10 px-4 py-2 rounded-xl self-start">
                  <Text className="text-primary font-bold text-base">
                    {mostVisitedCount} {mostVisitedCount === 1 ? 'besök' : 'besök'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Favorite Clubs */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-textPrimary font-bold text-lg">
            Favoritgym
          </Text>
          <HeartIcon size={20} color={colors.accentRed} weight="fill" />
        </View>

        {isLoadingFavorites ? (
          <View className="bg-surface/50 rounded-3xl items-center py-8">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : favoriteClubs && favoriteClubs.length > 0 ? (
          <View style={{ gap: 12 }}>
            {favoriteClubs.map((fav: any) => (
              <TouchableOpacity
                key={fav.id}
                onPress={() => onNavigateToClub(fav.clubs?.id || fav.id)}
                activeOpacity={0.8}
                className="bg-surface/50 rounded-2xl overflow-hidden"
              >
                <View className="flex-row items-center">
                  {fav.clubs?.cover_image_url || fav.clubs?.image_url ? (
                    <Image
                      source={{ uri: fav.clubs.cover_image_url || fav.clubs.image_url }}
                      className="w-24 h-24"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 bg-surface items-center justify-center">
                      <Buildings size={32} color={colors.primary} />
                    </View>
                  )}
                  <View className="flex-1 p-4">
                    <Text className="text-textPrimary font-bold text-base mb-1">
                      {fav.clubs?.name || "Okänt gym"}
                    </Text>
                    {fav.clubs?.city && (
                      <View className="flex-row items-center">
                        <MapPin size={14} color={colors.borderGray} />
                        <Text className="text-textSecondary text-sm ml-1">
                          {fav.clubs.city}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="pr-4">
                    <CaretRight size={20} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-surface/50 rounded-3xl p-8 items-center">
            <Heart size={48} color={colors.borderGray} />
            <Text className="text-textSecondary text-center mt-3">
              Inga favoritgym än
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
