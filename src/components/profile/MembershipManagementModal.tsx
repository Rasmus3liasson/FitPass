import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useSubscription } from "@/src/hooks/useSubscription";
import { Membership } from "@/types";
import { getMembershipStatus } from "@/utils/membershipStatus";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useRouter } from "expo-router";
import {
  Activity,
  Calendar,
  ChevronRight,
  CreditCard,
  Crown,
  Gift,
  History,
  PauseCircle,
  RefreshCw,
  Settings,
  Zap,
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, route?: string) => {
    setActionLoading(action);

    try {
      if (route) {
        onClose();
        router.push(route as any);
      } else {
        // Handle other actions like pause, cancel, etc.
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      }
    } catch (error) {
      console.error("Action error:", error);
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

        <ScrollView
          className="flex-1 bg-background"
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Overview */}
          <View className="mx-4 mt-4">
            <View className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl p-6 mb-6">
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
                  <StatusBadge status={getMembershipStatus(membership)} />
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
          </View>

          {/* Quick Actions */}
          <View className="mx-4 mb-6">
            <Text className="text-textPrimary text-lg font-bold mb-4">
              Snabbåtgärder
            </Text>

            <View className="bg-surface rounded-2xl overflow-hidden">
              {[
                {
                  icon: RefreshCw,
                  title: "Ändra plan",
                  subtitle: "Uppgradera eller ändra ditt medlemskap",
                  action: "change-plan",
                  route: ROUTES.PROFILE_MEMBERSHIP_DETAILS,
                  color: "#6366F1",
                },
                {
                  icon: CreditCard,
                  title: "Betalningsmetoder",
                  subtitle: "Hantera dina kort och fakturering",
                  action: "payment-methods",
                  route: "/profile/payments",
                  color: "#059669",
                },
                {
                  icon: Gift,
                  title: "Lägg till krediter",
                  subtitle: "Köp extra krediter för denna månad",
                  action: "add-credits",
                  color: "#DC2626",
                },
                {
                  icon: History,
                  title: "Användningshistorik",
                  subtitle: "Se dina tidigare träningspass",
                  action: "usage-history",
                  color: "#7C3AED",
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={item.action}
                  className={`p-4 flex-row items-center ${
                    index < 3 ? "border-b border-border" : ""
                  }`}
                  onPress={() => handleAction(item.action, item.route)}
                  disabled={actionLoading === item.action}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={24} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textPrimary font-semibold text-base">
                      {item.title}
                    </Text>
                    <Text className="text-textSecondary text-sm mt-1">
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#A0A0A0" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subscription Details */}
          {subscription && (
            <View className="mx-4 mb-6">
              <Text className="text-textPrimary text-lg font-bold mb-4">
                Prenumerationsdetaljer
              </Text>

              <View className="bg-surface rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-textPrimary font-semibold">Status</Text>
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
                      {subscription.status === "active"
                        ? "AKTIV"
                        : subscription.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {subscription.current_period_end && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-textSecondary">
                      Nästa fakturering
                    </Text>
                    <Text className="text-textPrimary font-medium">
                      {formatDate(subscription.current_period_end)}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <Text className="text-textSecondary">Förnyelse</Text>
                  <Text className="text-textPrimary font-medium">
                    Automatisk
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Progress Insights */}
          <View className="mx-4 mb-6">
            <Text className="text-textPrimary text-lg font-bold mb-4">
              Månadsöversikt
            </Text>

            <View className="bg-surface rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-textSecondary">
                  Förbrukning denna månad
                </Text>
                <Text className="text-textPrimary font-bold">
                  {usagePercentage}%
                </Text>
              </View>

              <View className="bg-background rounded-full h-3 overflow-hidden mb-4">
                <View
                  className="bg-primary rounded-full h-full"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </View>

              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-textPrimary text-lg font-bold">
                    {membership.credits_used || 0}
                  </Text>
                  <Text className="text-textSecondary text-xs">Använda</Text>
                </View>
                <View className="items-center">
                  <Text className="text-primary text-lg font-bold">
                    {creditsRemaining}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    Återstående
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-textPrimary text-lg font-bold">
                    {membership.credits}
                  </Text>
                  <Text className="text-textSecondary text-xs">Totalt</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View className="mx-4 mb-8">
            <Text className="text-textPrimary text-lg font-bold mb-4">
              Kontoinställningar
            </Text>

            <View className="bg-surface rounded-2xl overflow-hidden">
              {[
                {
                  icon: PauseCircle,
                  title: "Pausa medlemskap",
                  subtitle: "Tillfälligt pausa ditt medlemskap",
                  action: "pause-membership",
                  color: "#F59E0B",
                },
                {
                  icon: Settings,
                  title: "Avsluta medlemskap",
                  subtitle: "Säg upp din prenumeration",
                  action: "cancel-membership",
                  color: "#DC2626",
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={item.action}
                  className={`p-4 flex-row items-center ${
                    index === 0 ? "border-b border-border" : ""
                  }`}
                  onPress={() => {
                    Alert.alert(
                      item.title,
                      `Är du säker på att du vill ${
                        item.action === "pause-membership" ? "pausa" : "avsluta"
                      } ditt medlemskap?`,
                      [
                        { text: "Avbryt", style: "cancel" },
                        {
                          text: "Fortsätt",
                          style:
                            item.action === "cancel-membership"
                              ? "destructive"
                              : "default",
                          onPress: () => handleAction(item.action),
                        },
                      ]
                    );
                  }}
                  disabled={actionLoading === item.action}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={24} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textPrimary font-semibold text-base">
                      {item.title}
                    </Text>
                    <Text className="text-textSecondary text-sm mt-1">
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#A0A0A0" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaWrapper>
    </Modal>
  );
}
