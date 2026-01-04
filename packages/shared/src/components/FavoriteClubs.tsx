import { useRouter } from "expo-router";
import { HeartIcon, TrendUp } from "phosphor-react-native";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ROUTES } from "../config/constants";
import { useAuth } from "../hooks/useAuth";
import { useMostPopularClubs } from "../hooks/useClubs";
import { useFavorites } from "../hooks/useFavorites";
import { Section } from "./Section";

export const FavoriteClubs = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: favorites, isLoading: isLoadingFavorites } = useFavorites(
    user?.id || ""
  );
  const { data: popularClubs, isLoading: isLoadingPopular } =
    useMostPopularClubs(4);

  const isLoading = isLoadingFavorites || isLoadingPopular;
  const hasFavorites = favorites && favorites.length > 0;
  const hasPopularClubs = popularClubs && popularClubs.length > 0;

  // Don't render if still loading or no data at all
  if (isLoading || (!hasFavorites && !hasPopularClubs)) {
    return null;
  }

  // Determine what to show and the title/description
  const clubsToShow = hasFavorites ? favorites : popularClubs;
  const title = hasFavorites ? "Favoritklubbar" : "Mest besökta klubbar";
  const description = hasFavorites
    ? "Dina sparade anläggningar"
    : "Populära anläggningar nära dig";

  // Early return with safe data check
  if (!clubsToShow || clubsToShow.length === 0) {
    return null;
  }

  return (
    <Section title={String(title)} description={String(description)}>
      {hasFavorites ? (
        <ScrollView
          className="mt-4"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {clubsToShow
            .map((item, index) => {
              try {
                const club = (item as any)?.clubs;
                const itemId = (item as any)?.id;

                if (!club || !club.id) {
                  console.warn(
                    "FavoriteClubs: Invalid club data at index",
                    index,
                    club
                  );
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={String(itemId || index)}
                    className="mr-4 items-center"
                    onPress={() => router.push(ROUTES.FACILITY(club.id) as any)}
                  >
                    <View className="relative">
                      <Image
                        source={{
                          uri:
                            club.image_url || "https://via.placeholder.com/150",
                        }}
                        className="w-16 h-16 rounded-full"
                      />
                      <View className="absolute bottom-0 right-0 rounded-full p-1 bg-primary">
                        <HeartIcon size={12} color="white" weight="fill" />
                      </View>
                    </View>
                    <Text
                      className="text-textPrimary text-sm mt-2 text-center max-w-[80px]"
                      numberOfLines={1}
                    >
                      {club.name ? String(club.name) : "Club Name"}
                    </Text>
                    <Text
                      className="text-textSecondary text-xs text-center max-w-[80px]"
                      numberOfLines={1}
                    >
                      {club.type ? String(club.type) : "Fitness"}
                    </Text>
                  </TouchableOpacity>
                );
              } catch (error) {
                console.error(
                  "FavoriteClubs: Error rendering favorite club at index",
                  index,
                  error
                );
                return null;
              }
            })
            .filter(Boolean)}
        </ScrollView>
      ) : (
        <View className="mt-4 flex-row justify-center items-center">
          {clubsToShow
            .map((item, index) => {
              try {
                // Handle popular clubs (direct structure)
                const club = item as any;
                const itemId = club?.id;

                // Safety checks to ensure we have valid data
                if (!club || !club.id) {
                  console.warn(
                    "FavoriteClubs: Invalid popular club data at index",
                    index,
                    club
                  );
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={String(itemId || index)}
                    className="mx-2 items-center"
                    onPress={() => router.push(ROUTES.FACILITY(club.id) as any)}
                  >
                    <View className="relative">
                      <Image
                        source={{
                          uri:
                            club.image_url || "https://via.placeholder.com/150",
                        }}
                        className="w-16 h-16 rounded-full"
                      />
                      <View className="absolute bottom-0 right-0 rounded-full p-1 bg-primary">
                        <TrendUp size={12} color="white" />
                      </View>
                    </View>
                    <Text
                      className="text-textPrimary text-sm mt-2 text-center max-w-[80px]"
                      numberOfLines={1}
                    >
                      {club.name ? String(club.name) : "Club Name"}
                    </Text>
                    <Text
                      className="text-textSecondary text-xs text-center max-w-[80px]"
                      numberOfLines={1}
                    >
                      {club.type ? String(club.type) : "Fitness"}
                    </Text>
                  </TouchableOpacity>
                );
              } catch (error) {
                console.error(
                  "FavoriteClubs: Error rendering popular club at index",
                  index,
                  error
                );
                return null;
              }
            })
            .filter(Boolean)}
        </View>
      )}
    </Section>
  );
};
