import colors from "@shared/constants/custom-colors";
import { useRouter } from "expo-router";
import {
  Clock,
  ClockIcon,
  MapPin,
  PencilSimpleIcon,
  Trash,
  Users,
} from "phosphor-react-native";
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
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "default",
    buttons: [],
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
        badgeColor: "bg-accentRed/10 border-accentRed/20",
        textColor: "text-textPrimary",
        icon: <Clock size={12} color={colors.accentRed} />,
        cardOverlay: "bg-accentRed/5",
      };
    }
    if (gym.status === "pending_replacement") {
      return {
        badgeText: "Ersätts nästa period",
        badgeColor: "bg-accentOrange/10 border-accentOrange/20",
        textColor: "text-textPrimary",
        icon: <Clock size={12} color={colors.accentOrange} />,
        cardOverlay: "bg-accentOrange/5",
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
        buttons: [{ text: "OK" }],
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Fel",
        message: "Kunde inte schemalägga borttagning. Försök igen.",
        type: "destructive",
        buttons: [{ text: "OK" }],
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
        buttons: [{ text: "OK" }],
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
      ],
    });
  };

  // Show empty state if no gyms at all
  if (enrichedCurrentGyms.length === 0 && enrichedPendingGyms.length === 0) {
    return (
      <View className="bg-surface rounded-2xl p-6 mb-6 border border-white/5">
        <View className="items-center">
          <Users size={32} color={colors.borderGray} />
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
                className="bg-surface/10 rounded-3xl p-6 mb-4 border border-white/5"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Pending Status Badge (if applicable) */}
                {pendingStatus && (
                  <View
                    className={`flex-row items-center justify-between gap-2 px-3 py-2 rounded-2xl mb-4 ${pendingStatus.badgeColor}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${pendingStatus.textColor}`}
                      >
                      {pendingStatus.badgeText}
                    </Text>
                      {pendingStatus.icon}
                  </View>
                )}

                {/* Main Content */}
                <TouchableOpacity
                  onPress={() => handleGymPress(gym.gym_id)}
                  activeOpacity={0.7}
                  className="flex-row items-start"
                >
                  {gym.clubData?.image_url ? (
                    <OptimizedImage
                      source={{ uri: gym.clubData.image_url }}
                      style={{ width: 60, height: 60 }}
                      className="rounded-2xl"
                    />
                  ) : (
                    <View className="w-15 h-15 bg-primary/10 rounded-2xl items-center justify-center">
                      <MapPin size={28} color={colors.primary} />
                    </View>
                  )}

                  <View className="flex-1 ml-4">
                    <Text className="font-bold text-textPrimary text-lg mb-1">
                      {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                    </Text>
                    <View className="flex-row items-center mb-3">
                      <MapPin
                        size={16}
                        color={colors.textSecondary}
                        weight="duotone"
                      />
                      <Text className="text-sm text-textSecondary ml-1">
                        {gym.clubData?.city || gym.gym_address || "Okänd plats"}
                      </Text>
                    </View>

                    {/* Credit Usage */}
                    <View className="space-y-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-textSecondary font-medium">
                          Krediter
                        </Text>
                        <Text className="text-xs text-textPrimary font-bold">
                          {usage}/{creditPerGym}
                        </Text>
                      </View>
                      {/* Progress Bar */}
                      <View className="h-2 bg-surface/50 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(usage / creditPerGym) * 100}%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons - Full Width */}
                {!hasPendingStatus && (
                  <View className="flex-row items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <TouchableOpacity
                      onPress={() => handleEditGym(gym.gym_id)}
                      className="flex-1 bg-primary/10 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                      activeOpacity={0.7}
                    >
                      <PencilSimpleIcon
                        size={18}
                        color={colors.primary}
                        weight="bold"
                      />
                      <Text className="text-primary font-semibold text-sm">
                        Ersätt
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRemoveGym(gym.gym_id)}
                      className="flex-1 bg-red-500/10 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                      activeOpacity={0.7}
                    >
                      <Trash size={18} color={colors.accentRed} weight="bold" />
                      <Text className="text-accentRed font-semibold text-sm">
                        Ta bort
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Pending Gyms */}
      {enrichedPendingGyms.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between gap-2 mb-4">
            <View className="flex-row gap-2 items-center">
              <Text className="text-lg font-bold text-textPrimary">
                Väntande Ändringar
              </Text>
              <View className="bg-primary/10 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-bold text-primary">
                  {enrichedPendingGyms.length}
                </Text>
              </View>
            </View>
            <View>
              <ClockIcon size={20} color={colors.primary} weight="duotone" />
            </View>
          </View>
          {enrichedPendingGyms.map((gym) => (
            <TouchableOpacity
              key={gym.id}
              onPress={() => handlePendingGymOptionsPress(gym.gym_id)}
              className="bg-primary/5 rounded-3xl p-5 mb-3 border border-primary/20"
              activeOpacity={0.7}
              style={{
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center">
                {gym.clubData?.image_url ? (
                  <OptimizedImage
                    source={{ uri: gym.clubData.image_url }}
                    style={{ width: 56, height: 56 }}
                    className="rounded-2xl"
                  />
                ) : (
                  <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                    <MapPin size={26} color={colors.primary} weight="duotone" />
                  </View>
                )}
                <View className="flex-1 ml-4">
                  <Text className="font-bold text-textPrimary text-base mb-1">
                    {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                  </Text>
                  <View className="flex-row items-center">
                    <MapPin
                      size={14}
                      color={colors.textSecondary}
                      weight="duotone"
                    />
                    <Text className="text-sm text-textSecondary ml-1">
                      {gym.clubData?.city || gym.gym_address || "Okänd plats"}
                    </Text>
                  </View>
                </View>
                <View className="bg-primary px-3 py-2 rounded-xl">
                  <Text className="text-xs font-bold text-white">
                    Nästa period
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
