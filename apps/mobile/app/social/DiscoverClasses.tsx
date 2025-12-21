import { SocialClassCard } from "@shared/components/SocialClassCard";
import { Calendar } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";

interface SocialClass {
  id: string;
  name: string;
  gym_name: string;
  gym_image?: string;
  club_id: string; // Add club_id to match SocialClassCard interface
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
  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      <Text className="text-textPrimary font-bold text-lg mb-4">
        Pass med Vänner
      </Text>

      {classes.map((classItem) => (
        <SocialClassCard
          key={classItem.id}
          classItem={classItem}
          onViewGym={onViewGym}
        />
      ))}

      {/* Empty State */}
      {classes.length === 0 && (
        <View className="items-center py-12">
          <View className="w-20 h-20 bg-accentGray rounded-full items-center justify-center mb-4">
            <Calendar size={32} color="#A0A0A0" />
          </View>
          <Text className="text-textSecondary text-center text-lg mb-2">
            Inga pass med vänner
          </Text>
          <Text className="text-borderGray text-center text-sm">
            Lägg till fler vänner eller utforska pass för att se sociala rekommendationer
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
