import { Check, Plus } from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useConfirmPendingSelections } from "../../hooks/useDailyAccess";
import { useGlobalFeedback } from "../../hooks/useGlobalFeedback";

interface DailyAccessActionButtonProps {
  hasCurrentGyms: boolean;
  hasPendingGyms: boolean;
  onSelectGyms: () => void;
  isFirstTime?: boolean;
  userId?: string;
  onConfirmSuccess?: () => void;
  onCloseModal?: () => void;
  showLocalFeedback?: (config: {
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    buttonText?: string;
    onButtonPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonPress?: () => void;
  }) => void;
}

export function DailyAccessActionButton({
  hasCurrentGyms,
  hasPendingGyms,
  onSelectGyms,
  isFirstTime = false,
  userId,
  onConfirmSuccess,
  onCloseModal,
  showLocalFeedback,
}: DailyAccessActionButtonProps) {
  const { showSuccess, showError, showInfo, showWarning, hideFeedback } = useGlobalFeedback();
  const confirmPendingMutation = useConfirmPendingSelections();

  const handleConfirmSelection = async () => {
    if (!userId) return;

    try {
      await confirmPendingMutation.mutateAsync({ userId });
      showSuccess(
        "Gym aktiverade!",
        "Dina valda gym är nu aktiva och du kan börja använda dina krediter.",
        {
          buttonText: "OK",
          onButtonPress: () => {
            hideFeedback();
            onCloseModal?.();
          },
        }
      );
    } catch (error: any) {
      showError(
        "Fel",
        error.message || "Kunde inte aktivera gym."
      );
    }
  };

  const handleSelectGymsWithConfirmation = () => {
    // For first-time users, show info feedback inside modal
    if (isFirstTime) {
      if (showLocalFeedback) {
        showLocalFeedback({
          visible: true,
          type: "info",
          title: "Välj dina gym",
          message: "Du kan välja upp till 3 gym för din Daily Access. Du kan ändra ditt val fram till nästa faktureringsdatum.",
          buttonText: "Fortsätt",
          onButtonPress: () => {
            // Just navigate - let React Navigation close the modal automatically
            onSelectGyms();
          },
        });
      } else {
        onSelectGyms();
      }
      return;
    }

    // For users with only pending gyms, just navigate
    if (!hasCurrentGyms && hasPendingGyms) {
      onSelectGyms();
      return;
    }

    // For users with current gyms, show confirmation over modal
    if (showLocalFeedback) {
      showLocalFeedback({
        visible: true,
        type: "warning",
        title: "Bekräfta ändringar",
        message: "Vill du ändra dina valda gym? Ändringar träder i kraft nästa faktureringscykel.",
        buttonText: "Fortsätt",
        onButtonPress: () => {
          onSelectGyms();
        },
        secondaryButtonText: "Avbryt",
        onSecondaryButtonPress: () => {
          showLocalFeedback({ visible: false, type: "info", title: "" });
        },
      });
    } else {
      // Fallback to global feedback if showLocalFeedback not provided
      showWarning(
        "Bekräfta ändringar",
        "Vill du ändra dina valda gym? Ändringar träder i kraft nästa faktureringscykel.",
        {
          buttonText: "Fortsätt",
          onButtonPress: () => {
            hideFeedback();
            onSelectGyms();
          },
          secondaryButtonText: "Avbryt",
          onSecondaryButtonPress: () => {
            hideFeedback();
          },
        }
      );
    }
  };

  // Show confirm button if there are pending gyms but no active gyms
  const showConfirmButton = hasPendingGyms && !hasCurrentGyms;

  return (
    <View className="space-y-3">
      {showConfirmButton && (
        <TouchableOpacity
          onPress={handleConfirmSelection}
          className="bg-accentGreen rounded-2xl p-4 flex-row items-center justify-center"
          activeOpacity={0.8}
          disabled={confirmPendingMutation.isPending}
        >
          {confirmPendingMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={20} color="white" />
              <Text className="text-white font-bold ml-2 text-base">
                Bekräfta val och aktivera nu
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        onPress={handleSelectGymsWithConfirmation}
        className="bg-primary rounded-2xl p-4 flex-row items-center justify-center"
        activeOpacity={0.8}
      >
        <Plus size={20} color="white" />
        <Text className="text-white font-semibold ml-2 text-base">
          {hasCurrentGyms ? "Ändra Val" : hasPendingGyms ? "Välj fler gym" : "Välj Gym"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
