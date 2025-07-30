import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { View } from "react-native";

interface FacilityInfo {
  name: string;
  type: string;
  image: string;
  rating: number;
  distance?: string;

  credits?: number;
  onPress: () => void;
  layout: "list" | "grid";
}

interface FacilitiesSectionProps {
  title: string;
  description: string;
  facilities: FacilityInfo[];
}

export default function FacilitiesSections({
  title,
  description,
  facilities,
}: FacilitiesSectionProps) {
  return (
    <Section title={title} description={description}>
      <View className="flex-row flex-wrap justify-between">
        {facilities.map((facility, index) => (
          <View key={facility.name || index} className="mb-4" style={{ width: '48%' }}>
            <FacilityCard {...facility} />
          </View>
        ))}
      </View>
    </Section>
  );
}
