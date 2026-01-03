import { Membership, MembershipPlan } from "../../types";
import { formatNextBillingDate } from "../../utils/time";
import { Check, Clock, CreditCard, Star, X, Zap } from "lucide-react-native";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../../constants/custom-colors";

interface PlanSelectionModalProps {
  visible: boolean;
  selectedPlan: MembershipPlan | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  hasExistingMembership?: boolean;
  currentMembership?: Membership | null;
  scheduledChangeData?: {
    hasScheduledChange: boolean;
    scheduledChange?: {
      planId: string;
      planTitle: string;
      nextBillingDateFormatted: string;
    } | null;
  } | null;
}

export function PlanSelectionModal({
  visible,
  selectedPlan,
  onClose,
  onConfirm,
  isLoading = false,
  hasExistingMembership = false,
  currentMembership = null,
  scheduledChangeData = null,
}: PlanSelectionModalProps) {
  if (!selectedPlan) return null;

  // Environment detection
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === "production";

  // Check if user has an active subscription that would be scheduled for change
  const hasActiveSubscription = currentMembership?.stripe_subscription_id;
  const willBeScheduled = isProduction && hasActiveSubscription;

  // Check if there's an existing scheduled change
  const hasExistingScheduledChange =
    scheduledChangeData?.hasScheduledChange &&
    scheduledChangeData?.scheduledChange;
  const isChangingExistingSchedule =
    hasExistingScheduledChange &&
    selectedPlan?.id === scheduledChangeData?.scheduledChange?.planId;

  // Get next billing date for scheduling information
  const nextBillingDate = currentMembership?.next_cycle_date
    ? formatNextBillingDate(currentMembership.next_cycle_date)
    : scheduledChangeData?.scheduledChange?.nextBillingDateFormatted || null;

  const getPlanIcon = (planTitle: string) => {
    if (
      planTitle.toLowerCase().includes("premium") ||
      planTitle.toLowerCase().includes("pro")
    ) {
      return <Star size={32} color="#FFD700" fill="#FFD700" />;
    }
    return <Zap size={32} color={colors.primary} />;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: "90%",
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="bg-background rounded-3xl overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-6 relative">
              <TouchableOpacity
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full items-center justify-center"
                onPress={onClose}
              >
                <X size={20} color="white" />
              </TouchableOpacity>

              <View className="items-center mt-2">
                {/*  <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  {getPlanIcon(selectedPlan.title)}
                </View> */}
                <Text className="text-white text-2xl font-black mb-2">
                  {selectedPlan.title}
                </Text>
                <Text className="text-white/80 text-center mb-4">
                  {selectedPlan.description}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Plan Details */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide mb-1">
                      Månadskostnad
                    </Text>
                    <Text className="text-textPrimary text-3xl font-black">
                      {selectedPlan.price > 0
                        ? `${selectedPlan.price} kr`
                        : "Gratis"}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide mb-1">
                      Krediter
                    </Text>
                    <View className="flex-row items-center">
                      <Zap size={20} color={colors.primary} />
                      <Text className="text-textPrimary text-3xl font-black ml-2">
                        {selectedPlan.credits}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Features */}
                <View className="bg-surface rounded-2xl p-4">
                  <Text className="text-textPrimary font-bold mb-3">
                    Vad ingår:
                  </Text>
                  {selectedPlan.features?.map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Check size={16} color={colors.accentGreen} />
                      <Text className="text-textSecondary text-sm ml-3 flex-1">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Information for existing membership */}
              {hasExistingMembership && (
                <View
                  className={`${
                    willBeScheduled && "bg-primary/20 border-primary/30"
                  } border rounded-2xl p-4 mb-6`}
                >
                  <View className="flex-row items-start">
                    <View className="ml-3 flex-1">
                      <Text className={"text-textPrimary font-semibold mb-1"}>
                        {hasExistingScheduledChange
                          ? isChangingExistingSchedule
                            ? "Uppdatera schemalagd ändring"
                            : "Ersätt schemalagd ändring"
                          : willBeScheduled
                          ? "Schemalagd ändring"
                          : "Ändra medlemskap"}
                      </Text>
                      <Text className={"text-textPrimary text-sm mb-2"}>
                        {hasExistingScheduledChange
                          ? isChangingExistingSchedule
                            ? `Du har redan schemalagt denna plan. Ändringen aktiveras ${
                                nextBillingDate
                                  ? `den ${nextBillingDate}`
                                  : "vid nästa faktureringsperiod"
                              }.`
                            : `Du har redan en schemalagd ändring till "${scheduledChangeData?.scheduledChange?.planTitle}". Den kommer att ersättas med denna plan.`
                          : willBeScheduled
                          ? `Din plan ändras automatiskt vid nästa faktureringsperiod${
                              nextBillingDate ? ` den ${nextBillingDate}` : ""
                            }.`
                          : "Din nuvarande plan kommer att uppdateras. Nya villkor träder i kraft omedelbart."}
                      </Text>
                      {willBeScheduled && nextBillingDate && (
                        <View className="flex-row items-center mt-2">
                          <Clock size={16} color={colors.textPrimary} />
                          <Text className="text-textPrimary text-xs font-medium ml-2">
                            Aktiveras: {nextBillingDate}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {!isChangingExistingSchedule && (
                <View className="space-y-3">
                  <TouchableOpacity
                    className="bg-primary rounded-2xl py-4 px-6"
                    onPress={onConfirm}
                    disabled={isLoading}
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <CreditCard size={20} color="white" />
                          <Text className="text-white font-bold text-base ml-2">
                            {hasExistingMembership
                              ? hasExistingScheduledChange
                                ? "Ersätt ändring"
                                : willBeScheduled
                                ? "Schemalägg ändring"
                                : "Uppdatera plan"
                              : "Välj denna plan"}
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
