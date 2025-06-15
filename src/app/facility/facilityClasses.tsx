import { ClassBookingModal } from "@/components/ClassBookingModal";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
}

export const FacilityClasses: React.FC<FacilityClassesProps> = ({
  classes,
  facilityName,
  images,
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  if (!classes.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classes</Text>
      {classes.map((classItem) => (
        <TouchableOpacity
          key={classItem.id}
          style={styles.classCard}
          onPress={() => setSelectedClass(classItem)}
        >
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classItem.name}</Text>
            <Text style={styles.classTime}>{classItem.time}</Text>
            <View style={styles.classDetails}>
              <Text style={styles.classDetail}>{classItem.duration}</Text>
              <Text style={styles.classDetail}>•</Text>
              <Text style={styles.classDetail}>{classItem.intensity}</Text>
              <Text style={styles.classDetail}>•</Text>
              <Text style={styles.classDetail}>
                {classItem.spots} spots left
              </Text>
            </View>
          </View>
          <Image
            source={{ uri: images[0] }}
            style={styles.classImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  classCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classInfo: {
    flex: 1,
    padding: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  classTime: {
    fontSize: 16,
    color: "#6366F1",
    marginBottom: 8,
  },
  classDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  classDetail: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  classImage: {
    width: 100,
    height: "100%",
  },
});
