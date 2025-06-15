import { ClassBookingModal } from "@/components/ClassBookingModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useClubClasses } from "@/src/hooks/useClubs";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClassesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: classes } = useClubClasses(id as string);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  return (
    <SafeAreaWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Available Classes</Text>
      </View>

      <ScrollView style={styles.container}>
        {classes?.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={styles.classCard}
            onPress={() => setSelectedClass(classItem)}
          >
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classTime}>
                {new Date(classItem.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <View style={styles.classDetails}>
                <Text style={styles.classDetail}>{classItem.duration} min</Text>
                <Text style={styles.classDetail}>•</Text>
                <Text style={styles.classDetail}>{classItem.intensity}</Text>
                <Text style={styles.classDetail}>•</Text>
                <Text style={styles.classDetail}>
                  {classItem.max_participants - (classItem.current_participants || 0)} spots left
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ClassBookingModal
        visible={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classId={selectedClass?.id || ""}
        className={selectedClass?.name || ""}
        startTime={new Date(selectedClass?.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        duration={selectedClass?.duration || 0}
        spots={selectedClass?.max_participants - (selectedClass?.current_participants || 0)}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  classCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
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
}); 