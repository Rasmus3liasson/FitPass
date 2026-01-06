import colors from "@shared/constants/custom-colors";
import {
  Calendar,
  CaretRight,
  Coin,
  CoinIcon,
  CreditCard,
  PulseIcon,
  Star,
  TrendUpIcon,
  X,
} from "phosphor-react-native";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Membership } from "../../types";
import StatusBadge from "../ui/StatusBadge";

interface MembershipCardProps {
  membership: Membership | null;
  subscription?: {
    status?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    canceled_at?: string | null;
    next_billing_date?: string;
    pause_collection?: {
      behavior?: string;
      resumes_at?: string | null;
    } | null;
  } | null;
  onPress: () => void;
  isScheduled?: boolean;
  scheduledPlan?: {
    planTitle: string;
    planCredits: number;
    nextBillingDate?: string;
  };
  onCancelScheduled?: () => void;
}

export function MembershipCard({
  membership,
  subscription,
  onPress,
  isScheduled = false,
  scheduledPlan,
  onCancelScheduled,
}: MembershipCardProps) {
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{
    title: string;
    message: string;
    details: string[];
  }>({ title: "", message: "", details: [] });

  const handleStatusPress = () => {
    let message = "";
    let title = "Medlemskapsstatus";
    let details: string[] = [];

    if (subscription?.cancel_at_period_end) {
      message = `Ditt medlemskap kommer att avslutas ${
        formatDate(subscription.current_period_end) || "vid periodens slut"
      }. Du kan fortsätta använda dina krediter fram till dess.`;
      title = "Medlemskap uppsagt";
      details = [
        "Du har tillgång till planen tills perioden löper ut",
        "Inga fler betalningar kommer att dras",
        "Du kan återaktivera medlemskapet när som helst",
      ];
    } else if (subscription?.pause_collection) {
      const resumeDate = subscription.pause_collection.resumes_at
        ? formatDate(subscription.pause_collection.resumes_at)
        : "ett senare datum";
      message = `Ditt medlemskap är pausat och återupptas ${resumeDate}. Ingen fakturering sker under pausen.`;
      title = "Medlemskap pausat";
      details = [
        "Inga betalningar dras under pausen",
        "Begränsad tillgång till funktioner",
        "Återaktivera när du vill fortsätta",
      ];
    } else if (isScheduled && scheduledPlan) {
      message = `Din plan kommer att ändras till ${scheduledPlan.planTitle} (${scheduledPlan.planCredits} krediter/månad) vid nästa faktureringsperiod.`;
      title = "Planändring schemalagd";
      details = [
        "Du behåller din nuvarande plan tills perioden löper ut",
        "Ingen extra kostnad för att byta",
        "Du kan avbryta ändringen när som helst före aktiveringsdatumet",
      ];
    } else if (actualStatus === "active") {
      message = `Ditt medlemskap är aktivt och förnyas automatiskt ${
        formatDate(subscription?.current_period_end) || "varje månad"
      }.`;
      title = "Aktivt medlemskap";
      details = [
        "Du har full tillgång till alla funktioner",
        "Dina krediter förnyas automatiskt varje månad",
        "Betalningar dras automatiskt",
      ];
    } else if (actualStatus === "trialing") {
      message = `Du är i testperioden som går ut ${
        formatDate(subscription?.current_period_end) || "snart"
      }. Därefter börjar din ordinarie prenumeration.`;
      title = "Testperiod";
      details = [
        "Full tillgång till alla funktioner under testperioden",
        "Ingen betalning krävs under testperioden",
        "Efter testperioden börjar normal fakturering",
      ];
    } else {
      message = `Status: ${actualStatus}`;
      details = [];
    }

    setStatusInfo({ title, message, details });
    setStatusModalVisible(true);
  };

  // Helper function to format date (expects ISO string from backend)
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);

      // Validate date
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return null;
      }

      return date.toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return null;
    }
  };

  // Determine actual status based on subscription data
  const getActualStatus = () => {
    if (subscription?.pause_collection) {
      return "paused";
    }
    if (subscription?.cancel_at_period_end) {
      return "canceled";
    }
    if (subscription?.status) {
      return subscription.status;
    }
    if (membership?.is_active) {
      return "active";
    }
    return "inactive";
  };

  const actualStatus = getActualStatus();

  // Get date information based on status
  const getDateInfo = () => {
    // If paused, show resume date
    if (
      actualStatus === "paused" &&
      subscription?.pause_collection?.resumes_at
    ) {
      return {
        label: "Återupptas",
        date: formatDate(subscription.pause_collection.resumes_at),
        icon: Calendar,
      };
    }

    // If canceled, show valid until date
    if (actualStatus === "canceled" || subscription?.cancel_at_period_end) {
      return {
        label: "Giltig till",
        date: formatDate(subscription?.current_period_end),
        icon: Calendar,
      };
    }

    // Active - show next billing date
    if (actualStatus === "active" && subscription?.next_billing_date) {
      return {
        label: "Nästa faktura",
        date: formatDate(subscription.next_billing_date),
        icon: CreditCard,
      };
    }

    // Fallback to period end
    if (subscription?.current_period_end) {
      return {
        label: "Period slutar",
        date: formatDate(subscription.current_period_end),
        icon: Calendar,
      };
    }

    return null;
  };

  const dateInfo = getDateInfo();

  // If this is showing a scheduled change
  if (isScheduled && scheduledPlan) {
    return (
      <>
        {/* Status Info Modal */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center px-6"
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          >
            <TouchableOpacity
              className="bg-background rounded-3xl p-6 w-full max-w-md"
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-textPrimary text-xl font-bold flex-1">
                  {statusInfo.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setStatusModalVisible(false)}
                  className="w-8 h-8 bg-accentGray/20 rounded-full items-center justify-center"
                >
                  <X size={20} color={colors.borderGray} />
                </TouchableOpacity>
              </View>

              <Text className="text-textSecondary text-base mb-4">
                {statusInfo.message}
              </Text>

              {statusInfo.details.length > 0 && (
                <View className="space-y-2">
                  {statusInfo.details.map((detail, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <View className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3" />
                      <Text className="text-textSecondary text-sm flex-1">
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                className="bg-primary rounded-2xl py-3 px-6 mt-6"
              >
                <Text className="text-white text-center font-bold">Stäng</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <View className="mt-4 relative">
          <TouchableOpacity
            className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl mx-4 overflow-hidden"
            onPress={onPress}
            activeOpacity={0.9}
            style={{
              shadowColor: colors.accentBlue,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <View className="p-6">
              {/* Header */}
              <View className="mb-6 pr-20">
                <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
                  SCHEMALAGD PLAN
                </Text>
                <Text className="text-white text-3xl font-black tracking-tight">
                  {scheduledPlan.planTitle}
                </Text>
                <Text className="text-white/70 text-sm font-medium">
                  Aktiveras{" "}
                  {scheduledPlan.nextBillingDate || "nästa faktureringsperiod"}
                </Text>
              </View>

              {/* Stats Grid */}
              <View className="flex-row mb-6 gap-3">
                {/* Credits Card */}
                <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Coin size={18} color="white" />
                    <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Nya krediter
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-black">
                    {scheduledPlan.planCredits}
                  </Text>
                  <Text className="text-white/60 text-xs">från start</Text>
                </View>

                {/* Status Card */}
                <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Calendar size={18} color="white" />
                    <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Status
                    </Text>
                  </View>
                  <Text className="text-white text-lg font-black">Väntar</Text>
                  <Text className="text-white/60 text-xs">på aktivering</Text>
                </View>
              </View>

              {/* Action Hint */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                    <Calendar size={16} color="white" />
                  </View>
                  <Text className="text-white/80 text-sm font-medium">
                    Schemalagd ändring
                  </Text>
                </View>
                <CaretRight size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          {/* StatusBadge and Cancel Button Overlay */}
          <View
            className="absolute top-4 right-4 flex-row items-center gap-2"
            style={{ pointerEvents: "box-none" }}
          >
            <StatusBadge
              status="scheduled_change"
              onPress={handleStatusPress}
            />
            {onCancelScheduled && (
              <TouchableOpacity
                onPress={onCancelScheduled}
                className="w-8 h-8 bg-white/20 rounded-full items-center justify-center"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text className="text-white font-bold text-xs">×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </>
    );
  }

  if (membership) {
    return (
      <>
        {/* Status Info Modal */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center px-6"
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          >
            <TouchableOpacity
              className="bg-background rounded-3xl p-6 w-full max-w-md"
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-textPrimary text-xl font-bold flex-1">
                  {statusInfo.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setStatusModalVisible(false)}
                  className="w-8 h-8 bg-accentGray/20 rounded-full items-center justify-center"
                >
                  <X size={20} color={colors.borderGray} />
                </TouchableOpacity>
              </View>

              <Text className="text-textSecondary text-base mb-4">
                {statusInfo.message}
              </Text>

              {statusInfo.details.length > 0 && (
                <View className="space-y-2">
                  {statusInfo.details.map((detail, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <View className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3" />
                      <Text className="text-textSecondary text-sm flex-1">
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                className="bg-primary rounded-2xl py-3 px-6 mt-6"
              >
                <Text className="text-textPrimary text-center font-bold">
                  Stäng
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <View className="mt-4 relative">
          <TouchableOpacity
            className="rounded-3xl overflow-hidden border border-white/20"
            onPress={onPress}
            activeOpacity={0.9}
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <View className="p-6">
              {/* Header */}
              <View className="mb-6 pr-20">
                <Text className="text-textPrimary text-sm font-semibold tracking-widest uppercase mb-1">
                  NUVARANDE PLAN
                </Text>
                <Text className="text-textPrimary text-3xl font-black tracking-tight">
                  {membership.plan_type || "Premium"}
                </Text>
                <Text className="text-textSecondary text-sm font-medium">
                  Obegränsad tillgång • Alla faciliteter
                </Text>
              </View>

              {/* Stats Grid */}
              <View className="flex-row mb-6 gap-3">
                {/* Credits Card */}
                <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Krediter
                    </Text>
                    <CoinIcon size={18} color="white" />
                  </View>
                  <Text className="text-white text-2xl font-black">
                    {membership.credits - (membership.credits_used || 0)}
                  </Text>
                  <Text className="text-white/60 text-xs">
                    av {membership.credits} totalt
                  </Text>
                </View>

                {/* Usage Card */}
                <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Använt
                    </Text>
                    <PulseIcon size={18} color="white" />
                  </View>
                  <Text className="text-white text-2xl font-black">
                    {membership.credits_used || 0}
                  </Text>
                  <Text className="text-white/60 text-xs">träningspass</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white/70 text-xs font-semibold tracking-wide">
                    MÅNADSFÖRBRUKNING
                  </Text>
                  <Text className="text-white text-xs font-bold">
                    {Math.round(
                      ((membership.credits_used || 0) / membership.credits) *
                        100
                    )}
                    %
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <View
                    className="bg-white rounded-full h-full"
                    style={{
                      width: `${Math.min(
                        ((membership.credits_used || 0) / membership.credits) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {/* <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                    <Gear size={16} color="white" />
                  </View> */}
                  <Text className="text-white/80 text-sm font-medium">
                    Hantera ditt medlemskap
                  </Text>
                </View>
                <CaretRight size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          {/* StatusBadge Overlay - Outside TouchableOpacity */}
          <View
            className="absolute top-4 right-4 flex-col items-end"
            style={{ pointerEvents: "box-none" }}
          >
            <StatusBadge status={actualStatus} onPress={handleStatusPress} />
            {subscription?.current_period_end && (
              <Text className="text-white/70 text-xs mt-1">
                {actualStatus === "canceled"
                  ? `Slutar ${formatDate(subscription.current_period_end)}`
                  : `Förnyas ${formatDate(subscription.current_period_end)}`}
              </Text>
            )}
          </View>
        </View>
      </>
    );
  }

  // No membership state
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl mt-4 mx-4 overflow-hidden border border-accentGray"
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
      }}
    >
      <View className="p-6 relative">
        {/* Status Badge */}
        <View className="absolute top-4 right-4">
          <View className="bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 flex-row items-center">
            <Text className="text-white text-xs font-bold tracking-wider">
              INAKTIV
            </Text>
          </View>
        </View>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-textPrimary text-sm font-semibold tracking-widest uppercase mb-1">
            MEDLEMSKAP
          </Text>
          <Text className="text-textPrimary text-3xl font-black tracking-tight">
            Inget aktivt
          </Text>
          <Text className="text-textSecondary text-sm font-medium">
            Upptäck obegränsad träning • 500+ anläggningar
          </Text>
        </View>

        {/* Stats Placeholder */}
        <View className="flex-row mb-6 gap-3">
          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <TrendUpIcon size={18} color="white" />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Potential
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">∞</Text>
            <Text className="text-white/60 text-xs">träningspass</Text>
          </View>

          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <Star size={18} color="white" />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Nivå
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">Pro</Text>
            <Text className="text-white/60 text-xs">väntar på dig</Text>
          </View>
        </View>

        {/* Action */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-white/80 text-sm font-medium">
              Välj medlemskap
            </Text>
          </View>
          <CaretRight size={20} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
