import colors from "@/src/constants/custom-colors";
import { useFavorites } from "@/src/hooks/useFavorites";
import { useSocialStats } from "@/src/hooks/useFriends";
import { useCreateConversation } from "@/src/hooks/useMessaging";
import { useUserVisits } from "@/src/hooks/useVisits";
import { router } from "expo-router";
import {
  Activity,
  Building2,
  Calendar,
  Flame,
  MapPin,
  MessageCircle,
  Trophy,
  User
} from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { BaseModal } from "./BaseModal";

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    status?: "pending" | "accepted" | "blocked";
    current_streak?: number;
    workouts_this_week?: number;
    is_online?: boolean;
    mutual_friends_count?: number;
    bio?: string;
    created_at?: string;
    city?: string;
    total_workouts?: number;
    favorite_activities?: string[];
    favorite_clubs?: Array<{
      id: string;
      name: string;
      type?: string;
    }>;
    frequent_gym?: {
      id: string;
      name: string;
      type?: string;
    };
    profile_visibility?: boolean;
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const { data: visits = [], isLoading: visitsLoading } = useUserVisits(user.id);
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(user.id);
  const { data: socialStats, isLoading: statsLoading } = useSocialStats(user.id);
  const createConversationMutation = useCreateConversation();

  // Calculate real stats from visits
  const totalWorkouts = visits.length;
  
  // Calculate workouts this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const workoutsThisWeek = visits.filter(
    (visit) => new Date(visit.visit_date) >= startOfWeek
  ).length;

  // Calculate current streak
  const calculateStreak = () => {
    if (visits.length === 0) return 0;
    
    const sortedVisits = [...visits].sort(
      (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const visit of sortedVisits) {
      const visitDate = new Date(visit.visit_date);
      visitDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor(
        (currentDate.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  // Get most frequent gym
  const getFrequentGym = () => {
    if (visits.length === 0) return null;
    
    const gymCounts: Record<string, { count: number; gym: any }> = {};
    
    visits.forEach((visit) => {
      const clubId = visit.club_id;
      if (!gymCounts[clubId]) {
        gymCounts[clubId] = {
          count: 0,
          gym: visit.clubs,
        };
      }
      gymCounts[clubId].count++;
    });
    
    const mostFrequent = Object.values(gymCounts).sort((a, b) => b.count - a.count)[0];
    return mostFrequent?.gym;
  };

  const frequentGym = getFrequentGym();

  const handleStartConversation = async () => {
    try {
      const conversationId = await createConversationMutation.mutateAsync(user.id);
      onClose();
      router.push(`/(user)/messages/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "Nyligen registrerad";
    const date = new Date(dateString);
    return `Medlem sedan ${date.toLocaleDateString("sv-SE", {
      month: "long",
      year: "numeric",
    })}`;
  };

  const isLoading = visitsLoading || favoritesLoading || statsLoading;

  return (
    <BaseModal visible={visible} onClose={onClose} title={user.name}>
      {isLoading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-textSecondary mt-4">Laddar profildata...</Text>
        </View>
      ) : (
        <>
          {/* Profile Header */}
          <View className="items-center mb-6">
            <View className="relative mb-4">
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-surface items-center justify-center">
                  <User size={40} color="#666" strokeWidth={1.5} />
                </View>
              )}
              {user.is_online && (
                <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-accentGreen rounded-full border-3 border-background" />
              )}
            </View>

            {user.bio && (
              <Text className="text-textSecondary text-center text-base mb-4 leading-relaxed px-4">
                {user.bio}
              </Text>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4 w-full px-4">
              <TouchableOpacity
                onPress={handleStartConversation}
                disabled={createConversationMutation.isPending}
                className="flex-1 bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center"
                style={{
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <MessageCircle size={20} color={colors.textPrimary} strokeWidth={2} />
                <Text className="text-textPrimary font-semibold ml-2">
                  {createConversationMutation.isPending ? "Skapar..." : "Skicka meddelande"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center space-x-4 mb-4 flex-wrap">
              {user.city && (
                <View className="flex-row items-center space-x-1">
                  <MapPin size={16} color="#666" strokeWidth={1.5} />
                  <Text className="text-textSecondary text-sm">{user.city}</Text>
                </View>
              )}
              <View className="flex-row items-center space-x-1">
                <Calendar size={16} color="#666" strokeWidth={1.5} />
                <Text className="text-textSecondary text-sm">
                  {formatJoinDate(user.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-surface rounded-xl p-4 items-center">
              <View className="flex-row items-center space-x-2 mb-2">
                <Flame size={18} color="#ef4444" strokeWidth={1.5} />
                <Text className="text-textSecondary text-sm">Streak</Text>
              </View>
              <Text className="text-textPrimary text-2xl font-bold">
                {currentStreak}
              </Text>
              <Text className="text-textSecondary text-xs">dagar</Text>
            </View>

            <View className="flex-1 bg-surface rounded-xl p-4 items-center">
              <View className="flex-row items-center space-x-2 mb-2">
                <Activity size={18} color="#8b5cf6" strokeWidth={1.5} />
                <Text className="text-textSecondary text-sm">Denna vecka</Text>
              </View>
              <Text className="text-textPrimary text-2xl font-bold">
                {workoutsThisWeek}
              </Text>
              <Text className="text-textSecondary text-xs">träningar</Text>
            </View>
          </View>

          {/* Total Workouts */}
          <View className="bg-surface rounded-xl p-4 mb-4">
            <View className="flex-row items-center space-x-2 mb-2">
              <Trophy size={18} color="#6366f1" strokeWidth={1.5} />
              <Text className="text-textSecondary text-sm">Totalt träningar</Text>
            </View>
            <Text className="text-textPrimary text-xl font-bold">
              {totalWorkouts}
            </Text>
          </View>

      {/* Favorite Activities */}
      {user.favorite_activities && user.favorite_activities.length > 0 && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-textPrimary font-semibold mb-3">
            Favoritaktiviteter
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {user.favorite_activities.map((activity, index) => (
              <View
                key={index}
                className="bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <Text className="text-primary text-sm font-medium">
                  {activity}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Club Information - only show if profile is public */}
      {user.profile_visibility !== false && (
        <>
          {/* Frequent Gym - Using Real Data */}
          {frequentGym && (
            <View className="bg-surface rounded-xl p-4 mb-4">
              <View className="flex-row items-center space-x-2 mb-2">
                <Building2 size={18} color="#8b5cf6" strokeWidth={1.5} />
                <Text className="text-textPrimary font-semibold">Tränar ofta på</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-textPrimary font-medium">{frequentGym.name}</Text>
                {frequentGym.type && (
                  <View className="ml-2 bg-primary/10 px-2 py-1 rounded-full">
                    <Text className="text-primary text-xs font-medium">{frequentGym.type}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Favorite Clubs - Using Real Data */}
          {favorites && favorites.length > 0 && (
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-textPrimary font-semibold mb-3">
                Favoritanläggningar ({favorites.length})
              </Text>
              <View className="space-y-2">
                {favorites.slice(0, 5).map((fav: any) => (
                  <View key={fav.id} className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Building2 size={16} color="#666" strokeWidth={1.5} />
                      <Text className="text-textPrimary ml-2 font-medium">
                        {fav.clubs?.name || "Okänd anläggning"}
                      </Text>
                    </View>
                    {fav.clubs?.type && (
                      <View className="bg-green-500/10 px-2 py-1 rounded-full">
                        <Text className="text-green-600 text-xs font-medium">
                          {fav.clubs.type}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* Mutual Friends */}
      {user.mutual_friends_count !== undefined && user.mutual_friends_count > 0 && (
        <View className="bg-surface rounded-xl p-4">
          <Text className="text-textPrimary font-semibold mb-2">
            Gemensamma kontakter
          </Text>
          <Text className="text-textSecondary">
            Ni har {user.mutual_friends_count} gemensam
            {user.mutual_friends_count !== 1 ? "ma" : ""} vän
            {user.mutual_friends_count !== 1 ? "ner" : ""}
          </Text>
        </View>
      )}
        </>
      )}
    </BaseModal>
  );
};
