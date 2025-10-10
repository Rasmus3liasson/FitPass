import { BaseModal } from "@/components/BaseModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookClass } from "@/src/hooks/useClubs";
import { formatSwedishTime } from "@/src/utils/time";
import { useRouter } from "expo-router";
import { Calendar, Clock, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

interface ClassBookingModalProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  startTime: string; // ISO string
  duration: number;
  spots: number;
  description?: string;
  instructor?: string;
  capacity?: number;
  bookedSpots?: number;
  clubId: string;
}

export const ClassBookingModal: React.FC<ClassBookingModalProps> = ({
  visible,
  onClose,
  classId,
  className,
  startTime,
  duration,
  spots,
  description,
  instructor,
  capacity,
  bookedSpots,
  clubId,
}) => {
  const router = useRouter();
  const auth = useAuth();
  const bookClass = useBookClass();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Format startTime to Swedish locale
  let formattedDate = startTime;
  try {
    formattedDate = formatSwedishTime(startTime, true);
  } catch {}

  const handleBookClass = async () => {
    if (!auth.user?.id) {
      router.push("/(auth)/login" as any);
      return;
    }

    try {
      await bookClass.mutateAsync({
        userId: auth.user.id,
        classId,
        clubId,
      });
      Toast.show({
        type: 'success',
        text1: '🎉 Class Booked!',
        text2: `Successfully booked ${className}. Check your bookings tab for details.`,
        position: 'top',
        visibilityTime: 4000,
      });
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error booking class:", error);
      Toast.show({
        type: 'error',
        text1: '⚠️ Booking Failed',
        text2: 'Something went wrong. Please check your credits and try again.',
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="Boka klass"
    >
      {!showConfirmation ? (
        <View className="flex-1">
          <Text className="text-2xl font-bold text-textPrimary mb-6">{className}</Text>
          {description && (
            <Text className="text-accentGray mb-3">{description}</Text>
          )}
          <View className="bg-white/5 rounded-2xl p-5 mb-8">
            <View className="flex-row items-center mb-4">
              <Calendar size={18} color="#6366F1" />
              <Text className="ml-3 flex-1 text-base text-accentGray">Datum & tid</Text>
              <Text className="text-base font-semibold text-textPrimary">{formattedDate}</Text>
            </View>
            <View className="flex-row items-center mb-4">
              <Clock size={18} color="#6366F1" />
              <Text className="ml-3 flex-1 text-base text-accentGray">Längd</Text>
              <Text className="text-base font-semibold text-textPrimary">{duration} minuter</Text>
            </View>
            {instructor && (
              <View className="flex-row items-center mb-4">
                <Users size={18} color="#6366F1" />
                <Text className="ml-3 flex-1 text-base text-accentGray">Instruktör</Text>
                <Text className="text-base font-semibold text-textPrimary">{instructor}</Text>
              </View>
            )}
            {typeof capacity === "number" && (
              <View className="flex-row items-center mb-4">
                <Users size={18} color="#6366F1" />
                <Text className="ml-3 flex-1 text-base text-accentGray">Kapacitet</Text>
                <Text className="text-base font-semibold text-textPrimary">{capacity}</Text>
              </View>
            )}
            {typeof bookedSpots === "number" && (
              <View className="flex-row items-center mb-4">
                <Users size={18} color="#6366F1" />
                <Text className="ml-3 flex-1 text-base text-accentGray">Bokade platser</Text>
                <Text className="text-base font-semibold text-textPrimary">{bookedSpots}</Text>
              </View>
            )}
            <View className="flex-row items-center mb-4">
              <Users size={18} color="#6366F1" />
              <Text className="ml-3 flex-1 text-base text-accentGray">Lediga platser</Text>
              <Text className="text-base font-semibold text-textPrimary">{spots}</Text>
            </View>
          </View>
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${spots <= 0 ? "bg-indigo-500/50" : "bg-indigo-500"}`}
            onPress={() => setShowConfirmation(true)}
            disabled={bookClass.isPending || spots <= 0}
          >
            <Text className="text-textPrimary text-base font-semibold">
              {bookClass.isPending
                ? "Bokar..."
                : spots <= 0
                ? "Inga platser kvar"
                : "Boka klass"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="items-center p-5">
          <View className="w-20 h-20 rounded-full bg-indigo-500/10 justify-center items-center mb-6">
            <Calendar size={48} color="#6366F1" />
          </View>
          <Text className="text-2xl font-bold text-textPrimary mb-3">Confirm Booking</Text>
          <Text className="text-base text-accentGray text-center mb-8">
            Are you sure you want to book {className} at {formattedDate}?
          </Text>
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center bg-white/10"
              onPress={() => setShowConfirmation(false)}
            >
              <Text className="text-textPrimary text-base font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center bg-indigo-500"
              onPress={handleBookClass}
              disabled={bookClass.isPending}
            >
              <Text className="text-textPrimary text-base font-semibold">
                {bookClass.isPending ? "Booking..." : "Confirm"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BaseModal>
  );
}; 