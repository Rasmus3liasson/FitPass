import colors from "@shared/constants/custom-colors";
import { ClockIcon, StarIcon, UsersIcon } from "phosphor-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { formatSwedishTime } from "../utils/time";
import { ClassBookingModal } from "./ClassBookingModal";
import { OptimizedImage } from "./OptimizedImage";

interface SocialClass {
  id: string;
  name: string;
  gym_name: string;
  gym_image?: string;
  club_id: string; // Add club_id to the interface
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

interface SocialClassCardProps {
  classItem: SocialClass;
  onViewGym: (gymName: string) => void;
}

const FriendAvatars: React.FC<{
  friends: SocialClass["participants"]["friends"];
}> = ({ friends }) => (
  <View className="flex-row -space-x-2 mr-3">
    {friends.slice(0, 3).map((friend, index) => (
      <View
        key={friend.id}
        className="w-8 h-8 rounded-full bg-accentGray border-2 border-surface overflow-hidden"
        style={{ zIndex: 3 - index }}
      >
        <OptimizedImage
          source={{
            uri:
              friend.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`,
          }}
          style={{ width: 32, height: 32 }}
        />
      </View>
    ))}
  </View>
);

const FriendsText: React.FC<{
  friends: SocialClass["participants"]["friends"];
}> = ({ friends }) => {
  if (friends.length === 1) {
    return (
      <Text className="text-textSecondary text-sm">
        {friends[0].name} is going
      </Text>
    );
  }
  if (friends.length === 2) {
    return (
      <Text className="text-textSecondary text-sm">
        {friends[0].name} and {friends[1].name} are going
      </Text>
    );
  }
  return (
    <Text className="text-textSecondary text-sm">
      {friends[0].name} and {friends.length - 1} others are going
    </Text>
  );
};

export const SocialClassCard: React.FC<SocialClassCardProps> = ({
  classItem,
  onViewGym,
}) => {
  const [selectedClass, setSelectedClass] = useState<SocialClass | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const handleJoinClass = () => {
    setSelectedClass(classItem);
    setBookingModalVisible(true);
  };

  const handleBookingClose = () => {
    setBookingModalVisible(false);
    setSelectedClass(null);
  };

  return (
    <>
      <View className="bg-surface rounded-2xl mb-4 overflow-hidden">
        {/* Header */}
        <View className="p-4 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-lg">
                {classItem.name}
              </Text>
              <TouchableOpacity onPress={() => onViewGym(classItem.gym_name)}>
                <Text className="text-primary text-sm font-medium">
                  {classItem.gym_name}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center">
              <Text className="text-accentYellow font-medium mr-1">
                {classItem.rating}
              </Text>
              <StarIcon size={14} color={colors.accentYellow} weight="fill" />
            </View>
          </View>

          {/* Class Details */}
          <View className="flex-row items-center mb-3">
            <Text className="text-textSecondary text-sm mr-1">
              {formatSwedishTime(classItem.start_time)} • {classItem.duration}{" "}
              min
            </Text>
            <ClockIcon size={14} color={colors.textSecondary} />
          </View>

          {/* Instructor */}
          <Text className="text-textSecondary text-sm mb-3">
            instruktör:{" "}
            <Text className="text-textPrimary font-medium">
              {classItem.instructor_name}
            </Text>
          </Text>
        </View>

        {/* Friends Going */}
        {classItem.participants.friends.length > 0 && (
          <View className="px-4 py-3 bg-primary/5 border-t border-accentGray">
            <View className="flex-row items-center">
              <FriendAvatars friends={classItem.participants.friends} />
              <FriendsText friends={classItem.participants.friends} />
            </View>
          </View>
        )}

        {/* Action Area */}
        <View className="p-4 pt-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-textSecondary text-sm mr-1">
                {classItem.participants.count} deltagare •{" "}
                {classItem.spots_available} platser kvar
              </Text>
              <UsersIcon size={16} color={colors.textSecondary} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleJoinClass}
            className="bg-primary rounded-xl py-3 items-center"
          >
            <Text className="text-textPrimary font-semibold">Boka Klass</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          clubId={selectedClass.club_id}
        />
      )}
    </>
  );
};
