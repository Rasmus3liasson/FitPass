import { Section } from "@/components/Section";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useFavorites } from "@/src/hooks/useFavorites";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export const FavoriteClubs = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavorites(user?.id || "");

  if (isLoading || !favorites || favorites.length === 0) {
    return null;
  }

  return (
    <Section title="Favorite Clubs" description="Your saved facilities">
      <ScrollView
        className="mt-4"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {favorites.map((favorite) => {
          const posterImage = favorite.clubs.club_images?.find(
            (img: { type: string }) => img.type === "poster"
          );
          const imageUri =
            posterImage?.url ||
            favorite.clubs.image_url ||
            "https://via.placeholder.com/150";

          return (
            <TouchableOpacity
              key={favorite.id}
              className="mr-4 items-center"
              onPress={() => router.push(ROUTES.FACILITY(favorite.clubs.id))}
            >
              <View className="relative">
                <Image
                  source={{ uri: imageUri }}
                  className="w-16 h-16 rounded-full"
                />
                <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                  <View className="w-3 h-3 rounded-full bg-white" />
                </View>
              </View>
              <Text
                className="text-white text-sm mt-2 text-center max-w-[80px]"
                numberOfLines={1}
              >
                {favorite.clubs.name}
              </Text>
              <Text
                className="text-textSecondary text-xs text-center max-w-[80px]"
                numberOfLines={1}
              >
                {favorite.clubs.type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Section>
  );
};
