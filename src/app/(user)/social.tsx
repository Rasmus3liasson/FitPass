import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { AnimatedScreen } from '@/src/components/AnimationProvider';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserBookings } from '@/src/hooks/useBookings';
import { useAllClasses } from '@/src/hooks/useClasses';
import { useAllClubs } from '@/src/hooks/useClubs';
import { useSocial } from '@/src/hooks/useSocial';

import { Calendar, Newspaper, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { DiscoverClasses, DiscoverFriends, NewsletterFeed } from '../social';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'news' | 'friends' | 'classes'>('news');
  const { user } = useAuth();
  
  // Fetch real data
  const { data: allClasses = [], isLoading: classesLoading } = useAllClasses();
  const { data: allClubs = [], isLoading: clubsLoading } = useAllClubs();
  const { data: userBookings = [] } = useUserBookings(user?.id || "");
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

  // Create news data from recent class additions and gym updates
  const newsItems = [
    // Recent new classes
    ...allClasses
      .filter(classItem => {
        const createdDate = new Date(classItem.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate > weekAgo;
      })
      .slice(0, 5)
      .map(classItem => ({
        id: `class_${classItem.id}`,
        title: `New ${classItem.name} Classes Added`,
        description: `We've added exciting new ${classItem.name} classes to our schedule! Join us at ${classItem.clubs?.name}.`,
        gym_name: classItem.clubs?.name || 'FitPass',
        gym_logo: classItem.clubs?.image_url,
        image_url: undefined,
        timestamp: classItem.created_at,
        type: 'new_class' as const,
        action_text: 'Book Now',
        action_data: { class_id: classItem.id }
      })),
    
    // Add some general gym updates from clubs
    ...allClubs
      .slice(0, 3)
      .map((club, index) => ({
        id: `club_update_${club.id}`,
        title: `Updates from ${club.name}`,
        description: `Check out what's new at ${club.name}. New equipment, classes, and member benefits await you!`,
        gym_name: club.name,
        gym_logo: club.image_url,
        image_url: undefined,
        timestamp: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
        type: 'update' as const,
        action_text: 'Visit Gym',
        action_data: { club_id: club.id }
      }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
        { text: 'Book Now', onPress: () => console.log('Book class:', item.action_data.class_id) }
      ]);
    } else {
      Alert.alert(item.title, 'This would open the news item details or action.');
    }
  };

  const handleAddFriend = (friendId: string) => {
    Alert.alert('Friend Request', 'Friend request sent! 👋');
  };

  const handleSearchFriends = (query: string) => {
    console.log('Searching for friends:', query);
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
          <NewsletterFeed
            newsItems={newsItems}
            onNewsItemPress={handleNewsItemPress}
          />
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
