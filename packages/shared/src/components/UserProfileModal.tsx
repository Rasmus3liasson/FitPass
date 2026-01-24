import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../config/constants';
import { useFavorites } from '../hooks/useFavorites';
import { useSocialStats } from '../hooks/useFriends';
import { useCreateConversation } from '../hooks/useMessaging';
import { useUserVisits } from '../hooks/useVisits';
import { SwipeableModal } from './SwipeableModal';
import { ProfileActivityTab } from './UserProfile/ProfileActivityTab';
import { ProfileClubsTab } from './UserProfile/ProfileClubsTab';
import { ProfileHeader } from './UserProfile/ProfileHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    status?: 'pending' | 'accepted' | 'blocked';
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'clubs' | 'activity'>('activity');

  const { data: visits = [], isLoading: visitsLoading } = useUserVisits(user.id);
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(user.id);
  const { data: socialStats, isLoading: statsLoading } = useSocialStats(user.id);
  const createConversationMutation = useCreateConversation();
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Calculate stats
  const totalWorkouts = visits.length;
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const workoutsThisWeek = visits.filter(
    (visit) => new Date(visit.visit_date) >= startOfWeek
  ).length;

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

  const handleStartConversation = async () => {
    try {
      const conversationId = await createConversationMutation.mutateAsync(user.id);
      onClose();
      router.push(ROUTES.MESSAGES_ID(conversationId) as any);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleNavigateToClub = (clubId: string) => {
    onClose();
    router.push(`/facility/${clubId}` as any);
  };

  const handleViewMutualFriends = () => {
    // TODO: Implement mutual friends view
  };

  const handleReportUser = () => {
    setActionSheetVisible(false);
    // TODO: Implement report user
    console.log('Report user:', user.id);
  };

  const handleBlockUser = () => {
    setActionSheetVisible(false);
    // TODO: Implement block user
    console.log('Block user:', user.id);
  };

  const isLoading = visitsLoading || favoritesLoading || statsLoading;

  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      maxHeight="95%"
      showScrollIndicator={false}
      enableSwipe={true}
    >
      <View className="flex-1" style={{ minHeight: SCREEN_HEIGHT * 0.65 }}>
        {/* Header */}
        <ProfileHeader
          user={user}
          onClose={onClose}
          onMessage={handleStartConversation}
          onShowOptions={() => setActionSheetVisible(true)}
        />

        {/* Tab Navigation */}
        <View className="flex-row bg-surface/50 rounded-xl p-1 mb-6 mx-4">
          <TouchableOpacity
            onPress={() => setActiveTab('activity')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'activity' ? 'bg-primary' : ''}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center font-medium text-sm ${
                activeTab === 'activity' ? 'text-textPrimary' : 'text-textSecondary'
              }`}
            >
              Aktivitet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('clubs')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'clubs' ? 'bg-primary' : ''}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center font-medium text-sm ${
                activeTab === 'clubs' ? 'text-textPrimary' : 'text-textSecondary'
              }`}
            >
              Anläggningar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="flex-1 px-4">
          {isLoading ? (
            <View className="py-20 items-center justify-center">
              <Text className="text-textSecondary">Laddar profildata...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'activity' && (
                <ProfileActivityTab
                  userVisits={visits}
                  isLoadingVisits={visitsLoading}
                  totalWorkouts={totalWorkouts}
                />
              )}
              {activeTab === 'clubs' && (
                <ProfileClubsTab
                  userVisits={visits}
                  isLoadingVisits={visitsLoading}
                  favoriteClubs={favorites}
                  isLoadingFavorites={favoritesLoading}
                  onNavigateToClub={handleNavigateToClub}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/*   <CustomActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={`Hantera ${user.name}`}
        options={[
          {
            text: "Rapportera användare",
            onPress: handleReportUser,
            style: "destructive",
          },
          {
            text: "Blockera användare",
            onPress: handleBlockUser,
            style: "destructive",
          },
          {
            text: "Avbryt",
            onPress: () => setActionSheetVisible(false),
            style: "default",
          },
        ]}
      /> */}
    </SwipeableModal>
  );
};
