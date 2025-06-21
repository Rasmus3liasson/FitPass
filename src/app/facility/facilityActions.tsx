import { Button } from "@/components/Button";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookDirectVisit } from "@/src/hooks/useBookings";
import { useClubClasses } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import React, { useState } from "react";
import {
  View
} from "react-native";
import Toast from "react-native-toast-message";

interface Props {
  id: string;
}

export function FacilityActions({ id }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [showClasses, setShowClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const { data: classes } = useClubClasses(id);
  const bookDirectVisit = useBookDirectVisit();

  const handleBookClass = (classItem: any) => {
    setShowClasses(false);
    setSelectedClass(classItem);
  };

  const handleCheckIn = async () => {
    if (!user) {
      // Handle case where user is not logged in
      return;
    }

    try {
      const result = await bookDirectVisit.mutateAsync({
        userId: user.id,
        clubId: id,
      });

      if (result.bookingData && result.bookingData.length > 0) {
        const bookingId = result.bookingData[0].id;
        Toast.show({
          type: 'success',
          text1: 'Check-in Confirmed',
          text2: 'Your check-in was successful.',
        });
        router.push(`/facility/${id}/checkin?bookingId=${bookingId}`);
      }
    } catch (error) {
      console.error("Failed to book direct visit:", error);
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: 'Could not complete your check-in. Please try again.',
      });
    }
  };

  return (
    <>
      <View className="flex-row items-center justify-center gap-3 mt-6">
        <Button
          title="Check In Now"
          icon={<Calendar size={18} color="#FFFFFF" />}
          onPress={handleCheckIn}
          style={{ flex: 1 }}
          disabled={bookDirectVisit.isPending}
        />
      </View>
    </>
  );
}
