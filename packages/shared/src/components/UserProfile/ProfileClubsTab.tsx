import { Building2, Heart, MapPin } from "lucide-react-native";
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
        <View className="bg-surface rounded-2xl p-8 mb-4 border border-border items-center">
          <ActivityIndicator size="small" color="#8B5CF6" />
        </View>
      ) : mostVisitedClub ? (
        <TouchableOpacity
          onPress={() => onNavigateToClub(mostVisitedClub.id)}
          activeOpacity={0.7}
          className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl overflow-hidden mb-4 border border-primary/20"
        >
          {mostVisitedClub.cover_image_url && (
            <Image
              source={{ uri: mostVisitedClub.cover_image_url }}
              className="w-full h-32"
              resizeMode="cover"
            />
          )}
          <View className="p-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-textPrimary font-bold text-lg mb-1">
                  {mostVisitedClub.name}
                </Text>
                {mostVisitedClub.city && (
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#8B5CF6" />
                    <Text className="text-textSecondary text-sm ml-1">
                      {mostVisitedClub.city}
                    </Text>
                  </View>
                )}
              </View>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary font-semibold text-sm">
                  {mostVisitedCount} besök
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <Building2 size={16} color="#8B5CF6" />
              <Text className="text-primary text-sm font-medium ml-2">
                Oftast besökt
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Favorite Clubs */}
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-textPrimary font-semibold text-base">
            Favoritgym
          </Text>
          <Heart size={18} color="#ef4444" fill="#ef4444" />
        </View>

        {isLoadingFavorites ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#8B5CF6" />
          </View>
        ) : favoriteClubs && favoriteClubs.length > 0 ? (
          <View className="space-y-3">
            {favoriteClubs.map((fav: any) => (
              <TouchableOpacity
                key={fav.id}
                onPress={() => onNavigateToClub(fav.clubs?.id || fav.id)}
                activeOpacity={0.7}
                className="flex-row items-center bg-background rounded-xl p-3 border border-border"
              >
                {fav.clubs?.cover_image_url ? (
                  <Image
                    source={{ uri: fav.clubs.cover_image_url }}
                    className="w-12 h-12 rounded-lg mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mr-3">
                    <Building2 size={24} color="#8B5CF6" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold">
                    {fav.clubs?.name || "Okänt gym"}
                  </Text>
                  {fav.clubs?.city && (
                    <Text className="text-textSecondary text-xs">
                      {fav.clubs.city}
                    </Text>
                  )}
                </View>
                <Text className="text-primary text-sm">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="text-textSecondary text-center py-4">
            Inga favoritgym än
          </Text>
        )}
      </View>
    </ScrollView>
  );
};
