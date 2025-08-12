import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { AnimatedScreen } from '@/src/components/AnimationProvider';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserBookings } from '@/src/hooks/useBookings';
import { useAllClasses } from '@/src/hooks/useClasses';
import { useAllClubs } from '@/src/hooks/useClubs';
import { useNews, useNewsFromTable } from '@/src/hooks/useNews';
import { useSocial } from '@/src/hooks/useSocial';

import { Calendar, Newspaper, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { DiscoverClasses, DiscoverFriends, NewsletterFeed } from '../social';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'news' | 'friends' | 'classes'>('news');
  const { user } = useAuth();
  
  // Fetch real data - only fetch user bookings if user exists
  const { data: allClasses = [], isLoading: classesLoading } = useAllClasses();
  const { data: allClubs = [], isLoading: clubsLoading } = useAllClubs();
  const { data: userBookings = [] } = useUserBookings(user?.id || "");
  const { data: newsData = [], isLoading: newsLoading, error: newsError } = useNews({ 
    target_audience: 'all', 
    limit: 20 
  });
  const { data: newsDataTable = [], isLoading: newsTableLoading, error: newsTableError } = useNewsFromTable({ 
    target_audience: 'all', 
    limit: 20 
  });
  const { getFriends } = useSocial();
  
  // State for social data
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Load friends data
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsData = await getFriends();
        setFriends(friendsData);
      } catch (error) {
        console.error('Error loading friends:', error);
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
    .filter(classItem => {
      // Only show upcoming classes
      const classTime = new Date(classItem.start_time);
      const now = new Date();
      return classTime > now;
    })
    .slice(0, 10) // Limit to 10 for performance
    .map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      gym_name: classItem.clubs?.name || 'Unknown Gym',
      gym_image: classItem.clubs?.image_url,
      club_id: classItem.club_id, // Add the club_id from the real data
      instructor_name: classItem.instructor?.profiles?.display_name || 'Instructor',
      start_time: classItem.start_time,
      duration: Math.floor((new Date(classItem.end_time).getTime() - new Date(classItem.start_time).getTime()) / (1000 * 60)),
      participants: {
        count: classItem.booked_spots || 0,
        friends: [] // TODO: Add friends who are attending this class
      },
      difficulty_level: 'Intermediate' as const, // TODO: Add difficulty to class data
      spots_available: (classItem.capacity || 0) - (classItem.booked_spots || 0),
      rating: 4.5 // TODO: Add rating to class data
    }));

  // Transform real news data for the NewsletterFeed component
  // Use table data if view data is empty
  const activeNewsData = newsData.length > 0 ? newsData : newsDataTable;
  const newsItems = activeNewsData.map(news => ({
    id: news.id,
    title: news.title,
    description: news.description || news.content?.substring(0, 150) + "..." || "",
    gym_name: news.club_name || 'FitPass',
    gym_logo: news.club_logo,
    image_url: news.image_url,
    timestamp: news.published_at || news.created_at,
    type: news.type as "new_class" | "event" | "update" | "promo",
    action_text: news.action_text,
    action_data: news.action_data
  }));

  // Transform friends data for suggestions
  const suggestedFriends = friends.slice(0, 10).map(friend => ({
    id: friend.id,
    name: friend.name,
    avatar_url: friend.avatar_url,
    mutual_friends: Math.floor(Math.random() * 5) + 1, // TODO: Calculate real mutual friends
    common_gym: undefined, // TODO: Find common gyms
    is_online: friend.is_online,
    bio: `${friend.workouts_this_week} workouts this week • ${friend.current_streak} day streak`
  }));

  // Handlers
  const handleNewsItemPress = (item: any) => {
    if (item.type === 'new_class') {
      Alert.alert(item.title, 'Would you like to book this class?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => {
          // Navigate to class booking
          Alert.alert('Class Booking', 'Would redirect to class booking page');
        }}
      ]);
    } else {
      Alert.alert(item.title, 'This would open the news item details or action.');
    }
  };

  const handleAddFriend = (friendId: string) => {
    Alert.alert('Friend Request', 'Friend request sent! 👋');
  };

  const handleSearchFriends = (query: string) => {
    // Search functionality would be implemented here
  };

  const handleJoinClass = (classId: string) => {
    Alert.alert('Join Class', 'You would be redirected to book this class!');
  };

  const handleViewGym = (gymName: string) => {
    Alert.alert('View Gym', `This would show details for ${gymName}`);
  };

  return (
    <SafeAreaWrapper edges={['top']} className="bg-background">
      <AnimatedScreen>
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-800">
          <Text className="text-white font-bold text-2xl">Discover</Text>
          <Text className="text-gray-400 text-sm mt-1">Find friends, classes, and news</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-surface/50 rounded-xl mx-4 mb-4 mt-4 p-1">
          {[
            { key: 'news', label: 'News', icon: Newspaper },
            { key: 'friends', label: 'Friends', icon: Users },
            { key: 'classes', label: 'Classes', icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key as any)}
              className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
                activeTab === key ? 'bg-primary' : ''
              }`}
            >
              <Icon
                size={16}
                color={activeTab === key ? '#FFFFFF' : '#9CA3AF'}
              />
              <Text
                className={`ml-2 font-medium ${
                  activeTab === key ? 'text-white' : 'text-gray-400'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'news' && (
          <>
            {newsLoading || newsTableLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-textSecondary">Loading news...</Text>
              </View>
            ) : newsItems.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-textSecondary">No news available</Text>
                <Text className="text-textSecondary text-sm mt-2">
                  Check console for debug info
                </Text>
              </View>
            ) : (
              <NewsletterFeed
                newsItems={newsItems}
                onNewsItemPress={handleNewsItemPress}
              />
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <DiscoverFriends
            suggestedFriends={suggestedFriends}
            onAddFriend={handleAddFriend}
            onSearchFriends={handleSearchFriends}
          />
        )}

        {activeTab === 'classes' && (
          <>
            {classesLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-textSecondary">Loading classes...</Text>
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
    </SafeAreaWrapper>
  );
}
