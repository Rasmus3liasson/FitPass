import { useAuth } from "@/src/hooks/useAuth";
import { useFavorites } from "@/src/hooks/useFavorites";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FacilityCard } from "../components/FacilityCard";

export default function FavoritesScreen() {
  const auth = useAuth();
  const { data: favorites, isLoading } = useFavorites(auth.user?.id || "");

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4">
        <Text className="text-2xl font-bold mb-4">My Favorite Clubs</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {favorites && favorites.length > 0 ? (
            favorites.map((favorite) => (
              <FacilityCard
                key={favorite.clubs.id}
                name={favorite.clubs.name}
                type={favorite.clubs.type}
                image={favorite.clubs.image_url ?? ""}
                club_images={favorite.clubs.club_images}
                avatar_url={favorite.clubs.avatar_url}
                rating={favorite.clubs.avg_rating || 0}
                distance={
                  favorite.clubs.distance !== undefined && favorite.clubs.distance !== null
                    ? `${favorite.clubs.distance.toFixed(1)} km`
                    : undefined
                }
                onPress={() => {
                  // Navigate to facility details
                }}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-accentGray">No favorite clubs yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
