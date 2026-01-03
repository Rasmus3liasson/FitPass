import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useRouter } from "expo-router";
import {
  Activity,
  Calendar,
  CreditCard,
  Crown,
  Gift,
  History,
  PauseCircle,
  RefreshCw,
  Settings,
  Zap
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ROUTES } from "../../config/constants";
import { useAuth } from "../../hooks/useAuth";
import { useCancelMembership, usePauseMembership } from "../../hooks/useMembership";
import { useSubscription } from "../../hooks/useSubscription";
import { Membership } from "../../types";
import { getMembershipStatus } from "../../utils/membershipStatus";
import { PageHeader } from "../PageHeader";
import { SafeAreaWrapper } from "../SafeAreaWrapper";
import StatusBadge from "../ui/StatusBadge";

interface MembershipManagementModalProps {
  visible: boolean;
  onClose: () => void;
  membership: Membership | null;
}

export function MembershipManagementModal({
  visible,
  onClose,
  membership,
}: MembershipManagementModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const cancelMembership = useCancelMembership();
  const pauseMembership = usePauseMembership();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusPress = () => {
    if (!membership) return;

    const status = getMembershipStatus(membership);
    let message = "";
    let title = "Medlemskapsstatus";

    if (subscription?.cancel_at_period_end) {
      message = `Ditt medlemskap kommer att avslutas ${formatDate(subscription.current_period_end)}. Du kan fortsätta använda dina krediter fram till dess.`;
      title = "Medlemskap uppsagt";
    } else if (subscription?.pause_collection) {
      const resumeDate = subscription.pause_collection.resumes_at 
        ? formatDate(subscription.pause_collection.resumes_at) 
        : "ett senare datum";
      message = `Ditt medlemskap är pausat och återupptas ${resumeDate}. Ingen fakturering sker under pausen.`;
      title = "Medlemskap pausat";
    } else if (status === "active") {
      message = `Ditt medlemskap är aktivt och förnyas automatiskt ${formatDate(subscription?.current_period_end) || 'varje månad'}.`;
      title = "Aktivt medlemskap";
    } else {
      message = `Status: ${status}`;
    }

    Alert.alert(title, message, [{ text: "OK" }]);
  };

  const handleAction = async (action: string, route?: string) => {
    if (route) {
      onClose();
      router.push(route as any);
      return;
    }

    if (!user?.id) {
      Alert.alert("Fel", "Användare hittades inte");
      return;
    }

    setActionLoading(action);

    try {
      if (action === "cancel-membership") {
        await cancelMembership.mutateAsync({
          userId: user.id,
          reason: "User requested cancellation from mobile app",
        });

        Alert.alert(
          "Medlemskap uppsagt",
          "Ditt medlemskap kommer att avslutas vid slutet av din nuvarande faktureringsperiod. Du kan fortsätta använda dina krediter till dess.",
          [{ text: "OK", onPress: onClose }]
        );
      } else if (action === "pause-membership") {
        await pauseMembership.mutateAsync({
          userId: user.id,
          reason: "User requested pause from mobile app",
        });

        Alert.alert(
          "Medlemskap pausat",
          "Ditt medlemskap är nu pausat. Du kommer inte att faktureras under pausperioden.",
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (error: any) {
      console.error("Action error:", error);
      Alert.alert(
        "Fel",
        error.message || "Något gick fel. Försök igen senare.",
        [{ text: "OK" }]
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP", { locale: sv });
  };

  if (!membership) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaWrapper>
          <PageHeader
            title="Välj medlemskap"
            subtitle="Börja din träningsresa idag"
            showBackButton={true}
            onBackPress={onClose}
          />
          <ScrollView className="flex-1 bg-background">
            {/* No membership content - redirect to plans */}
            <View className="flex-1 items-center justify-center p-6">
              <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
                <Crown size={48} color="#6366F1" />
              </View>
              <Text className="text-textPrimary text-2xl font-bold mb-4 text-center">
                Välj ditt medlemskap
              </Text>
              <Text className="text-textSecondary text-center mb-8 leading-relaxed">
                Upptäck våra flexibla medlemskapsplaner och börja träna på
                Stockholms bästa anläggningar redan idag.
              </Text>
              <TouchableOpacity
                className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl py-4 px-8 w-full max-w-sm"
                onPress={() =>
                  handleAction("choose-plan", ROUTES.PROFILE_MEMBERSHIP_DETAILS)
                }
              >
                <View className="flex-row items-center justify-center">
                  <Calendar size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Se alla planer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaWrapper>
      </Modal>
    );
  }

  const creditsRemaining = membership.credits - (membership.credits_used || 0);
  const usagePercentage = Math.round(
    ((membership.credits_used || 0) / membership.credits) * 100
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaWrapper>
        <PageHeader
          title="Hantera medlemskap"
          subtitle="Din aktuella plan och inställningar"
          showBackButton={true}
          onBackPress={onClose}
        />

        <View className="flex-1 bg-background p-4">
          {/* Current Plan Card */}
          <View className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl p-6 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white/80 text-sm font-semibold uppercase tracking-wide">
                  AKTIV PLAN
                </Text>
                <Text className="text-white text-2xl font-black">
                  {membership.plan_type || "Premium"}
                </Text>
              </View>
              <View className="bg-white/20 rounded-full px-3 py-1.5">
                <StatusBadge 
                  status={getMembershipStatus(membership)} 
                  onPress={handleStatusPress}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/15 rounded-xl p-3">
                <View className="flex-row items-center mb-1">
                  <Zap size={16} color="#ffffff" />
                  <Text className="text-white/70 text-xs font-semibold ml-1 uppercase">
                    Krediter
                  </Text>
                </View>
                <Text className="text-white text-xl font-black">
                  {creditsRemaining}
                </Text>
                <Text className="text-white/60 text-xs">
                  kvar av {membership.credits}
                </Text>
              </View>

              <View className="flex-1 bg-white/15 rounded-xl p-3">
                <View className="flex-row items-center mb-1">
                  <Activity size={16} color="#ffffff" />
                  <Text className="text-white/70 text-xs font-semibold ml-1 uppercase">
                    Använt
                  </Text>
                </View>
                <Text className="text-white text-xl font-black">
                  {membership.credits_used || 0}
                </Text>
                <Text className="text-white/60 text-xs">
                  pass denna månad
                </Text>
              </View>
            </View>
          </View>

          {/* Action Grid */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl p-4 min-w-[45%]"
              onPress={() => handleAction("change-plan", ROUTES.PROFILE_MEMBERSHIP_DETAILS)}
              disabled={actionLoading === "change-plan"}
            >
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-3">
                <RefreshCw size={24} color="#6366F1" />
              </View>
              <Text className="text-textPrimary font-bold text-base mb-1">
                Ändra plan
              </Text>
              <Text className="text-textSecondary text-xs">
                Uppgradera eller ändra
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl p-4 min-w-[45%]"
              onPress={() => handleAction("payment-methods", "/profile/billing")}
              disabled={actionLoading === "payment-methods"}
            >
              <View className="w-12 h-12 bg-green-600/10 rounded-full items-center justify-center mb-3">
                <CreditCard size={24} color="#059669" />
              </View>
              <Text className="text-textPrimary font-bold text-base mb-1">
                Betalning
              </Text>
              <Text className="text-textSecondary text-xs">
                Hantera kort
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl p-4 min-w-[45%]"
              onPress={() => handleAction("add-credits")}
              disabled={actionLoading === "add-credits"}
            >
              <View className="w-12 h-12 bg-red-600/10 rounded-full items-center justify-center mb-3">
                <Gift size={24} color="#DC2626" />
              </View>
              <Text className="text-textPrimary font-bold text-base mb-1">
                Extra krediter
              </Text>
              <Text className="text-textSecondary text-xs">
                Köp fler krediter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl p-4 min-w-[45%]"
              onPress={() => handleAction("usage-history")}
              disabled={actionLoading === "usage-history"}
            >
              <View className="w-12 h-12 bg-purple-600/10 rounded-full items-center justify-center mb-3">
                <History size={24} color="#7C3AED" />
              </View>
              <Text className="text-textPrimary font-bold text-base mb-1">
                Historik
              </Text>
              <Text className="text-textSecondary text-xs">
                Se dina pass
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subscription Info */}
          {subscription && (
            <View className="bg-surface rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-textSecondary text-sm">Status</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    subscription.status === "active"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      subscription.status === "active"
                        ? "text-green-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {subscription.status === "active" ? "AKTIV" : subscription.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {subscription.current_period_end && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-textSecondary text-sm">
                    Nästa fakturering
                  </Text>
                  <Text className="text-textPrimary font-semibold text-sm">
                    {formatDate(subscription.current_period_end)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Account Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-surface border border-amber-500/20 rounded-2xl p-4"
              onPress={() => {
                Alert.alert(
                  "Pausa medlemskap",
                  "Är du säker på att du vill pausa ditt medlemskap?",
                  [
                    { text: "Avbryt", style: "cancel" },
                    {
                      text: "Fortsätt",
                      onPress: () => handleAction("pause-membership"),
                    },
                  ]
                );
              }}
              disabled={actionLoading === "pause-membership"}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-amber-500/10 rounded-full items-center justify-center mb-2">
                  <PauseCircle size={24} color="#F59E0B" />
                </View>
                <Text className="text-textPrimary font-bold text-sm">
                  Pausa
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-surface border border-red-500/20 rounded-2xl p-4"
              onPress={() => {
                Alert.alert(
                  "Avsluta medlemskap",
                  "Är du säker på att du vill avsluta ditt medlemskap?",
                  [
                    { text: "Avbryt", style: "cancel" },
                    {
                      text: "Fortsätt",
                      style: "destructive",
                      onPress: () => handleAction("cancel-membership"),
                    },
                  ]
                );
              }}
              disabled={actionLoading === "cancel-membership"}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-red-500/10 rounded-full items-center justify-center mb-2">
                  <Settings size={24} color="#DC2626" />
                </View>
                <Text className="text-textPrimary font-bold text-sm">
                  Avsluta
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    </Modal>
  );
}
