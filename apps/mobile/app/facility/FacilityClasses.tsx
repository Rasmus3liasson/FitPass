import { ClassBookingModal } from "@shared/components/ClassBookingModal";
import { ClassCard } from "@shared/components/ClassCard";
import { ClassesModal } from "@shared/components/ClassesModal";
import { useAllClasses } from "@shared/hooks/useClasses";
import { Class as BackendClass, UIClass } from "@shared/types";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface FacilityClassesProps {
  facilityId: string; // This is the club_id
  facilityName: string;
  images: string[];
}

function getMinutesBetween(start: string, end: string): number {
  if (!start || !end) return 60;
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / (1000 * 60));
  } catch {
    return 60;
  }
}

function mapToUIClass(c: BackendClass): UIClass {
  return {
    id: c.id,
    name: c.name,
    time: c.start_time, // Keep as-is for ClassCard display
    startTimeISO: c.start_time, // Preserve ISO timestamp for ClassBookingModal
    duration: String(getMinutesBetween(c.start_time, c.end_time)),
    intensity:
      c.intensity === "Low" ||
      c.intensity === "Medium" ||
      c.intensity === "High"
        ? c.intensity
        : "Medium",
    spots: c.capacity - (c.booked_spots ?? 0),
    clubId: c.club_id,
    description: c.description,
    instructor: c.instructor?.profiles?.display_name || "",
    capacity: c.capacity,
    bookedSpots: c.booked_spots,
  };
}

export const FacilityClasses: React.FC<FacilityClassesProps> = ({
  facilityId,
  facilityName,
  images,
}) => {
  const { data: allClasses = [], isLoading, error } = useAllClasses();
  const [selectedClass, setSelectedClass] = useState<UIClass | null>(null);
  const [showAllClasses, setShowAllClasses] = useState(false);

  // Filter and map classes for this facility (club)
  const classes = allClasses
    .filter((c) => c.club_id === facilityId)
    .map(mapToUIClass);

  if (isLoading)
    return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <Text style={{ color: "red", margin: 20 }}>
        Kunde inte ladda klasser.
      </Text>
    );
  if (!classes.length) return null;

  // Sort classes by time (assume string like '14:00')
  const sortedClasses = [...classes].sort((a, b) => {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    return toMinutes(a.time) - toMinutes(b.time);
  });
  const nearestClasses = sortedClasses.slice(0, 3);

  return (
    <>
      <View className="flex-row justify-between items-center mt-20 mb-4">
        <Text className="text-lg font-semibold text-textPrimary">
          Klasser på {facilityName}
        </Text>
        <TouchableOpacity
          onPress={() => setShowAllClasses(!showAllClasses)}
          className="bg-primary/20 px-4 py-2 rounded-full border border-primary/30 active:bg-primary/30"
        >
          <Text className="text-textPrimary text-sm font-bold">Visa alla</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{ flexDirection: "row", gap: 12, justifyContent: "flex-start" }}
      >
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
        startTime={selectedClass?.startTimeISO ?? ""}
        duration={parseInt(selectedClass?.duration || "0")}
        spots={selectedClass?.spots || 0}
        description={selectedClass?.description}
        instructor={selectedClass?.instructor}
        capacity={selectedClass?.capacity}
        bookedSpots={selectedClass?.bookedSpots}
        clubId={facilityId}
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
    </>
  );
};
export default FacilityClasses;
