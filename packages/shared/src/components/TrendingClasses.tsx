import { ClassBookingModal } from "@/components/ClassBookingModal"; // Ensure this import exists
import { ClassCard } from "@/components/ClassCard";
import { Section } from "@/components/Section";
import { useAllClasses } from "../hooks/useClasses";
import { formatSwedishTime } from "../utils/time";
import type { Class } from "../types";
import React, { useState } from "react";
import { ScrollView, Text } from "react-native";

export const TrendingClasses = () => {
  const { data: trendingClasses, isLoading } = useAllClasses();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null); // Track selected class

  if (!isLoading && (!trendingClasses || trendingClasses.length === 0)) {
    return null;
  }

  return (
    <>
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
            trendingClasses
              ?.slice(0, 5)
              .map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  name={classItem.name}
                  facility={classItem.clubs?.name || "Unknown Facility"}
                  image={
                    classItem.image_url || "https://via.placeholder.com/150"
                  }
                  time={`${formatSwedishTime(classItem.start_time)} - ${formatSwedishTime(classItem.end_time)}`}
                  duration={`${classItem.duration} min`}
                  intensity={
                    ["Low", "Medium", "High"].includes(classItem.intensity)
                      ? (classItem.intensity as "Low" | "Medium" | "High")
                      : "Medium"
                  }
                  spots={classItem.capacity - (classItem.booked_spots ?? 0)}
                  onPress={() => setSelectedClass(classItem)}
                />
              ))
          )}
        </ScrollView>
      </Section>

      {selectedClass && (
        <ClassBookingModal
          visible={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          classId={selectedClass.id}
          className={selectedClass.name}
          startTime={selectedClass.start_time}
          duration={selectedClass.duration}
          spots={
            selectedClass.max_participants -
            (selectedClass.current_participants || 0)
          }
          clubId={selectedClass.club_id}
        />
      )}
    </>
  );
};
