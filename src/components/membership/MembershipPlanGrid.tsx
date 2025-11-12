import { Membership, MembershipPlan } from "@/types";
import { Check, Star, Zap } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface MembershipPlanGridProps {
  plans: MembershipPlan[];
  currentMembership?: Membership | null;
  onPlanSelect: (plan: MembershipPlan) => void;
  onPlanView?: (plan: MembershipPlan) => void;
  hasPaymentMethods?: boolean;
  isLoading?: boolean;
}

export function MembershipPlanGrid({
  plans,
  currentMembership,
  onPlanSelect,
  onPlanView,
  hasPaymentMethods = true,
  isLoading,
}: MembershipPlanGridProps) {
  const isCurrentPlan = (planId: string) => {
    return currentMembership?.plan_id === planId;
  };

  // Determine if a plan has Daily Access based on price (top-tier pricing)
  const hasDailyAccess = (plan: MembershipPlan) => {
    if (!plans || plans.length === 0) return false;

    const maxPrice = Math.max(...plans.map((p) => p.price));
    const threshold = maxPrice * 0.8; // Top 80% price range gets Daily Access

    return plan.price >= threshold && plan.price > 0; // Exclude free plans
  };

  const getPlanIcon = (planTitle: string) => {
    if (
      planTitle.toLowerCase().includes("premium") ||
      planTitle.toLowerCase().includes("pro")
    ) {
      return <Star size={24} color="#FFD700" fill="#FFD700" />;
    }
    return <Zap size={24} color="#6366F1" />;
  };

 

  if (isLoading) {
    return (
      <View className="mt-6">
        <Text className="text-textPrimary text-xl font-bold mb-4">
          Tillgängliga planer
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {[1, 2, 3, 4].map((index) => (
            <View
              key={index}
              className="bg-surface rounded-3xl p-6 mb-4 animate-pulse"
              style={{ width: "48%" }}
            >
              <View className="bg-accentGray/20 h-6 rounded mb-4" />
              <View className="bg-accentGray/20 h-4 rounded mb-2" />
              <View className="bg-accentGray/20 h-8 rounded" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="mt-6">
      <Text className="text-textPrimary text-xl font-bold mb-4">
        Tillgängliga planer
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {plans?.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          

          return (
            <TouchableOpacity
              key={plan.id}
              className="rounded-3xl p-4 mb-4 relative overflow-hidden border-2 border-accentGray"
              onPress={() => onPlanView ? onPlanView(plan) : onPlanSelect(plan)}
              activeOpacity={0.8}
              style={{
                width: "47%",
                shadowColor: isCurrent ? "#6366F1" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isCurrent ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: isCurrent ? 8 : 4,
              }}
            >
              {/* Card Content Container */}
              <View className="flex-1 justify-between">
                {/* Top Content */}
                <View>
                  {/* Current Plan Badge */}
                  {isCurrent && (
                    <View className="absolute top-0 right-0 z-10">
                      <View className="bg-primary rounded-full px-2 py-1 flex-row items-center">
                        <Check size={12} color="#ffffff" />
                        <Text className="text-white text-xs font-bold ml-1">
                          AKTIV
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Plan Info */}
                  <View className="mb-3">
                    <Text
                      className="text-textPrimary text-base font-bold mb-1"
                      numberOfLines={1}
                    >
                      {plan.title}
                    </Text>
                    <Text
                      className="text-textSecondary text-xs leading-tight"
                      numberOfLines={2}
                    >
                      {plan.description || "Perfekt för dina träningsmål"}
                    </Text>
                  </View>

                  {/* Stats Container */}
                  <View className="mb-3">
                    {/* Price and Credits Combined */}
                    <View className="bg-black/5 rounded-xl mb-2">
                      <View className="flex-row items-end justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-textSecondary text-xs font-medium">
                            Pris
                          </Text>
                          <Text
                            className="text-textPrimary text-lg font-black"
                            numberOfLines={1}
                          >
                            {plan.price > 0 ? `${plan.price} kr` : "Gratis"}
                          </Text>
                          <Text className="text-textSecondary text-xs">
                            per månad
                          </Text>
                        </View>
                        <View className="flex-1 items-end">
                          <Text className="text-textSecondary text-xs font-medium">
                            Krediter
                          </Text>
                          <View className="flex-row items-center">
                            <Zap size={12} color="#6366F1" />
                            <Text className="text-textPrimary text-lg font-black ml-1">
                              {plan.credits}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Features - Only show 1 most important */}
                    {plan.features && plan.features.length > 0 && (
                      <View className="flex-row items-center">
                        <View className="w-1 h-1 bg-primary rounded-full mr-2" />
                        <Text
                          className="text-textSecondary text-xs flex-1"
                          numberOfLines={1}
                        >
                          {plan.features[0]}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Button - Always at Bottom */}
                <TouchableOpacity
                  disabled={isCurrent || !hasPaymentMethods}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card click
                    if (hasPaymentMethods && !isCurrent) {
                      onPlanSelect(plan);
                    }
                  }}
                  activeOpacity={0.7}
                  className={`rounded-2xl py-3 px-4 mt-4 ${
                    isCurrent
                      ? "bg-primary/20 border border-primary/30"
                      : !hasPaymentMethods
                      ? "bg-gray-300"
                      : "bg-primary"
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-sm ${
                      isCurrent
                        ? "text-primary"
                        : !hasPaymentMethods
                        ? "text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {isCurrent
                      ? "Nuvarande plan"
                      : !hasPaymentMethods
                      ? "Lägg till kort först"
                      : "Välj denna plan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
