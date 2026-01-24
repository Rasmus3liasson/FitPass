import { Ionicons } from '@expo/vector-icons';
import { ClassBookingModal } from '@shared/components/ClassBookingModal';
import { SafeAreaWrapper } from '@shared/components/SafeAreaWrapper';
import { useClubClasses } from '@shared/hooks/useClubs';
import { formatSwedishTime } from '@shared/utils/time';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ClassesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: classes } = useClubClasses(id as string);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  return (
    <SafeAreaWrapper>
      <View className="flex-row items-center px-4 py-4 border-b border-accentGray">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold">Available Classes</Text>
      </View>
      <ScrollView className="flex-1 px-4">
        {classes?.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            className="bg-white rounded-xl mb-3 p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => setSelectedClass(classItem)}
          >
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-1">{classItem.name}</Text>
              <Text className="text-base text-textPrimary mb-2">
                {formatSwedishTime(classItem.start_time)}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-sm text-textSecondary mr-2">{classItem.duration} min</Text>
                <Text className="text-sm text-textSecondary mr-2">•</Text>
                <Text className="text-sm text-textSecondary mr-2">{classItem.intensity}</Text>
                <Text className="text-sm text-textSecondary mr-2">•</Text>
                <Text className="text-sm text-textSecondary">
                  {classItem.max_participants - (classItem.current_participants || 0)} platser kvar
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ClassBookingModal
        visible={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classId={selectedClass?.id || ''}
        className={selectedClass?.name || ''}
        startTime={selectedClass?.start_time || new Date().toISOString()}
        duration={selectedClass?.duration || 0}
        spots={
          selectedClass
            ? selectedClass.max_participants - (selectedClass.current_participants || 0)
            : 0
        }
        capacity={selectedClass?.max_participants}
        clubId={id as string}
      />
    </SafeAreaWrapper>
  );
}
