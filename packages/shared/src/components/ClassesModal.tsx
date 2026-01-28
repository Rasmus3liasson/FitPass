import colors from '@fitpass/shared/constants/custom-colors';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { UIClass } from '../types';
import { formatSwedishTime } from '../utils/time';
import { BaseModal } from './BaseModal';
import { ClassBookingModal } from './ClassBookingModal';
import { ClassCard } from './ClassCard';

interface ClassesModalProps {
  visible: boolean;
  onClose: () => void;
  classes: UIClass[];
  facilityName: string;
  images: string[];
  onClassPress: (classItem: UIClass) => void;

  simpleList?: boolean;
}

export function ClassesModal({
  visible,
  onClose,
  classes,
  facilityName,
  images,
  onClassPress,

  simpleList = false,
}: ClassesModalProps) {
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  const handleClassPress = (classItem: any) => {
    setSelectedClass(classItem);
    if (onClassPress) onClassPress(classItem);
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Available Classes" maxHeight={600}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {simpleList
          ? classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#222',
                  paddingHorizontal: 4,
                }}
                onPress={() => {
                  handleClassPress(classItem);
                }}
              >
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                    {classItem.name}
                  </Text>
                  <Text style={{ color: '#aaa', fontSize: 13 }}>{classItem.time}</Text>
                </View>
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}
                >
                  Boka
                </Text>
              </TouchableOpacity>
            ))
          : classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                name={classItem.name}
                facility={facilityName}
                image={images[0]}
                time={classItem.time}
                duration={classItem.duration}
                intensity={classItem.intensity}
                spots={classItem.spots}
                onPress={() => handleClassPress(classItem)}
              />
            ))}
      </ScrollView>
      {selectedClass && (
        <ClassBookingModal
          visible={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          classId={selectedClass.id}
          className={selectedClass.name}
          startTime={formatSwedishTime(selectedClass.time)}
          duration={selectedClass.duration}
          spots={selectedClass.spots}
          description={selectedClass.description}
          instructor={selectedClass.instructor}
          capacity={selectedClass.capacity}
          bookedSpots={selectedClass.bookedSpots}
          clubId={''}
        />
      )}
    </BaseModal>
  );
}
