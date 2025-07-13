import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { ROUTES } from "@/src/config/constants";
import { useClubs } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import { ClubImage } from "../types";

export const NearbyFacilities = () => {
  const router = useRouter();
  const { data: nearbyClubs, isLoading } = useClubs({
    latitude: 59.3293,
    longitude: 18.0686,
    radius: 5,
  });

  return (
    <Section
      title="Nearby Facilities"
      description="Check out these locations close to you"
      actionText="View Map"
      onAction={() => router.push(ROUTES.MAP)}
    >
      <ScrollView
        className="mt-4"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {isLoading ? (
          <Text>Loading facilities...</Text>
        ) : (
          nearbyClubs?.map((club) => {
            const avatarImage = club.club_images?.find(
              (img: ClubImage) => img.type === "avatar"
            );
            const imageUri =
              avatarImage?.url ||
              club.avatar_url ||
              "https://via.placeholder.com/150";

            return (
              <FacilityCard
                key={club.id}
                name={club.name}
                type={club.type}
                image={imageUri}
                open_hours={club.open_hours}
                rating={club.avg_rating || 0}
                distance={`${club.distance?.toFixed(1)} km`}
                onPress={() => router.push(ROUTES.FACILITY(club.id))}
              />
            );
          })
        )}
      </ScrollView>
    </Section>
  );
};
