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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4">
        <Text className="text-2xl font-bold mb-4">My Favorite Clubs</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {favorites && favorites.length > 0 ? (
            favorites.map((club) => (
              <FacilityCard
                key={club.id}
                name={""}
                type={""}
                image={""}
                rating={0}
                distance={""}
                openNow={false}
                onPress={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-gray-500">No favorite clubs yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
