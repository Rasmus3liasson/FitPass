import { Membership } from "@/types";
import {
  Activity,
  Calendar,
  ChevronRight,
  CreditCard,
  Settings,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
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
      <TouchableOpacity
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl mt-4 mx-4 overflow-hidden"
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        <View className="p-6 relative">
          {/* Floating Badge */}
          <View className="absolute top-4 right-4 flex-row items-center space-x-2">
            <StatusBadge status="scheduled_change" />
            {onCancelScheduled && (
              <TouchableOpacity
                onPress={onCancelScheduled}
                className="w-8 h-8 bg-white/20 rounded-full items-center justify-center"
              >
                <Text className="text-white font-bold text-xs">×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Header */}
          <View className="mb-6">
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
                <Zap size={18} color="#ffffff" />
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
                <Calendar size={18} color="#ffffff" />
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
                <Calendar size={16} color="#ffffff" />
              </View>
              <Text className="text-white/80 text-sm font-medium">
                Schemalagd ändring
              </Text>
            </View>
            <ChevronRight size={20} color="#ffffff" opacity={0.7} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (membership) {
    return (
      <TouchableOpacity
        className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl mt-4 overflow-hidden border border-white/20"
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        <View className="p-6 relative">
          {/* Status Section */}
          <View className="absolute top-4 right-4 items-end">
            <StatusBadge status={actualStatus} />
            {dateInfo && (
              <View className="mt-2 backdrop-blur-sm rounded-xl px-3 py-2">
                <View className="w-full flex-row justify-end">
                  <View>
                    <Text className="text-white/60 text-[10px] font-semibold uppercase tracking-wide text-right">
                      {dateInfo.label}
                    </Text>
                    <Text className="text-white text-xs font-bold mt-0.5 text-right">
                      {dateInfo.date}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
              NUVARANDE PLAN
            </Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              {membership.plan_type || "Premium"}
            </Text>
            <Text className="text-white/70 text-sm font-medium">
              Obegränsad tillgång • Alla faciliteter
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row mb-6 gap-3">
            {/* Credits Card */}
            <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <View className="flex-row items-center justify-between mb-2">
                <Zap size={18} color="#ffffff" />
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  Krediter
                </Text>
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
                <Activity size={18} color="#ffffff" />
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  Använt
                </Text>
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
                  ((membership.credits_used || 0) / membership.credits) * 100
                )}
                %
              </Text>
            </View>
            <View className="bg-white/20 rounded-full h-2 overflow-hidden">
              <View
                className="bg-white rounded-full h-full"
                style={{
                  width: `${Math.min(
                    ((membership.credits_used || 0) / membership.credits) * 100,
                    100
                  )}%`,
                }}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                <Settings size={16} color="#ffffff" />
              </View>
              <Text className="text-white/80 text-sm font-medium">
                Hantera medlemskap
              </Text>
            </View>
            <ChevronRight size={20} color="#ffffff" opacity={0.7} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // No membership state
  return (
    <TouchableOpacity
      className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl mt-4 mx-4 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        shadowColor: "#6366F1",
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
            <CreditCard size={14} color="#ffffff" strokeWidth={1.5} />
            <Text className="text-white text-xs font-bold ml-1 tracking-wider">
              INAKTIV
            </Text>
          </View>
        </View>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
            MEDLEMSKAP
          </Text>
          <Text className="text-white text-3xl font-black tracking-tight">
            Inget aktivt
          </Text>
          <Text className="text-white/70 text-sm font-medium">
            Upptäck obegränsad träning • 500+ anläggningar
          </Text>
        </View>

        {/* Stats Placeholder */}
        <View className="flex-row mb-6 gap-3">
          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <TrendingUp size={18} color="#ffffff" strokeWidth={1.5} />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Potential
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">∞</Text>
            <Text className="text-white/60 text-xs">träningspass</Text>
          </View>

          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <Star size={18} color="#ffffff" strokeWidth={1.5} />
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
            <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
              <Calendar size={16} color="#ffffff" strokeWidth={1.5} />
            </View>
            <Text className="text-white/80 text-sm font-medium">
              Välj medlemskap
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#ffffff"
            opacity={0.7}
            strokeWidth={1.5}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
