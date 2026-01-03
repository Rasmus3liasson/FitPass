import colors from '@shared/constants/custom-colors';
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
  const { showSuccess, showError, showInfo, showWarning, hideFeedback } =
    useGlobalFeedback();
  const confirmPendingMutation = useConfirmPendingSelections();

  const handleConfirmSelection = async () => {
    if (!userId) return;

    try {
      await confirmPendingMutation.mutateAsync({ userId });

      if (showLocalFeedback) {
        showLocalFeedback({
          visible: true,
          type: "success",
          title: "Gym aktiverade!",
          message:
            "Dina valda gym är nu aktiva och du kan börja använda dina krediter.",
          buttonText: "OK",
          onButtonPress: () => {
            showLocalFeedback({ visible: false, type: "success", title: "" });
            onCloseModal?.();
          },
        });
      } else {
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
      }
    } catch (error: any) {
      if (showLocalFeedback) {
        showLocalFeedback({
          visible: true,
          type: "error",
          title: "Fel",
          message: error.message || "Kunde inte aktivera gym.",
          buttonText: "OK",
          onButtonPress: () => {
            showLocalFeedback({ visible: false, type: "error", title: "" });
          },
        });
      } else {
        showError("Fel", error.message || "Kunde inte aktivera gym.");
      }
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
          message:
            "Du kan välja upp till 3 gym för din Daily Access. Du kan ändra ditt val fram till nästa faktureringsdatum.",
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
        message:
          "Vill du ändra dina valda gym? Ändringar träder i kraft nästa faktureringscykel.",
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
    <View style={{ gap: 12 }}>
      <TouchableOpacity
        onPress={handleSelectGymsWithConfirmation}
        activeOpacity={0.75}
        style={{
          backgroundColor: showConfirmButton ? "#1E1E1E" : colors.primary,
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: showConfirmButton ? 1.5 : 0,
          borderColor: showConfirmButton
            ? "rgba(160, 160, 160, 0.2)"
            : "transparent",
        }}
      >
        <Plus size={20} color="white" strokeWidth={2.5} />
        <Text
          style={{
            color: "white",
            fontSize: 15,
            fontWeight: showConfirmButton ? "600" : "700",
            marginLeft: 8,
          }}
        >
          {hasCurrentGyms
            ? "Ändra Val"
            : hasPendingGyms
            ? "Välj fler gym"
            : "Välj Gym"}
        </Text>
      </TouchableOpacity>
      {showConfirmButton && (
        <TouchableOpacity
          onPress={handleConfirmSelection}
          disabled={confirmPendingMutation.isPending}
          activeOpacity={0.75}
          style={{
            backgroundColor: colors.accentGreen,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {confirmPendingMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={20} color="white" strokeWidth={2.5} />
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "700",
                  marginLeft: 8,
                }}
              >
                Bekräfta val och aktivera nu
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
