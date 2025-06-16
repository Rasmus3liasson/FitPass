import { ClassBookingModal } from "@/components/ClassBookingModal";
import { ClassCard } from "@/components/ClassCard";
import { ClassesModal } from "@/components/ClassesModal";
import { Section } from "@/components/Section";
import React, { useState } from "react";

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

  return (
    <Section
      title="Nästa klasser"
      actionText="Se alla klasser"
      onAction={() => setShowAllClasses(true)}
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
          onPress={() => setSelectedClass(classItem)}
        />
      ))}

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
        onClose={() => setShowAllClasses(false)}
        classes={classes}
        facilityName={facilityName}
        images={images}
        onClassPress={setSelectedClass}
      />
    </Section>
  );
};


