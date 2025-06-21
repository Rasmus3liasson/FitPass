import { ClassCard } from "@/components/ClassCard";
import { Section } from "@/components/Section";
import { useAllClasses } from "@/src/hooks/useClasses";
import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";

export const TrendingClasses = () => {
  const router = useRouter();
  const { data: trendingClasses, isLoading } = useAllClasses();

  return (
    <Section
      title="Trending Classes"
      description="Popular classes at partner facilities"
      actionText="Explore All"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {isLoading ? (
          <Text>Loading classes...</Text>
        ) : (
          trendingClasses?.slice(0, 5).map((classItem) => (
            <ClassCard
              key={classItem.id}
              name={classItem.name}
              facility={classItem.clubs?.name || "Unknown Facility"}
              image={classItem.image_url || "https://via.placeholder.com/150"}
              time={new Date(classItem.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              duration={`${classItem.duration} min`}
              intensity={
                classItem.intensity === "Low" ||
                classItem.intensity === "Medium" ||
                classItem.intensity === "High"
                  ? classItem.intensity
                  : "Medium"
              }
              spots={
                classItem.max_participants -
                (classItem.current_participants || 0)
              }
              onPress={() => router.push(`/class/${classItem.id}`)}
            />
          ))
        )}
      </ScrollView>
    </Section>
  );
};
