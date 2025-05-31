import { FacilityCard } from "@/components/FacilityCard";
import { Section } from "@/components/Section";
import { View } from "react-native";

interface FacilityInfo {
  name: string;
  type: string;
  image: string;
  rating: number;
  distance: string;
  openNow: boolean;
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
      <View
        className={`mt-4 ${
          facilities[0]?.layout === "grid"
            ? "flex-row flex-wrap space-x-3 space-y-3"
            : ""
        }`}
      >
        {facilities.map((facility) => (
          <FacilityCard key={facility.name} {...facility} />
        ))}
      </View>
    </Section>
  );
}
