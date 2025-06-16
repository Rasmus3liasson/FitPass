import { Button } from "@/components/Button";
import { useClubClasses } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import React, { useState } from "react";
import {
  View
} from "react-native";

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
      </View>
    </>
  );
}
