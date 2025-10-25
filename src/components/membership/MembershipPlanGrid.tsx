import { Membership, MembershipPlan } from "@/types";
import { Check, Star, Zap } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MembershipPlanGridProps {
  plans: MembershipPlan[];
  currentMembership?: Membership | null;
  onPlanSelect: (plan: MembershipPlan) => void;
  isLoading?: boolean;
}

export function MembershipPlanGrid({
  plans,
  currentMembership,
  onPlanSelect,
  isLoading,
}: MembershipPlanGridProps) {
  const isCurrentPlan = (planId: string) => {
    return currentMembership?.plan_id === planId;
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

  const getPlanGradient = (planTitle: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan) {
      return "bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 border-2 border-primary";
    }
    if (
      planTitle.toLowerCase().includes("premium") ||
      planTitle.toLowerCase().includes("pro")
    ) {
      return "bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30";
    }
    return "bg-gradient-to-br from-surface via-background to-surface border border-border";
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
          const gradientClasses = getPlanGradient(plan.title, isCurrent);

          return (
            <TouchableOpacity
              disabled={isCurrent}
              key={plan.id}
              className={`${gradientClasses} rounded-3xl p-6 mb-4 relative overflow-hidden flex-1`}
              onPress={() => onPlanSelect(plan)}
              activeOpacity={0.8}
              style={{
                width: "48%",
                minHeight: 320, // Ensures consistent minimum height
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

                  {/* Plan Icon */}
                  <View className="mb-4 mt-2">
                    <View
                      className={`w-12 h-12 rounded-2xl ${
                        isCurrent ? "bg-primary/20" : "bg-accentGray/20"
                      } items-center justify-center`}
                    >
                      {getPlanIcon(plan.title)}
                    </View>
                  </View>

                  {/* Plan Info */}
                  <View className="mb-4">
                    <Text className="text-textPrimary text-lg font-bold mb-1">
                      {plan.title}
                    </Text>
                    <Text className="text-textSecondary text-sm mb-2 leading-relaxed">
                      {plan.description || "Perfekt för dina träningsmål"}
                    </Text>
                  </View>

                  {/* Stats Container */}
                  <View className="mb-4">
                    {/* Credits */}
                    <View className="mb-3">
                      <View className="flex-row items-center mb-1">
                        <Zap size={14} color="#6366F1" />
                        <Text className="text-textSecondary text-xs font-semibold ml-1 uppercase tracking-wide">
                          Krediter
                        </Text>
                      </View>
                      <Text className="text-textPrimary text-2xl font-black">
                        {plan.credits}
                      </Text>
                      <Text className="text-textSecondary text-xs">per månad</Text>
                    </View>

                    {/* Price */}
                    <View className="mb-3">
                      <View className="flex-row items-baseline">
                        <Text className="text-textPrimary text-2xl font-black">
                          {plan.price > 0 ? `${plan.price}` : "Gratis"}
                        </Text>
                        {plan.price > 0 && (
                          <Text className="text-textSecondary text-sm ml-1">
                            kr/mån
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <View>
                        {plan.features.slice(0, 2).map((feature, index) => (
                          <View key={index} className="flex-row items-center mb-1">
                            <View className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            <Text className="text-textSecondary text-xs">
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Button - Always at Bottom */}
                <View
                  className={`rounded-2xl py-3 px-4 mt-4 ${
                    isCurrent
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-primary"
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-sm ${
                      isCurrent ? "text-primary" : "text-white"
                    }`}
                  >
                    {isCurrent ? "Nuvarande plan" : "Välj denna plan"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
