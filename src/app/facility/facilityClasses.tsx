import { ClassCard } from "@/components/ClassCard";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type Intensity = "Low" | "Medium" | "High";

interface Props {
  classes: Array<{
    id: string;
    name: string;
    time: string;
    duration: string;
    intensity: Intensity;
    spots: number;
  }>;
  facilityName: string;
  images: string[];
}

export function FacilityClasses({ classes, facilityName, images }: Props) {
  const router = useRouter();

  return (
    <View className="mt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-bold text-lg">Available Classes</Text>
        <TouchableOpacity onPress={() => router.push(`/facility/classes`)}>
          <Text className="text-primary text-sm">See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16, gap: 16 }}
      >
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.id}
            name={classItem.name}
            facility={facilityName}
            image={images[0]}
            time={classItem.time}
            duration={classItem.duration}
            intensity={classItem.intensity}
            spots={classItem.spots}
            onPress={() =>
              router.push({
                pathname: "/facility/classes/[classId]",
                params: { classId: classItem.id },
              } as any)
            }
            compact
          />
        ))}
      </ScrollView>
    </View>
  );
}
