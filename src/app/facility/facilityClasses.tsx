import { ClassBookingModal } from "@/components/ClassBookingModal";
import { ClassCard } from "@/components/ClassCard";
import { ClassesModal } from "@/components/ClassesModal";
import { Section } from "@/components/Section";
import React, { useState } from "react";
import { View } from "react-native";

interface Class {
  id: string;
  name: string;
  time: string;
  duration: string;
  intensity: "Low" | "Medium" | "High";
  spots: number;
}

interface FacilityClassesProps {
  classes: Class[];
  facilityName: string;
  images: string[];
  facilityId: string;
}

export const FacilityClasses: React.FC<FacilityClassesProps> = ({
  classes,
  facilityName,
  images,
  facilityId,
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showAllClasses, setShowAllClasses] = useState(false);

  if (!classes.length) return null;

  // Sort classes by time (assume time is a string like '14:00')
  const sortedClasses = [...classes].sort((a, b) => {
    // Convert to minutes since midnight for comparison
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    return toMinutes(a.time) - toMinutes(b.time);
  });
  const nearestClasses = sortedClasses.slice(0, 3);

  console.log(selectedClass)

  return (
    <Section
      title="Nästa klasser"
      actionText="Se alla klasser"
      onAction={() => setShowAllClasses(true)}
    >
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "flex-start" }}>
        {nearestClasses.map((classItem) => (
          <ClassCard
            key={classItem.id}
            name={classItem.name}
            facility={facilityName}
            image={images[0]}
            time={classItem.time}
            duration={classItem.duration}
            intensity={classItem.intensity}
            spots={classItem.spots}
            onPress={() => setSelectedClass(classItem)}
          />
        ))}
      </View>

      <ClassBookingModal
        visible={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classId={selectedClass?.id || ""}
        className={selectedClass?.name || ""}
        startTime={selectedClass?.time || ""}
        duration={parseInt(selectedClass?.duration || "0")}
        spots={selectedClass?.spots || 0}
      />

      <ClassesModal
        visible={showAllClasses}
        onClose={() => setShowAllClasses(!showAllClasses)}
        classes={classes}
        facilityName={facilityName}
        images={images}
        onClassPress={setSelectedClass}
        simpleList
      />
    </Section>
  );
};


