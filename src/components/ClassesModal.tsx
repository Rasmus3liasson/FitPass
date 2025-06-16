import { BaseModal } from "@/components/BaseModal";
import { ClassCard } from "@/components/ClassCard";
import React from "react";
import { ScrollView } from "react-native";

interface Class {
  id: string;
  name: string;
  time: string;
  duration: string;
  intensity: "Low" | "Medium" | "High";
  spots: number;
}

interface ClassesModalProps {
  visible: boolean;
  onClose: () => void;
  classes: Class[];
  facilityName: string;
  images: string[];
  onClassPress: (classItem: Class) => void;
}

export function ClassesModal({
  visible,
  onClose,
  classes,
  facilityName,
  images,
  onClassPress,
}: ClassesModalProps) {
  return (
    <BaseModal 
      visible={visible} 
      onClose={onClose}
      title="Available Classes"
      maxHeight={600}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
            onPress={() => onClassPress(classItem)}
          />
        ))}
      </ScrollView>
    </BaseModal>
  );
} 