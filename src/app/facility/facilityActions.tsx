import { Button } from "@/components/Button";
import { FeedbackComponent } from "@/src/components/FeedbackComponent";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookDirectVisit } from "@/src/hooks/useBookings";
import { useClubClasses } from "@/src/hooks/useClubs";
import { useDailyAccessGyms, useDailyAccessStatus } from "@/src/hooks/useDailyAccess";
import { useFeedback } from "@/src/hooks/useFeedback";
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
  const { user } = useAuth();
  const [showClasses, setShowClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const { data: classes } = useClubClasses(id);
  const bookDirectVisit = useBookDirectVisit();
  const { feedback, showSuccess, showError, showWarning, hideFeedback } = useFeedback();
  
  // Check Daily Access restrictions
  const { data: dailyAccessStatus } = useDailyAccessStatus(user?.id);
  const { data: dailyAccessData } = useDailyAccessGyms(user?.id || "");

  const handleBookClass = (classItem: any) => {
    setShowClasses(false);
    setSelectedClass(classItem);
  };

  const handleCheckIn = async () => {
    if (!user) {
      // Handle case where user is not logged in
      return;
    }

    // Check Daily Access restrictions
    if (dailyAccessStatus?.hasDailyAccess) {
      const isSelectedGym = dailyAccessData?.current?.some(
        (gym) => gym.gym_id === id
      ) || dailyAccessData?.pending?.some(
        (gym) => gym.gym_id === id
      );

      if (!isSelectedGym) {
        showWarning(
          'Daily Access Restriction',
          'Du kan bara använda dina valda gym med Daily Access-medlemskapet. För att använda detta gym, lägg till det i dina Daily Access-val först.',
          {
            buttonText: 'Hantera Daily Access',
            onButtonPress: () => {
              hideFeedback();
              router.push('/profile'); // Navigate to profile where they can manage Daily Access
            }
          }
        );
        return;
      }
    }

    try {
      const result = await bookDirectVisit.mutateAsync({
        userId: user.id,
        clubId: id,
      });

      if (result.bookingData && result.bookingData.length > 0) {
        const bookingId = result.bookingData[0].id;
        showSuccess(
          'Check-in Confirmed',
          'Your check-in was successful.',
          {
            onButtonPress: () => {
              hideFeedback();
              router.push(`/facility/${id}/checkin?bookingId=${bookingId}`);
            }
          }
        );
      }
    } catch (error) {
      console.error("Failed to book direct visit:", error);
      showError(
        'Check-in Failed',
        'Could not complete your check-in. Please try again.'
      );
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
      
      <FeedbackComponent
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        buttonText={feedback.buttonText}
        onClose={hideFeedback}
        onButtonPress={feedback.onButtonPress}
        autoClose={feedback.autoClose}
        autoCloseDelay={feedback.autoCloseDelay}
      />
    </>
  );
}
