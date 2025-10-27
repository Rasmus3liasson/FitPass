import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { ClassesModal } from "@/src/components/ClassesModal";
import { NewsModal } from "@/src/components/NewsModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserBookings } from "@/src/hooks/useBookings";
import { useAllClasses, useClassesByClub } from "@/src/hooks/useClasses";
import { useAllClubs } from "@/src/hooks/useClubs";
import { useFavorites } from "@/src/hooks/useFavorites";
import { useNews, useNewsFromTable } from "@/src/hooks/useNews";
import { useSocial } from "@/src/hooks/useSocial";
import { NewsActionHandler } from "@/src/utils/newsActionHandler";
import { useRouter } from "expo-router";

import { Calendar, Filter, Newspaper, Users } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { DiscoverClasses, DiscoverFriends, NewsletterFeed } from "../social";

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<"news" | "friends" | "classes">(
    "news"
  );
  const [newsFilter, setNewsFilter] = useState<"all" | "favorites">("all");
  const { user } = useAuth();
  const router = useRouter();

  // Fetch real data - only fetch user bookings if user exists
  const { data: allClasses = [], isLoading: classesLoading } = useAllClasses();
  const { data: allClubs = [], isLoading: clubsLoading } = useAllClubs();
  const { data: userBookings = [] } = useUserBookings(user?.id || "");
  const { data: favorites = [] } = useFavorites(user?.id || "");
  const {
    data: newsData = [],
    isLoading: newsLoading,
    error: newsError,
  } = useNews({
    target_audience: "all",
    limit: 20,
  });

  const {
    data: newsDataTable = [],
    isLoading: newsTableLoading,
    error: newsTableError,
  } = useNewsFromTable({
    target_audience: "all",
    limit: 20,
  });
  const { getFriends } = useSocial();

  // State for social data
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [classesModalVisible, setClassesModalVisible] = useState(false);
  const [selectedClubForClasses, setSelectedClubForClasses] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<any | null>(null);

  // Fetch classes for selected club
  const { data: clubClasses = [] } = useClassesByClub(
    selectedClubForClasses?.id || ""
  );

  // Load friends data
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsData = await getFriends();
        setFriends(friendsData);
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        setFriendsLoading(false);
      }
    };

    if (user?.id) {
      loadFriends();
    }
  }, [user?.id, getFriends]);

  // Transform real classes data for social display
  const socialClasses = allClasses
    .filter((classItem) => {
      // Only show upcoming classes
      const classTime = new Date(classItem.start_time);
      const now = new Date();
      return classTime > now;
    })
    .slice(0, 10) // Limit to 10 for performance
    .map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      gym_name: classItem.clubs?.name || "Unknown Gym",
      gym_image: classItem.clubs?.image_url,
      club_id: classItem.club_id, // Add the club_id from the real data
      instructor_name:
        classItem.instructor?.profiles?.display_name || "Instructor",
      start_time: classItem.start_time,
      duration: Math.floor(
        (new Date(classItem.end_time).getTime() -
          new Date(classItem.start_time).getTime()) /
          (1000 * 60)
      ),
      participants: {
        count: classItem.booked_spots || 0,
        friends: [], // TODO: Add friends who are attending this class
      },
      difficulty_level: "Intermediate" as const, // TODO: Add difficulty to class data
      spots_available:
        (classItem.capacity || 0) - (classItem.booked_spots || 0),
      rating: 4.5, // TODO: Add rating to class data
    }));

  // Transform real news data for the NewsletterFeed component
  // Prioritize table data as it includes club logos, fallback to view data
  const activeNewsData = newsDataTable.length > 0 ? newsDataTable : newsData;

  // Filter news based on favorites
  const filteredNews = useMemo(() => {
    if (newsFilter === "all") {
      return activeNewsData;
    }

    // Get favorite club IDs
    const favoriteClubIds = favorites.map((fav) => fav.club_id);

    // Filter news items to only show those from favorite clubs
    return activeNewsData.filter(
      (news) => news.club_id && favoriteClubIds.includes(news.club_id)
    );
  }, [activeNewsData, newsFilter, favorites]);

  const newsItems = filteredNews.map((news) => ({
    id: news.id,
    title: news.title,
    description:
      news.description || news.content?.substring(0, 150) + "..." || "",
    gym_name: news.club_name || `${process.env.APP_NAME} News`,
    gym_logo: news.club_logo,
    image_url: news.image_url,
    timestamp: news.published_at || news.created_at,
    type: news.type as "new_class" | "event" | "update" | "promo",
    action_text: news.action_text,
    action_data: news.action_data,
  }));

  // Transform club classes to the format expected by ClassesModal
  const formattedClubClasses = useMemo(() => {
    return clubClasses.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      time: classItem.start_time,
      duration: `${classItem.duration} min`,
      intensity: classItem.intensity as "Low" | "Medium" | "High",
      spots: Math.max(
        0,
        (classItem.max_participants || classItem.capacity) -
          (classItem.current_participants || 0)
      ),
    }));
  }, [clubClasses]);

  const handleClassPress = (classItem: any) => {
    // Find the original class data to get all needed info for booking
    const originalClass = clubClasses.find((c) => c.id === classItem.id);
    if (originalClass) {
      // Here you would typically navigate to a booking screen or open booking modal
      // For now, let's just show an alert
      Alert.alert("Boka Pass", `Vill du boka ${originalClass.name}?`, [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Boka",
          onPress: () => {
            // TODO: Implement actual booking logic
            Alert.alert("Bokning", "Bokningsfunktion kommer snart!");
          },
        },
      ]);
    }
  };
  const suggestedFriends = friends.slice(0, 10).map((friend) => ({
    id: friend.id,
    name: friend.name,
    avatar_url: friend.avatar_url,
    mutual_friends: Math.floor(Math.random() * 5) + 1, // TODO: Calculate real mutual friends
    common_gym: undefined, // TODO: Find common gyms
    is_online: friend.is_online,
    bio: `${friend.workouts_this_week} workouts this week • ${friend.current_streak} day streak`,
  }));

  // Handlers
  const handleNewsItemPress = (item: any) => {
    setSelectedNewsItem(item);
    setNewsModalVisible(true);
  };

  const handleNewsActionPress = async (item: any) => {
    // Close the modal first
    setNewsModalVisible(false);
    setSelectedNewsItem(null);

    // Then handle the action
    await NewsActionHandler.handleNewsAction(item, router, allClubs, (club) => {
      setSelectedClubForClasses(club);
      setClassesModalVisible(true);
    });
  };

  const handleSearchFriends = (query: string) => {
    // Search functionality would be implemented here
  };

  const handleJoinClass = (classId: string) => {
    Alert.alert(
      "Gå med i pass",
      "Du skulle omdirigeras för att boka detta pass!"
    );
  };

  const handleViewGym = (gymName: string) => {
    Alert.alert("Visa gym", `Detta skulle visa detaljer för ${gymName}`);
  };

  return (
    <SafeAreaWrapper edges={["top"]} className="bg-background">
      <AnimatedScreen>
        <PageHeader title="Upptäck" subtitle="Hitta vänner, pass och nyheter" />

        {/* Tab Navigation */}
        <View className="flex-row bg-surface/50 rounded-xl mx-4 mb-4 p-1">
          {[
            { key: "news", label: "Nyheter", icon: Newspaper },
            { key: "friends", label: "Vänner", icon: Users },
            { key: "classes", label: "Pass", icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key as any)}
              className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                activeTab === key ? "bg-primary" : ""
              }`}
            >
              <Icon
                size={16}
                color={activeTab === key ? "#FFFFFF" : "#9CA3AF"}
              />
              <Text
                className={`ml-2 font-medium ${
                  activeTab === key ? "text-textPrimary" : "text-textSecondary"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === "news" && (
          <>
            {/* Filter Toggle for News */}
            <View className="flex-row bg-surface/50 rounded-xl mx-4 mb-4 p-1">
              <TouchableOpacity
                onPress={() => setNewsFilter("all")}
                className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                  newsFilter === "all" ? "bg-primary" : ""
                }`}
              >
                <Newspaper
                  size={16}
                  color={newsFilter === "all" ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text
                  className={`ml-2 font-medium ${
                    newsFilter === "all"
                      ? "text-textPrimary"
                      : " text-textSecondary"
                  }`}
                >
                  Alla Nyheter
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewsFilter("favorites")}
                className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                  newsFilter === "favorites" ? "bg-primary" : ""
                }`}
              >
                <Filter
                  size={16}
                  color={newsFilter === "favorites" ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text
                  className={`ml-2 font-medium ${
                    newsFilter === "favorites"
                      ? "text-textPrimary"
                      : "text-textSecondary"
                  }`}
                >
                  Endast Favoriter
                </Text>
              </TouchableOpacity>
            </View>

            {newsLoading || newsTableLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-textSecondary">Laddar nyheter...</Text>
              </View>
            ) : newsItems.length === 0 ? (
              <View>
                <View className="items-center py-12">
                  <View className="w-20 h-20 bg-accentGray rounded-full items-center justify-center mb-4">
                    <Calendar size={32} color="#A0A0A0" />
                  </View>
                  <Text className="text-textSecondary text-center text-lg mb-2">
                    Du har inga nyheter än
                  </Text>
                </View>
                {newsFilter === "all" && (
                  <Text className="text-textSecondary text-sm mt-2">
                    Kontrollera konsolen för felsökningsinformation
                  </Text>
                )}
              </View>
            ) : (
              <NewsletterFeed
                newsItems={newsItems}
                onNewsItemPress={handleNewsItemPress}
              />
            )}
          </>
        )}

        {activeTab === "friends" && (
          <DiscoverFriends
            suggestedFriends={suggestedFriends}
            onSearchFriends={handleSearchFriends}
          />
        )}

        {activeTab === "classes" && (
          <>
            {classesLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-textSecondary">Laddar pass...</Text>
              </View>
            ) : (
              <DiscoverClasses
                classes={socialClasses}
                onJoinClass={handleJoinClass}
                onViewGym={handleViewGym}
              />
            )}
          </>
        )}
      </AnimatedScreen>

      {/* News Detail Modal */}
      <NewsModal
        visible={newsModalVisible}
        onClose={() => {
          setNewsModalVisible(false);
          setSelectedNewsItem(null);
        }}
        newsItem={selectedNewsItem}
        onActionPress={handleNewsActionPress}
      />

      {/* Club Classes Modal */}
      {selectedClubForClasses && (
        <ClassesModal
          visible={classesModalVisible}
          onClose={() => {
            setClassesModalVisible(false);
            setSelectedClubForClasses(null);
          }}
          classes={formattedClubClasses}
          facilityName={selectedClubForClasses.name}
          images={[]} // Add club images if available
          onClassPress={handleClassPress}
          simpleList={true}
        />
      )}
    </SafeAreaWrapper>
  );
}
