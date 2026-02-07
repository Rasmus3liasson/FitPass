import { useNavigation } from '../services/navigationService';
import {
  useAddDailyAccessGym,
  useDailyAccessGyms,
  usePendingReplaceDailyAccessGym,
} from '../hooks/useDailyAccess';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';

interface UseDailyAccessDiscoveryProps {
  userId: string | undefined;
  isDailyAccessMode: boolean;
  replaceGymId?: string;
}

export const useDailyAccessDiscovery = ({
  userId,
  isDailyAccessMode,
  replaceGymId,
}: UseDailyAccessDiscoveryProps) => {
  const navigation = useNavigation();
  const { showSuccess, showError, showInfo, showWarning, hideFeedback } = useGlobalFeedback();

  // Get current Daily Access selections if in Daily Access mode
  const { data: dailyAccessData, refetch: refetchDailyAccess } = useDailyAccessGyms(
    isDailyAccessMode ? userId : undefined
  );

  // Daily Access gym selection mutations
  const addDailyAccessGym = useAddDailyAccessGym();
  const pendingReplaceGymMutation = usePendingReplaceDailyAccessGym();

  // Helper function to check if a gym is selected for Daily Access
  const isGymSelectedForDailyAccess = (gymId: string) => {
    if (!isDailyAccessMode || !dailyAccessData) return false;

    const allSelected = [...(dailyAccessData.current || []), ...(dailyAccessData.pending || [])];
    return allSelected.some((gym) => gym.gym_id === gymId);
  };

  // Handle Daily Access addition - only for plus button clicks
  const handleAddToDailyAccess = (club: any) => {
    if (isDailyAccessMode) {
      handleDailyAccessGymSelection(club);
    }
  };

  // Handle gym selection for Daily Access
  const handleDailyAccessGymSelection = async (club: any) => {
    if (!userId) return;

    const isAlreadySelected = isGymSelectedForDailyAccess(club.id);
    const currentCount =
      (dailyAccessData?.current || []).length + (dailyAccessData?.pending || []).length;

    // If we're in replace mode
    if (replaceGymId) {
      if (isAlreadySelected) {
        showInfo('Gym redan valt', `${club.name} är redan valt för din Daily Access.`);
        return;
      }

      // Find the gym we're replacing for display
      const allCurrentGyms = [
        ...(dailyAccessData?.current || []),
        ...(dailyAccessData?.pending || []),
      ];
      const replacingGym = allCurrentGyms.find((gym) => gym.gym_id === replaceGymId);
      const replacingGymName = replacingGym?.gym_name || 'det valda gymmet';

      showWarning('Ersätt gym', `Vill du ersätta ${replacingGymName} med ${club.name}?`, {
        buttonText: 'Ersätt',
        onButtonPress: async () => {
          hideFeedback();
          try {
            // First mark the old gym for replacement (matches Current Gym Display flow)
            await pendingReplaceGymMutation.mutateAsync({
              userId: userId,
              gymId: replaceGymId,
            });

            // Then add the new gym
            await addDailyAccessGym.mutateAsync({
              userId: userId,
              gymId: club.id,
            });

            // Refetch data to update UI
            refetchDailyAccess();

            showSuccess(
              'Ersättning schemalagd!',
              `${replacingGymName} kommer att ersättas med ${club.name} vid nästa faktureringsperiod. Du behåller åtkomst till båda tills dess.`,
              {
                buttonText: 'OK',
                onButtonPress: () => {
                  hideFeedback();
                  // Navigate back to Daily Access modal
                  navigation.back();
                },
              }
            );
          } catch (error: any) {
            showError('Fel', error.message || 'Kunde inte schemalägga ersättning.');
          }
        },
        secondaryButtonText: 'Avbryt',
        onSecondaryButtonPress: () => {
          hideFeedback();
        },
      });
      return;
    }

    // Regular selection logic (not replace mode)
    if (isAlreadySelected) {
      showInfo('Gym redan valt', `${club.name} är redan valt för din Daily Access.`);
      return;
    }

    if (currentCount >= 3) {
      showWarning(
        'Max gräns nådd',
        'Du har redan valt 3 gym för Daily Access. Ta bort ett gym för att välja ett nytt.'
      );
      return;
    }

    // Show confirmation dialog
    showInfo('Lägg till gym', `Vill du lägga till ${club.name} till din Daily Access?`, {
      buttonText: 'Lägg till',
      onButtonPress: async () => {
        hideFeedback();
        try {
          await addDailyAccessGym.mutateAsync({
            userId: userId,
            gymId: club.id,
          });

          // Refetch data to update UI
          refetchDailyAccess();

          showSuccess('Gym tillagt!', `${club.name} har lagts till i din Daily Access.`);
        } catch (error: any) {
          showError('Fel', error.message || 'Kunde inte lägga till gym.');
        }
      },
      secondaryButtonText: 'Avbryt',
      onSecondaryButtonPress: () => {
        hideFeedback();
      },
    });
  };

  return {
    dailyAccessData,
    isGymSelectedForDailyAccess,
    handleAddToDailyAccess,
    handleDailyAccessGymSelection,
    refetchDailyAccess,
  };
};
