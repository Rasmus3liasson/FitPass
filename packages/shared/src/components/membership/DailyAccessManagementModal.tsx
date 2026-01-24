import colors from '@shared/constants/custom-colors';
import { useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../config/constants';
import { useClubs } from '../../hooks/useClubs';
import { useDailyAccessGyms, useRemoveDailyAccessGym } from '../../hooks/useDailyAccess';
import { useGlobalFeedback } from '../../hooks/useGlobalFeedback';
import { Membership } from '../../types';
import { FeedbackComponent } from '../FeedbackComponent';
import { FullScreenModal } from '../FullScreenModal';
import { DailyAccessOverview } from './DailyAccessOverview';

interface DailyAccessManagementModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentPeriodEnd?: string;
  membership?: Membership;
}

export function DailyAccessManagementModal({
  visible,
  onClose,
  userId,
  currentPeriodEnd,
  membership,
}: DailyAccessManagementModalProps) {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useGlobalFeedback();

  // Local feedback state for inside modal
  const [localFeedback, setLocalFeedback] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    buttonText?: string;
    onButtonPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonPress?: () => void;
  }>({ visible: false, type: 'info', title: '' });

  const { data: clubs = [] } = useClubs();
  const {
    data: dailyAccessData,
    isLoading: loading,
    refetch: refetchDailyAccess,
  } = useDailyAccessGyms(userId);

  // Get enriched gym data by combining with clubs data
  const enrichedCurrentGyms = useMemo(() => {
    if (!dailyAccessData?.current || clubs.length === 0) return [];

    return dailyAccessData.current.map((gym) => {
      const clubData = clubs.find((club) => club.id === gym.gym_id);
      return {
        ...gym,
        clubData,
      };
    });
  }, [dailyAccessData?.current, clubs]);

  const enrichedPendingGyms = useMemo(() => {
    if (!dailyAccessData?.pending || clubs.length === 0) return [];

    return dailyAccessData.pending.map((gym) => {
      const clubData = clubs.find((club) => club.id === gym.gym_id);
      return {
        ...gym,
        clubData,
      };
    });
  }, [dailyAccessData?.pending, clubs]);

  const removeGymMutation = useRemoveDailyAccessGym();

  // Helper function to start gym selection process
  const handleSelectGyms = () => {
    // Close modal first, then navigate
    onClose();
    // Small delay to let modal start closing animation
    setTimeout(() => {
      router.push(ROUTES.USER_DISCOVER_DAILY_ACCESS as any);
    }, 100);
  };

  // Handle gym press - close modal and navigate
  const handleGymPress = (gymId: string) => {
    onClose(); // Close modal first
    router.push(ROUTES.FACILITY(gymId) as any);
  };

  // Handle pending gym options
  const handlePendingGymOptions = (gymId: string) => {
    const gym = enrichedPendingGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || 'Gym';

    setLocalFeedback({
      visible: true,
      type: 'info',
      title: `Hantera ${gymName}`,
      message: 'Vad vill du göra med detta gym?',
      buttonText: 'Ta bort från väntande',
      onButtonPress: () => {
        setLocalFeedback((prev) => ({ ...prev, visible: false }));
        handleRemovePendingGym(gymId, gymName);
      },
      secondaryButtonText: 'Avbryt',
      onSecondaryButtonPress: () => {
        setLocalFeedback((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  // Remove pending gym
  const handleRemovePendingGym = async (gymId: string, gymName: string) => {
    try {
      await removeGymMutation.mutateAsync({ userId, gymId });
      showSuccess('Gym borttaget', `${gymName} har tagits bort från dina väntande gym.`);
    } catch (error: any) {
      showError('Fel', error.message || 'Kunde inte ta bort gym från väntande.');
    }
  };

  // Reset modal state when opened
  useEffect(() => {
    if (visible && userId) {
      refetchDailyAccess();
    }
  }, [visible, userId]);

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Close Button */}
        <View className="absolute top-5 right-5 z-10">
          <TouchableOpacity
            onPress={onClose}
            className="w-11 h-11 bg-surface/60 rounded-full items-center justify-center border border-white/5"
            activeOpacity={0.7}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <DailyAccessOverview
          enrichedCurrentGyms={enrichedCurrentGyms}
          enrichedPendingGyms={enrichedPendingGyms}
          currentPeriodEnd={currentPeriodEnd}
          userId={userId}
          membership={membership}
          onSelectGyms={handleSelectGyms}
          onPendingGymOptions={handlePendingGymOptions}
          onGymPress={handleGymPress}
          onGymRemoved={refetchDailyAccess}
          onCloseModal={onClose}
          showLocalFeedback={setLocalFeedback}
        />

        {/* Local Feedback Component - renders inside modal */}
        <FeedbackComponent
          visible={localFeedback.visible}
          type={localFeedback.type}
          title={localFeedback.title}
          message={localFeedback.message}
          buttonText={localFeedback.buttonText}
          onClose={() => setLocalFeedback((prev) => ({ ...prev, visible: false }))}
          onButtonPress={localFeedback.onButtonPress}
          secondaryButtonText={localFeedback.secondaryButtonText}
          onSecondaryButtonPress={localFeedback.onSecondaryButtonPress}
        />
      </SafeAreaView>
    </FullScreenModal>
  );
}
