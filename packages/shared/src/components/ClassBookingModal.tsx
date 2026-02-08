import colors from '@fitpass/shared/constants/custom-colors';

import { Calendar, Check, Clock, MapPinIcon, User, Users } from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useBookClass } from '../hooks/useClubs';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';
import { useNavigation } from '../services/navigationService';
import { formatSwedishTime } from '../utils/time';
import { SwipeableModal } from './SwipeableModal';

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
  intensity?: 'Low' | 'Medium' | 'High';
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
  const navigation = useNavigation();
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
      navigation.push('/(auth)/login' as any);
      return;
    }

    try {
      await bookClass.mutateAsync({
        userId: auth.user.id,
        classId,
        clubId,
      });

      showSuccess(`Klass bokad: ${className}.`, 'Kolla din bokningsflik för detaljer.');
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Fel vid bokning av klass:', error);
      showError(
        'Bokning misslyckades',
        'Något gick fel. Kontrollera dina krediter och försök igen.'
      );
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <SwipeableModal visible={visible} onClose={handleClose} snapPoint={0.63}>
      <View className="bg-surface flex-1">
        {!showConfirmation ? (
          <>
            {/* Compact Header */}
            <View className="px-6 pt-5 pb-4 border-b border-borderGray/20">
              <Text className="text-textPrimary text-xl font-bold mb-1">{className}</Text>
              {facilityName && (
                <View className="flex-row items-center">
                  <MapPinIcon size={14} color={colors.textSecondary} weight="duotone" />
                  <Text className="text-textSecondary text-sm ml-1">{facilityName}</Text>
                </View>
              )}
            </View>

            {/* Description (if available) */}
            {description && (
              <View className="px-6 pt-4 pb-2">
                <Text className="text-textSecondary text-sm leading-relaxed">{description}</Text>
              </View>
            )}

            {/* Class Information Grid */}
            <View className="px-6 py-4 flex-1">
              <Text className="text-textPrimary font-semibold text-base mb-3">
                Klassinformation
              </Text>

              <View className="bg-background rounded-xl p-4 gap-3">
                {/* Date */}
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-xs">Datum</Text>
                    <Text className="text-textPrimary font-semibold text-sm mt-0.5">
                      {(() => {
                        try {
                          const date = new Date(startTime);
                          return date.toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        } catch {
                          return startTime;
                        }
                      })()}
                    </Text>
                  </View>
                  <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                    <Calendar size={18} color={colors.primary} weight="duotone" />
                  </View>
                </View>

                <View className="h-px bg-borderGray/20" />

                {/* Time */}
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-xs">Tid</Text>
                    <Text className="text-textPrimary font-semibold text-sm mt-0.5">
                      {(() => {
                        try {
                          const date = new Date(startTime);
                          return date.toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        } catch {
                          return formattedDate;
                        }
                      })()}
                    </Text>
                  </View>
                  {/* {intensity && (
                    <View
                      className={`px-2.5 py-1 rounded-lg mr-2 ${
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
                        {intensity === 'High' ? 'Hög' : intensity === 'Medium' ? 'Medel' : 'Låg'}
                      </Text>
                    </View>
                  )} */}
                  <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                    <Clock size={18} color={colors.primary} weight="duotone" />
                  </View>
                </View>

                <View className="h-px bg-borderGray/20" />

                {/* Duration */}
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-xs">Längd</Text>
                    <Text className="text-textPrimary font-semibold text-sm mt-0.5">
                      {duration} minuter
                    </Text>
                  </View>
                  <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                    <Clock size={18} color={colors.primary} weight="duotone" />
                  </View>
                </View>

                {/* Instructor */}
                {instructor && (
                  <>
                    <View className="h-px bg-borderGray/20" />
                    <View className="flex-row items-center">
                      <View className="flex-1">
                        <Text className="text-textSecondary text-xs">Instruktör</Text>
                        <Text className="text-textPrimary font-semibold text-sm mt-0.5">
                          {instructor}
                        </Text>
                      </View>
                      <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                        <User size={18} color={colors.primary} weight="duotone" />
                      </View>
                    </View>
                  </>
                )}

                <View className="h-px bg-borderGray/20" />

                {/* Available Spots */}
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-xs">Lediga platser</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text
                        className={`font-bold text-sm ${
                          spots <= 5 && spots > 0 ? 'text-accentOrange' : 'text-textPrimary'
                        }`}
                      >
                        {spots}
                      </Text>
                      {typeof capacity === 'number' && capacity > 0 && (
                        <Text className="text-textSecondary text-sm ml-1">av {capacity}</Text>
                      )}
                    </View>
                  </View>
                  {spots <= 5 && spots > 0 && (
                    <View className="bg-accentOrange/20 px-2 py-1 rounded-lg mr-2">
                      <Text className="text-accentOrange text-xs font-semibold">Få kvar</Text>
                    </View>
                  )}
                  <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
                    <Users size={18} color={colors.primary} weight="duotone" />
                  </View>
                </View>
              </View>
            </View>

            {/* Book Button */}
            <View className="px-6 pb-6 pt-2">
              {spots <= 0 ? (
                <View className="bg-accentRed/10 border border-accentRed/30 rounded-xl p-4">
                  <Text className="text-accentRed text-center font-semibold">
                    Tyvärr är denna klass fullbokad
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-primary rounded-xl py-4 items-center active:scale-[0.98]"
                  onPress={() => setShowConfirmation(true)}
                  disabled={bookClass.isPending}
                  activeOpacity={0.8}
                >
                  {bookClass.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-base font-bold">Boka detta pass</Text>
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

            <Text className="text-textSecondary text-sm text-center mb-1">Vill du boka</Text>
            <Text className="text-textPrimary text-base font-semibold mb-1">{className}</Text>
            <Text className="text-textSecondary text-sm text-center mb-6">{formattedDate}</Text>

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
