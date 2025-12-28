import { useRouter } from "expo-router";
import { Clock, Edit3, MapPin, Trash2, Users } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ROUTES } from "../../config/constants";
import { useUserBookings } from "../../hooks/useBookings";
import {
  type SelectedGym,
  usePendingRemoveDailyAccessGym,
  usePendingReplaceDailyAccessGym,
} from "../../hooks/useDailyAccess";
import { CustomAlert } from "../CustomAlert";
import { OptimizedImage } from "../OptimizedImage";
import { GymChangeConfirmationModal } from "./GymChangeConfirmationModal";

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface CurrentGymsDisplayProps {
  enrichedCurrentGyms: EnrichedGym[];
  enrichedPendingGyms: EnrichedGym[];
  creditPerGym: number;
  userId?: string;
  membership?: any;
  bookings?: any[];
  onPendingGymOptions?: (gymId: string) => void;
  showPendingOptions?: boolean;
  onGymPress?: (gymId: string) => void;
  onGymRemoved?: () => void;
  onCloseModal?: () => void;
}

export function CurrentGymsDisplay({
  enrichedCurrentGyms,
  enrichedPendingGyms,
  creditPerGym,
  userId,
  membership,
  bookings: passedBookings,
  onPendingGymOptions,
  showPendingOptions = true,
  onGymPress,
  onGymRemoved,
  onCloseModal,
}: CurrentGymsDisplayProps) {
  const router = useRouter();
  const pendingRemoveGymMutation = usePendingRemoveDailyAccessGym();
  const pendingReplaceGymMutation = usePendingReplaceDailyAccessGym();

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "default" | "destructive" | "warning";
    buttons: Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "default",
    buttons: []
  });

  // Use passed bookings data or fetch if not provided
  const bookingsQuery = useUserBookings(userId || "");
  const bookings = passedBookings || bookingsQuery.data || [];

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    type: "remove" | "replace";
    gymId: string;
    gymName: string;
    creditsUsed: number;
  } | null>(null);

  // Helper function to check if a gym has significant credit usage (threshold-based protection)
  const isGymActivelyUsed = (gymId: string) => {
    const creditsUsed = getCreditsUsed(gymId);
    const usagePercentage = (creditsUsed / creditPerGym) * 100;
    // Consider gym "actively used" if more than 20% of credits have been used
    return usagePercentage > 20;
  };

  // Helper function to get pending status styling
  const getPendingStatusInfo = (gym: EnrichedGym) => {
    if (gym.status === "pending_removal") {
      return {
        badgeText: "Tas bort nästa period",
        badgeColor: "bg-red-500/10 border-red-500/20",
        textColor: "text-red-600",
        icon: <Clock size={12} color="#EF4444" />,
        cardOverlay: "bg-red-500/5",
      };
    }
    if (gym.status === "pending_replacement") {
      return {
        badgeText: "Ersätts nästa period",
        badgeColor: "bg-orange-500/10 border-orange-500/20",
        textColor: "text-orange-600",
        icon: <Clock size={12} color="#F59E0B" />,
        cardOverlay: "bg-orange-500/5",
      };
    }
    return null;
  };

  // Calculate credits used per gym based on actual booking data
  const getCreditsUsed = (gymId: string) => {
    if (!membership || !bookings.length) return 0;

    // Filter bookings for this specific gym that consumed credits
    const gymBookings = bookings.filter(
      (booking) => booking.club_id === gymId && booking.credits_used > 0
    );

    // Calculate total credits used for this gym
    const creditsUsedForGym = gymBookings.reduce(
      (total, booking) => total + (booking.credits_used || 0),
      0
    );

    console.log(`Credits used for gym ${gymId}:`, {
      gymBookings: gymBookings.length,
      creditsUsedForGym,
      bookings: gymBookings.map((b) => ({
        id: b.id,
        gym: b.clubs?.name,
        credits_used: b.credits_used,
        created_at: b.created_at,
      })),
    });

    return creditsUsedForGym;
  };

  const handleGymPress = (gymId: string) => {
    if (onGymPress) {
      onGymPress(gymId);
    } else {
      router.push(ROUTES.FACILITY(gymId) as any);
    }
  };

  const handleRemoveGym = (gymId: string) => {
    if (!userId) return;

    const gym = enrichedCurrentGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || "gymmet";
    const creditsUsed = getCreditsUsed(gymId);

    setConfirmationModal({
      visible: true,
      type: "remove",
      gymId,
      gymName,
      creditsUsed,
    });
  };

  const handleConfirmRemove = async () => {
    if (!userId || !confirmationModal) return;

    try {
      await pendingRemoveGymMutation.mutateAsync({
        userId,
        gymId: confirmationModal.gymId,
      });
      onGymRemoved?.();
      setConfirmationModal(null);
      setAlertConfig({
        visible: true,
        title: "Borttagning schemalagd",
        message: `${confirmationModal.gymName} kommer att tas bort vid nästa faktureringsperiod. Du behåller åtkomst tills dess.`,
        type: "default",
        buttons: [{ text: "OK" }]
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Fel",
        message: "Kunde inte schemalägga borttagning. Försök igen.",
        type: "destructive",
        buttons: [{ text: "OK" }]
      });
    }
  };

  const handleEditGym = (gymId: string) => {
    if (!userId) return;

    const gym = enrichedCurrentGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || "gymmet";
    const creditsUsed = getCreditsUsed(gymId);

    setConfirmationModal({
      visible: true,
      type: "replace",
      gymId,
      gymName,
      creditsUsed,
    });
  };

  const handleConfirmReplace = async () => {
    if (!userId || !confirmationModal) return;

    try {
      // Mark current gym for replacement
      await pendingReplaceGymMutation.mutateAsync({
        userId,
        gymId: confirmationModal.gymId,
      });

      setConfirmationModal(null);

      // Close the modal first
      onCloseModal?.();

      // Navigate to discover with replace mode and the gym to replace
      console.log(
        "Attempting navigation to replace gym:",
        confirmationModal.gymId
      );
      router.push({
        pathname: "/(user)/discover",
        params: {
          dailyAccess: "true",
          replaceGym: confirmationModal.gymId,
        },
      } as any);
      console.log("Navigation successful");
    } catch (error) {
      console.error("Replace gym error:", error);
      setAlertConfig({
        visible: true,
        title: "Fel",
        message: "Kunde inte schemalägga ersättning. Försök igen.",
        type: "destructive",
        buttons: [{ text: "OK" }]
      });
    }
  };

  const handlePendingGymOptionsPress = (gymId: string) => {
    const gym = enrichedPendingGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || "gymmet";

    setAlertConfig({
      visible: true,
      title: "Ta bort väntande gym",
      message: `Vill du ta bort ${gymName} från dina väntande val? Detta kommer att avbryta den planerade ändringen.`,
      type: "warning",
      buttons: [
        {
          text: "Avbryt",
          style: "cancel",
        },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: () => {
            if (onPendingGymOptions) {
              onPendingGymOptions(gymId);
            }
          },
        },
      ]
    });
  };

  // Show empty state if no gyms at all
  if (enrichedCurrentGyms.length === 0 && enrichedPendingGyms.length === 0) {
    return (
      <View className="bg-surface rounded-2xl p-6 mb-6 border border-white/5">
        <View className="items-center">
          <Users size={32} color="#6B7280" />
          <Text className="text-lg font-medium text-textPrimary mt-2">
            Inga Aktiva Gym
          </Text>
          <Text className="text-sm text-textSecondary text-center mt-1">
            Välj upp till 3 gym för att aktivera din Daily Access
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Current/Active Gyms */}
      {enrichedCurrentGyms.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-textPrimary">
              Aktiva Gym
            </Text>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary">
                {enrichedCurrentGyms.length}/3 valda
              </Text>
            </View>
          </View>
          {enrichedCurrentGyms.map((gym) => {
            const usage = getCreditsUsed(gym.gym_id);
            const pendingStatus = getPendingStatusInfo(gym);
            const hasPendingStatus =
              gym.status === "pending_removal" ||
              gym.status === "pending_replacement";

            return (
              <View
                key={gym.id}
                className={`bg-surface rounded-2xl p-5 mb-3 border border-white/5 ${
                  pendingStatus?.cardOverlay || ""
                }`}
              >
                {/* Main Content */}
                <View className="flex-row items-start">
                  <TouchableOpacity
                    onPress={() => handleGymPress(gym.gym_id)}
                    activeOpacity={0.7}
                    className="flex-1 flex-row items-center"
                  >
                    {gym.clubData?.image_url ? (
                      <OptimizedImage
                        source={{ uri: gym.clubData.image_url }}
                        style={{ width: 48, height: 48 }}
                        className="rounded-lg mr-4"
                      />
                    ) : (
                      <View className="w-12 h-12 bg-primary/10 rounded-lg mr-4 items-center justify-center">
                        <MapPin size={24} color="#6366F1" />
                      </View>
                    )}
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-semibold text-textPrimary text-base">
                          {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                        </Text>
                        {pendingStatus && (
                          <View
                            className={`flex-row items-center gap-2 px-2 py-1 rounded-full border ${pendingStatus.badgeColor}`}
                          >
                            <Text
                              className={`text-xs font-medium ml-1 ${pendingStatus.textColor}`}
                              >
                              {pendingStatus.badgeText}
                            </Text>
                              {pendingStatus.icon}
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center mb-2">
                        <MapPin size={14} color="#6B7280" />
                        <Text className="text-sm text-textSecondary ml-1">
                          {gym.clubData?.city ||
                            gym.gym_address ||
                            "Okänd plats"}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="bg-primary/10 px-3 py-1 rounded-full mr-2">
                          <Text className="text-xs font-medium text-primary">
                            {creditPerGym} krediter
                          </Text>
                        </View>
                        <View className="bg-white/10 px-3 py-1 rounded-full">
                          <Text className="text-xs text-textSecondary">
                            {usage}/{creditPerGym} använda
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action Buttons - Icons Only */}
                  {!hasPendingStatus && (
                    <View className="flex-row items-center ml-2">
                      <TouchableOpacity
                        onPress={() => handleEditGym(gym.gym_id)}
                        className="bg-primary/10 p-2 rounded-lg mr-2"
                        activeOpacity={0.7}
                      >
                        <Edit3 size={18} color="#6366F1" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveGym(gym.gym_id)}
                        className="bg-red-500/10 p-2 rounded-lg"
                        activeOpacity={0.7}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pending Gyms */}
      {enrichedPendingGyms.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-textPrimary mb-3">
            Väntande Ändringar
          </Text>

          {enrichedPendingGyms.map((gym) => (
            <TouchableOpacity
              key={gym.id}
              onPress={() => handlePendingGymOptionsPress(gym.gym_id)}
              className="bg-surface rounded-2xl p-5 mb-3 border border-accentOrange/20"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                {gym.clubData?.image_url ? (
                  <OptimizedImage
                    source={{ uri: gym.clubData.image_url }}
                    style={{ width: 48, height: 48 }}
                    className="rounded-lg mr-4"
                  />
                ) : (
                  <View className="w-12 h-12 bg-accentOrange/10 rounded-lg mr-4 items-center justify-center">
                    <MapPin size={24} color="#F59E0B" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-textPrimary text-base">
                    {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="text-sm text-textSecondary ml-1">
                      {gym.clubData?.city || gym.gym_address || "Okänd plats"}
                    </Text>
                  </View>
                </View>
                <View className="bg-accentOrange/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-accentOrange">
                    Väntar
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <GymChangeConfirmationModal
          visible={confirmationModal.visible}
          onClose={() => setConfirmationModal(null)}
          onConfirm={
            confirmationModal.type === "remove"
              ? handleConfirmRemove
              : handleConfirmReplace
          }
          changeType={confirmationModal.type}
          gymName={confirmationModal.gymName}
          creditsUsed={confirmationModal.creditsUsed}
          totalCredits={creditPerGym}
          hasUsedCredits={confirmationModal.creditsUsed > 0}
        />
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}
