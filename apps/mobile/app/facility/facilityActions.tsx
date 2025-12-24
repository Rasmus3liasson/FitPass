import { Button } from "@shared/components/Button";
import { useAuth } from "@shared/hooks/useAuth";
import { useBookDirectVisit } from "@shared/hooks/useBookings";
import { useClubClasses } from "@shared/hooks/useClubs";
import { useDailyAccessGyms, useDailyAccessStatus } from "@shared/hooks/useDailyAccess";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
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
  const { showSuccess, showError, showWarning } = useGlobalFeedback();
  
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
          '🎟️ Biljett skapad!',
          'Din incheckning-biljett är nu redo! Gå till dina bokningar för att visa QR-koden.',
          {
            onButtonPress: () => {
              router.push(`/facility/${id}/checkin?bookingId=${bookingId}`);
            }
          }
        );
      }
    } catch (error) {
      console.error("Failed to book direct visit:", error);
      showError(
        '❌ Biljett kunde inte skapas',
        'Något gick fel vid skapandet av din incheckning-biljett. Kontrollera din internetanslutning och försök igen.'
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

    </>
  );
}
