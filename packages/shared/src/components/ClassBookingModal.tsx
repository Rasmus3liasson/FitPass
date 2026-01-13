import colors from "@shared/constants/custom-colors";

import { useRouter } from "expo-router";
import { Calendar, Check, Clock, MapPinIcon, User, Users } from "phosphor-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useBookClass } from "../hooks/useClubs";
import { useGlobalFeedback } from "../hooks/useGlobalFeedback";
import { formatSwedishTime } from "../utils/time";
import { SwipeableModal } from "./SwipeableModal";

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
  facilityName?: string;
  intensity?: "Low" | "Medium" | "High";
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
  facilityName,
  intensity,
}) => {
  const router = useRouter();
  const auth = useAuth();
  const bookClass = useBookClass();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();

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
      
      showSuccess(`Klass bokad: ${className}.`, "Kolla din bokningsflik för detaljer.");
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Fel vid bokning av klass:", error);
      showError("Bokning misslyckades", "Något gick fel. Kontrollera dina krediter och försök igen.");
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <SwipeableModal
      visible={visible}
      onClose={handleClose}
      snapPoint={0.5}
    >
      <View className="bg-surface flex-1">
        {!showConfirmation ? (
          <>
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-borderGray/20">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-textPrimary text-2xl font-bold mb-2">
                    {className}
                  </Text>
                  {facilityName && (
                    <View className="flex-row items-center">
                      <Text className="text-textSecondary text-sm mr-1">
                        {facilityName}
                      </Text>
                      <MapPinIcon size={16} color={colors.textSecondary} />
                    </View>
                  )}
                </View>
                
                {/* Intensity Badge */}
                {intensity && (
                  <View
                    className={`px-3 py-1.5 rounded-full ${
                      intensity === 'High'
                        ? 'bg-accentRed/20'
                        : intensity === 'Medium'
                        ? 'bg-accentOrange/20'
                        : 'bg-accentGreen/20'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        intensity === 'High'
                          ? 'text-accentRed'
                          : intensity === 'Medium'
                          ? 'text-accentOrange'
                          : 'text-accentGreen'
                      }`}
                    >
                      {intensity === 'High' ? 'Hög' : 
                       intensity === 'Medium' ? 'Medel' : 'Låg'}
                    </Text>
                  </View>
                )}
              </View>
              
              {description && (
                <Text className="text-textSecondary text-sm leading-relaxed">
                  {description}
                </Text>
              )}
            </View>

            {/* Class Details */}
            <View className="px-6 py-4">
              <Text className="text-textPrimary font-semibold text-base mb-4">
                Klassinformation
              </Text>
              
              <View className="bg-background rounded-2xl p-4 space-y-3">
                {/* Date & Time */}
                <View className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-textSecondary text-xs mb-0.5">Datum & Tid</Text>
                    <Text className="text-textPrimary font-semibold text-base">{formattedDate}</Text>
                  </View>
                </View>

                {/* Duration */}
                <View className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Clock size={20} color={colors.primary} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-textSecondary text-xs mb-0.5">Längd</Text>
                    <Text className="text-textPrimary font-semibold text-base">{duration} minuter</Text>
                  </View>
                </View>

                {/* Instructor */}
                {instructor && (
                  <View className="flex-row items-center py-2">
                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                      <User size={20} color={colors.primary} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-textSecondary text-xs mb-0.5">Instruktör</Text>
                      <Text className="text-textPrimary font-semibold text-base">{instructor}</Text>
                    </View>
                  </View>
                )}

                {/* Available Spots */}
                <View className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Users size={20} color={colors.primary} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-textSecondary text-xs mb-0.5">Lediga platser</Text>
                    <View className="flex-row items-center">
                      <Text className="text-textPrimary font-semibold text-base">{spots}</Text>
                      {typeof capacity === "number" && (
                        <Text className="text-textSecondary text-sm ml-1">/ {capacity}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Book Button */}
            <View className="px-6 pb-6 mt-auto">
              {spots <= 0 ? (
                <View className="bg-accentRed/10 border border-accentRed/20 rounded-2xl p-4">
                  <Text className="text-accentRed text-center font-semibold">
                    Tyvärr är denna klass fullbokad
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-primary rounded-2xl py-4 items-center"
                  onPress={() => setShowConfirmation(true)}
                  disabled={bookClass.isPending}
                  activeOpacity={0.8}
                >
                  {bookClass.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-base font-bold">
                      Boka detta pass
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View className="flex-1 justify-center items-center px-6 py-8">
            <View className="w-20 h-20 rounded-full bg-primary/10 justify-center items-center mb-5">
              <Check size={40} color={colors.primary} weight="bold" />
            </View>
            
            <Text className="text-textPrimary text-xl font-bold mb-2 text-center">
              Bekräfta bokning
            </Text>
            
            <Text className="text-textSecondary text-sm text-center mb-1">
              Vill du boka
            </Text>
            <Text className="text-textPrimary text-base font-semibold mb-1">
              {className}
            </Text>
            <Text className="text-textSecondary text-sm text-center mb-6">
              {formattedDate}
            </Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-surface border border-borderGray/20"
                onPress={() => setShowConfirmation(false)}
                activeOpacity={0.8}
              >
                <Text className="text-textPrimary text-base font-semibold">Avbryt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-primary"
                onPress={handleBookClass}
                disabled={bookClass.isPending}
                activeOpacity={0.8}
              >
                {bookClass.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-bold">Bekräfta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SwipeableModal>
  );
}; 