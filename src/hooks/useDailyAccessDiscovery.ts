import {
    useAddDailyAccessGym,
    useDailyAccessGyms,
    usePendingReplaceDailyAccessGym,
} from "@/src/hooks/useDailyAccess";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

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
  const router = useRouter();
  
  // Get current Daily Access selections if in Daily Access mode
  const { data: dailyAccessData, refetch: refetchDailyAccess } =
    useDailyAccessGyms(isDailyAccessMode ? userId : undefined);

  // Daily Access gym selection mutations
  const addDailyAccessGym = useAddDailyAccessGym();
  const pendingReplaceGymMutation = usePendingReplaceDailyAccessGym();

  // Helper function to check if a gym is selected for Daily Access
  const isGymSelectedForDailyAccess = (gymId: string) => {
    if (!isDailyAccessMode || !dailyAccessData) return false;

    const allSelected = [
      ...(dailyAccessData.current || []),
      ...(dailyAccessData.pending || []),
    ];
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
      (dailyAccessData?.current || []).length +
      (dailyAccessData?.pending || []).length;

    // If we're in replace mode
    if (replaceGymId) {
      if (isAlreadySelected) {
        Alert.alert(
          "Gym redan valt",
          `${club.name} är redan valt för din Daily Access.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Find the gym we're replacing for display
      const allCurrentGyms = [
        ...(dailyAccessData?.current || []),
        ...(dailyAccessData?.pending || []),
      ];
      const replacingGym = allCurrentGyms.find(
        (gym) => gym.gym_id === replaceGymId
      );
      const replacingGymName = replacingGym?.gym_name || "det valda gymmet";

      Alert.alert(
        "Ersätt gym",
        `Vill du ersätta ${replacingGymName} med ${club.name}?`,
        [
          { text: "Avbryt", style: "cancel" },
          {
            text: "Ersätt",
            onPress: async () => {
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

                Alert.alert(
                  "Ersättning schemalagd!",
                  `${replacingGymName} kommer att ersättas med ${club.name} vid nästa faktureringsperiod. Du behåller åtkomst till båda tills dess.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Navigate back to Daily Access modal
                        router.back();
                      },
                    },
                  ]
                );
              } catch (error: any) {
                Alert.alert("Fel", error.message || "Kunde inte schemalägga ersättning.", [
                  { text: "OK" },
                ]);
              }
            },
          },
        ]
      );
      return;
    }

    // Regular selection logic (not replace mode)
    if (isAlreadySelected) {
      Alert.alert(
        "Gym redan valt",
        `${club.name} är redan valt för din Daily Access.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (currentCount >= 3) {
      Alert.alert(
        "Max gräns nådd",
        "Du har redan valt 3 gym för Daily Access. Ta bort ett gym för att välja ett nytt.",
        [{ text: "OK" }]
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Lägg till gym",
      `Vill du lägga till ${club.name} till din Daily Access?`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Lägg till",
          onPress: async () => {
            try {
              await addDailyAccessGym.mutateAsync({
                userId: userId,
                gymId: club.id,
              });

              // Refetch data to update UI
              refetchDailyAccess();

              Alert.alert(
                "Gym tillagt!",
                `${club.name} har lagts till i din Daily Access.`,
                [{ text: "OK" }]
              );
            } catch (error: any) {
              Alert.alert(
                "Fel",
                error.message || "Kunde inte lägga till gym.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  return {
    dailyAccessData,
    isGymSelectedForDailyAccess,
    handleAddToDailyAccess,
    handleDailyAccessGymSelection,
    refetchDailyAccess,
  };
};