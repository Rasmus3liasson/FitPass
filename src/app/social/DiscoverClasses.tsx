import { ClassBookingModal } from "@/src/components/ClassBookingModal";
import { OptimizedImage } from "@/src/components/OptimizedImage";
import { Calendar, Clock, Star, Users } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface SocialClass {
  id: string;
  name: string;
  gym_name: string;
  gym_image?: string;
  instructor_name: string;
  start_time: string;
  duration: number;
  participants: {
    count: number;
    friends: Array<{
      id: string;
      name: string;
      avatar_url?: string;
    }>;
  };
  difficulty_level: "Beginner" | "Intermediate" | "Advanced";
  spots_available: number;
  rating: number;
}

interface DiscoverClassesProps {
  classes: SocialClass[];
  onJoinClass: (classId: string) => void;
  onViewGym: (gymName: string) => void;
}

export const DiscoverClasses: React.FC<DiscoverClassesProps> = ({
  classes,
  onJoinClass,
  onViewGym,
}) => {
  const [selectedClass, setSelectedClass] = useState<SocialClass | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const handleJoinClass = (classItem: SocialClass) => {
    setSelectedClass(classItem);
    setBookingModalVisible(true);
  };

  const handleBookingClose = () => {
    setBookingModalVisible(false);
    setSelectedClass(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-accentGreen/20 text-accentGreen";
      case "Intermediate":
        return "bg-accentYellow/20 text-accentYellow";
      case "Advanced":
        return "bg-accentRed/20 text-accentRed";
      default:
        return "bg-accentGray/20 text-textSecondary";
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text className="text-textPrimary font-bold text-lg mb-4">
          Classes with Friends
        </Text>

        {classes.map((classItem) => (
          <View
            key={classItem.id}
            className="bg-surface rounded-2xl mb-4 overflow-hidden"
          >
            {/* Header */}
            <View className="p-4 pb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-textPrimary font-bold text-lg">
                    {classItem.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onViewGym(classItem.gym_name)}
                  >
                    <Text className="text-primary text-sm font-medium">
                      {classItem.gym_name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center">
                  <Star size={14} color="#FFCA28" fill="#FFCA28" />
                  <Text className="text-accentYellow font-medium ml-1">
                    {classItem.rating}
                  </Text>
                </View>
              </View>

              {/* Class Details */}
              <View className="flex-row items-center space-x-4 mb-3">
                <View className="flex-row items-center">
                  <Clock size={14} color="#A0A0A0" />
                  <Text className="text-textSecondary text-sm ml-1">
                    {formatTime(classItem.start_time)} • {classItem.duration}min
                  </Text>
                </View>

                <View
                  className={`px-2 py-1 rounded-full ${getDifficultyColor(
                    classItem.difficulty_level
                  )}`}
                >
                  <Text className="text-xs font-medium">
                    {classItem.difficulty_level}
                  </Text>
                </View>
              </View>

              {/* Instructor */}
              <Text className="text-textSecondary text-sm mb-3">
                with{" "}
                <Text className="text-textPrimary font-medium">
                  {classItem.instructor_name}
                </Text>
              </Text>
            </View>

            {/* Friends Going */}
            {classItem.participants.friends.length > 0 && (
              <View className="px-4 py-3 bg-primary/5 border-t border-accentGray">
                <View className="flex-row items-center">
                  <View className="flex-row -space-x-2 mr-3">
                    {classItem.participants.friends
                      .slice(0, 3)
                      .map((friend, index) => (
                        <View
                          key={friend.id}
                          className="w-8 h-8 rounded-full bg-accentGray border-2 border-surface overflow-hidden"
                          style={{ zIndex: 3 - index }}
                        >
                          {friend.avatar_url ? (
                            <OptimizedImage
                              source={{ uri: friend.avatar_url }}
                              style={{ width: 32, height: 32 }}
                            />
                          ) : (
                            <View className="w-full h-full bg-primary/20 items-center justify-center">
                              <Text className="text-primary font-bold text-xs">
                                {friend.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                  </View>

                  <Text className="text-textSecondary text-sm">
                    {classItem.participants.friends.length === 1
                      ? `${classItem.participants.friends[0].name} is going`
                      : classItem.participants.friends.length === 2
                      ? `${classItem.participants.friends[0].name} and ${classItem.participants.friends[1].name} are going`
                      : `${classItem.participants.friends[0].name} and ${
                          classItem.participants.friends.length - 1
                        } others are going`}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Area */}
            <View className="p-4 pt-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Users size={16} color="#A0A0A0" />
                  <Text className="text-textSecondary text-sm ml-1">
                    {classItem.participants.count} joined •{" "}
                    {classItem.spots_available} spots left
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleJoinClass(classItem)}
                className="bg-primary rounded-xl py-3 items-center"
              >
                <Text className="text-textPrimary font-semibold">
                  Join Class
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Empty State */}
        {classes.length === 0 && (
          <View className="items-center py-12">
            <View className="w-20 h-20 bg-accentGray rounded-full items-center justify-center mb-4">
              <Calendar size={32} color="#A0A0A0" />
            </View>
            <Text className="text-textSecondary text-center text-lg mb-2">
              No classes with friends
            </Text>
            <Text className="text-borderGray text-center text-sm">
              Add more friends or explore classes to see social recommendations
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      {selectedClass && (
        <ClassBookingModal
          visible={bookingModalVisible}
          onClose={handleBookingClose}
          classId={selectedClass.id}
          className={selectedClass.name}
          startTime={selectedClass.start_time}
          duration={selectedClass.duration}
          spots={selectedClass.spots_available}
          instructor={selectedClass.instructor_name}
          clubId="1"
        />
      )}
    </>
  );
};
