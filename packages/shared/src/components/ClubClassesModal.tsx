import colors from '@shared/constants/custom-colors';
import { Calendar, Clock, User, Users } from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useClassesByClub } from '../hooks/useClasses';
import { Class } from '../types';
import { formatSwedishTime } from '../utils/time';
import { BaseModal } from './BaseModal';
import { ClassBookingModal } from './ClassBookingModal';

interface ClubClassesModalProps {
  visible: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
}

export const ClubClassesModal: React.FC<ClubClassesModalProps> = ({
  visible,
  onClose,
  clubId,
  clubName,
}) => {
  const { data: classes = [], isLoading } = useClassesByClub(clubId);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const handleClassPress = (classItem: Class) => {
    setSelectedClass(classItem);
    setBookingModalVisible(true);
  };

  const handleBookingClose = () => {
    setBookingModalVisible(false);
    setSelectedClass(null);
  };

  return (
    <>
      <BaseModal visible={visible} onClose={onClose} title={`Pass hos ${clubName}`}>
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-textPrimary mt-4">Laddar pass...</Text>
            </View>
          ) : classes.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Calendar size={48} color={colors.borderGray} />
              <Text className="text-textPrimary text-lg font-semibold mt-4 text-center">
                Inga Pass Tillgängliga
              </Text>
              <Text className="text-textSecondary text-center mt-2">
                Det finns inga kommande pass att boka för denna klubb.
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="space-y-3 pb-4">
                {classes.map((classItem) => (
                  <TouchableOpacity
                    key={classItem.id}
                    onPress={() => handleClassPress(classItem)}
                    className="bg-surface rounded-2xl p-4 border border-accentGray"
                  >
                    {/* Class Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-textPrimary text-lg font-semibold mb-1">
                          {classItem.name}
                        </Text>
                        {classItem.description && (
                          <Text className="text-textSecondary text-sm" numberOfLines={2}>
                            {classItem.description}
                          </Text>
                        )}
                      </View>
                      <View className="ml-3">
                        <View className="bg-primary/20 px-3 py-1 rounded-full">
                          <Text className="text-textPrimary text-xs font-medium">
                            {classItem.intensity || 'Medel'} intensitet
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Class Details */}
                    <View className="space-y-2">
                      <View className="flex-row items-center">
                        <Calendar size={16} color={colors.borderGray} />
                        <Text className="text-textSecondary text-sm ml-2">
                          {formatSwedishTime(classItem.start_time, true)}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Clock size={16} color={colors.borderGray} />
                        <Text className="text-textSecondary text-sm ml-2">
                          {classItem.duration} minuter
                        </Text>
                      </View>

                      {classItem.instructor?.profiles?.display_name && (
                        <View className="flex-row items-center">
                          <User size={16} color={colors.borderGray} />
                          <Text className="text-textSecondary text-sm ml-2">
                            {classItem.instructor.profiles.display_name}
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center">
                        <Users size={16} color={colors.borderGray} />
                        <Text className="text-textSecondary text-sm ml-2">
                          {classItem.current_participants || 0}/
                          {classItem.max_participants || classItem.capacity} platser
                        </Text>
                      </View>
                    </View>

                    {/* Book Button */}
                    <View className="mt-4 pt-3 border-t border-accentGray">
                      <View className="bg-primary/10 rounded-xl py-2 px-4">
                        <Text className="text-textPrimary text-center font-medium">
                          Tryck för att boka detta pass
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </BaseModal>

      {/* Class Booking Modal */}
      {selectedClass && (
        <ClassBookingModal
          visible={bookingModalVisible}
          onClose={handleBookingClose}
          classId={selectedClass.id}
          className={selectedClass.name}
          startTime={selectedClass.start_time}
          duration={selectedClass.duration}
          spots={Math.max(
            0,
            (selectedClass.max_participants || selectedClass.capacity) -
              (selectedClass.current_participants || 0)
          )}
          description={selectedClass.description}
          instructor={selectedClass.instructor?.profiles?.display_name}
          capacity={selectedClass.max_participants || selectedClass.capacity}
          bookedSpots={selectedClass.current_participants || 0}
          clubId={clubId}
        />
      )}
    </>
  );
};
