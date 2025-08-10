import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { AnimatedScreen } from '@/src/components/AnimationProvider';


import { Calendar, Newspaper, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { DiscoverClasses, DiscoverFriends, NewsletterFeed } from '../social';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'news' | 'friends' | 'classes'>('news');

  // Mock news data
  const mockNews = [
    {
      id: '1',
      title: 'New HIIT Classes Added',
      description: 'We\'ve added exciting new HIIT classes to our morning schedule! Perfect for starting your day with energy. Classes run Monday to Friday at 7:00 AM.',
      gym_name: 'SATS Södermalm',
      gym_logo: undefined,
      image_url: undefined,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      type: 'new_class' as const,
      action_text: 'Book Now',
      action_data: { class_type: 'HIIT' }
    },
    {
      id: '2',
      title: 'Weekend Yoga Retreat',
      description: 'Join us for a peaceful weekend yoga retreat in the Stockholm archipelago. All levels welcome. Includes meals and accommodation.',
      gym_name: 'YogaWorks Stockholm',
      gym_logo: undefined,
      image_url: undefined,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      type: 'event' as const,
      action_text: 'Learn More',
      action_data: { event_id: 'yoga_retreat' }
    },
    {
      id: '3',
      title: 'New Equipment Arrival',
      description: 'We\'ve just installed state-of-the-art cardio machines and updated our strength training area. Come check out the new gear!',
      gym_name: 'Nordic Wellness',
      gym_logo: undefined,
      image_url: undefined,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      type: 'update' as const,
      action_text: 'Visit Gym',
      action_data: { gym_id: 'nordic_wellness' }
    }
  ];

  // Mock friends data
  const mockSuggestedFriends = [
    {
      id: '1',
      name: 'Emma Johnson',
      avatar_url: undefined,
      mutual_friends: 3,
      common_gym: 'SATS Södermalm',
      is_online: true,
      bio: 'Yoga enthusiast and marathon runner. Always up for trying new classes!'
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar_url: undefined,
      mutual_friends: 1,
      common_gym: 'Nordic Wellness',
      is_online: false,
      bio: 'Personal trainer specializing in strength training. Love helping others reach their goals.'
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      avatar_url: undefined,
      mutual_friends: 2,
      common_gym: undefined,
      is_online: true,
      bio: 'Dance fitness instructor and pilates lover. Let\'s move together!'
    }
  ];

  // Mock classes data
  const mockSocialClasses = [
    {
      id: '1',
      name: 'Morning Yoga Flow',
      gym_name: 'YogaWorks Stockholm',
      gym_image: undefined,
      instructor_name: 'Maria Lindberg',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      participants: {
        count: 12,
        friends: [
          { id: '1', name: 'Emma', avatar_url: undefined },
          { id: '3', name: 'Sarah', avatar_url: undefined }
        ]
      },
      difficulty_level: 'Beginner' as const,
      spots_available: 3,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Strength & Conditioning',
      gym_name: 'SATS Södermalm',
      gym_image: undefined,
      instructor_name: 'Alex Andersson',
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      participants: {
        count: 8,
        friends: [
          { id: '2', name: 'Mike', avatar_url: undefined }
        ]
      },
      difficulty_level: 'Intermediate' as const,
      spots_available: 7,
      rating: 4.6
    }
  ];

  // Handlers
  const handleNewsItemPress = (item: any) => {
    Alert.alert(item.title, 'This would open the news item details or action.');
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
            newsItems={mockNews}
            onNewsItemPress={handleNewsItemPress}
          />
        )}

        {activeTab === 'friends' && (
          <DiscoverFriends
            suggestedFriends={mockSuggestedFriends}
            onAddFriend={handleAddFriend}
            onSearchFriends={handleSearchFriends}
          />
        )}

        {activeTab === 'classes' && (
          <DiscoverClasses
            classes={mockSocialClasses}
            onJoinClass={handleJoinClass}
            onViewGym={handleViewGym}
          />
        )}
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
