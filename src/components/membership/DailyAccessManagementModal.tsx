import { ROUTES } from "@/src/config/constants";
import { useClubs } from "@/src/hooks/useClubs";
import {
  useDailyAccessGyms,
  useRemoveDailyAccessGym,
} from "@/src/hooks/useDailyAccess";
import { Membership } from "@/src/types";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FullScreenModal } from "../FullScreenModal";
import { DailyAccessOverview } from "./DailyAccessOverview";

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
    onClose(); // Close modal first
    router.push(ROUTES.USER_DISCOVER_DAILY_ACCESS as any);
  };

  // Handle gym press - close modal and navigate
  const handleGymPress = (gymId: string) => {
    onClose(); // Close modal first
    router.push(ROUTES.FACILITY(gymId) as any);
  };

  // Handle pending gym options
  const handlePendingGymOptions = (gymId: string) => {
    const gym = enrichedPendingGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || "Gym";

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Avbryt", "Ta bort från väntande"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: `Hantera ${gymName}`,
          message: "Vad vill du göra med detta gym?",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleRemovePendingGym(gymId, gymName);
          }
        }
      );
    } else {
      // Android Alert
      Alert.alert(`Hantera ${gymName}`, "Vad vill du göra med detta gym?", [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Ta bort från väntande",
          style: "destructive",
          onPress: () => handleRemovePendingGym(gymId, gymName),
        },
      ]);
    }
  };

  // Remove pending gym
  const handleRemovePendingGym = async (gymId: string, gymName: string) => {
    try {
      await removeGymMutation.mutateAsync({ userId, gymId });
      Alert.alert(
        "Gym borttaget",
        `${gymName} har tagits bort från dina väntande gym.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert(
        "Fel",
        error.message || "Kunde inte ta bort gym från väntande.",
        [{ text: "OK" }]
      );
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
        <View className="absolute top-4 right-4 z-10">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-transparent rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={20} color="#374151" />
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
        />
      </SafeAreaView>
    </FullScreenModal>
  );
}
