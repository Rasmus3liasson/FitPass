import { ClassBookingModal } from "@/components/ClassBookingModal"; // Ensure this import exists
import { ClassCard } from "@/components/ClassCard";
import { Section } from "@/components/Section";
import { useAllClasses } from "@/src/hooks/useClasses";
import type { Class } from "@/types";
import React, { useState } from "react";
import { ScrollView, Text } from "react-native";

export const TrendingClasses = () => {
  const { data: trendingClasses, isLoading } = useAllClasses();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null); // Track selected class

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
                  ["Low", "Medium", "High"].includes(classItem.intensity)
                    ? classItem.intensity as "Low" | "Medium" | "High"
                    : "Medium"
                }
                spots={
                  classItem.max_participants -
                  (classItem.current_participants || 0)
                }
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
        />
      )}
    </>
  );
};
