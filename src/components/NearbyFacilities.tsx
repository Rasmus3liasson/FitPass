import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { useClubs } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";

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
      onAction={() => router.push("/map/")}
    >
      <ScrollView
        className="mt-4"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {isLoading ? (
          <Text>Loading facilities...</Text>
        ) : (
          nearbyClubs?.map((club) => (
            <FacilityCard
              key={club.id}
              name={club.name}
              type={club.type}
              image={club.image_url || "https://via.placeholder.com/150"}
              rating={club.rating || 0}
              distance={`${club.distance?.toFixed(1)} km`}
              openNow={!!club.is_open}
              onPress={() => router.push(`/facility/${club.id}`)}
            />
          ))
        )}
      </ScrollView>
    </Section>
  );
};
