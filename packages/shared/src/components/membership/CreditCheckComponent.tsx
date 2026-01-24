import { Text, TouchableOpacity, View } from 'react-native';
import { useCanVisitGym, useCreditUsage } from '../../hooks/useCreditUsage';
import { useGlobalFeedback } from '../../hooks/useGlobalFeedback';
import { DailyAccessService } from '../../services/DailyAccessService';

interface CreditCheckComponentProps {
  userId: string;
  gymId: string;
  gymName: string;
  onProceed?: () => void;
  onInsufficientCredits?: () => void;
  showWarning?: boolean;
}

/**
 * Component to check and display credit status before gym visits
 */
export function CreditCheckComponent({
  userId,
  gymId,
  gymName,
  onProceed,
  onInsufficientCredits,
  showWarning = true,
}: CreditCheckComponentProps) {
  const { canVisit, remainingCredits, allocatedCredits } = useCanVisitGym(userId, gymId);
  const { data: creditUsage } = useCreditUsage(userId);
  const { showError, showWarning: showWarningMsg } = useGlobalFeedback();

  const gymCreditInfo = creditUsage?.find((usage) => usage.gym_id === gymId);

  const handleVisitGym = async () => {
    if (!canVisit) {
      if (onInsufficientCredits) {
        onInsufficientCredits();
      } else {
        showError(
          'Inga krediter kvar',
          `Du har inga krediter kvar för ${gymName} denna månad. Dina krediter förnyas nästa faktureringsperiod.`
        );
      }
      return;
    }

    if (showWarning && remainingCredits <= 3) {
      showWarningMsg(
        'Få krediter kvar',
        `Du har ${remainingCredits} krediter kvar för ${gymName} denna månad.`
      );
      // Proceed anyway after showing warning
      if (onProceed) onProceed();
    } else {
      if (onProceed) onProceed();
    }
  };

  if (!gymCreditInfo) {
    return (
      <View className="bg-red-500/10 rounded-lg p-3 mb-4 border border-red-500/20">
        <Text className="text-sm font-medium text-red-500 text-center">
          Detta gym är inte inkluderat i din Daily Access
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-lg p-4 mb-4 border border-white/5">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-medium text-textPrimary">Daily Access Credits</Text>
        <Text className="text-sm font-bold text-textPrimary">
          {remainingCredits}/{allocatedCredits}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-textSecondary">Använda denna månad</Text>
        <Text className="text-sm text-textPrimary">{gymCreditInfo.credits_used}</Text>
      </View>

      {remainingCredits > 0 ? (
        <TouchableOpacity
          onPress={handleVisitGym}
          className="bg-primary rounded-lg py-3 px-4"
          activeOpacity={0.7}
        >
          <Text className="text-white font-medium text-center">Använd 1 kredit för besök</Text>
        </TouchableOpacity>
      ) : (
        <View className="bg-red-500/10 rounded-lg py-3 px-4 border border-red-500/20">
          <Text className="text-red-500 font-medium text-center">
            Inga krediter kvar denna månad
          </Text>
        </View>
      )}

      {remainingCredits <= 3 && remainingCredits > 0 && (
        <Text className="text-xs text-orange-500 text-center mt-2">
          Få krediter kvar - förnyas nästa faktureringsperiod
        </Text>
      )}
    </View>
  );
}

/**
 * Hook to record gym visits with proper error handling
 */
export function useGymVisitRecorder() {
  const recordVisit = async (
    userId: string,
    gymId: string,
    gymName: string,
    bookingId?: string
  ) => {
    try {
      // Check if user can visit before recording
      const canVisit = await DailyAccessService.canVisitGym(userId, gymId);

      if (!canVisit) {
        throw new Error(`Inga krediter kvar för ${gymName}`);
      }

      // Record the visit
      const result = await DailyAccessService.recordGymVisit(userId, gymId, 1, bookingId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: `Besök registrerat för ${gymName}. 1 kredit använd.`,
      };
    } catch (error) {
      console.error('Error recording gym visit:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Kunde inte registrera besök',
      };
    }
  };

  return { recordVisit };
}
