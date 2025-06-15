import { Button } from "@/components/Button";
import { ClassBookingModal } from "@/components/ClassBookingModal";
import { Modal } from "@/components/Modal";
import { useClubClasses } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  id: string;
}

export function FacilityActions({ id }: Props) {
  const router = useRouter();
  const [showClasses, setShowClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const { data: classes } = useClubClasses(id);

  const handleBookClass = (classItem: any) => {
    setShowClasses(false);
    setSelectedClass(classItem);
  };

  return (
    <>
      <View className="flex-row items-center justify-center gap-3 mt-6">
        <Button
          title="Check In Now"
          icon={<Calendar size={18} color="#FFFFFF" />}
          onPress={() => router.push(`/facility/${id}/checkin`)}
          style={{ flex: 1 }}
        />
        <Button
          title="Book Class"
          onPress={() => setShowClasses(true)}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>

      <Modal
        visible={showClasses}
        onClose={() => setShowClasses(false)}
        title="Available Classes"
        height={600}
      >
        <ScrollView style={styles.classesList}>
          {classes?.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
              onPress={() => handleBookClass(classItem)}
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
      </Modal>

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
    </>
  );
}

const styles = StyleSheet.create({
  classesList: {
    flex: 1,
  },
  classCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
