import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { useMembership } from "@/src/hooks/useMembership";
import { useMembershipPlans } from "@/src/hooks/useMembershipPlans";
import { StatusBar } from "expo-status-bar";
import { Check, CreditCard, Info } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MembershipDetails() {
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership } = useMembership();

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 bg-background px-4 py-6">
          <BackButton />
          <Text className="text-white mt-4">Loading plans...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="py-4">
          <BackButton />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">
            Membership Plans
          </Text>
          <Text className="text-textSecondary text-base">
            Choose a plan that best fits your fitness goals
          </Text>
        </View>

        {/* Current Plan Info */}
        {membership && (
          <View className="mt-6 bg-surface rounded-2xl p-4">
            <View className="flex-row items-center space-x-2 mb-2">
              <Info size={16} color="#6366F1" />
              <Text className="text-primary font-medium">Current Plan</Text>
            </View>
            <Text className="text-white text-lg font-semibold mb-1">
              {membership.plan_type} Membership
            </Text>
            <Text className="text-textSecondary">
              {membership.credits - membership.credits_used} credits remaining
            </Text>
          </View>
        )}

        {/* Available Plans */}
        <View className="mt-6 space-y-4">
          {plans?.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              className={`bg-surface rounded-2xl p-6 ${
                plan.popular ? "border-2 border-primary" : ""
              }`}
              activeOpacity={0.9}
            >
              {plan.popular && (
                <View className="absolute -top-3 left-6 bg-primary px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium">
                    Most Popular
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-white text-xl font-bold mb-1">
                    {plan.title}
                  </Text>
                  <Text className="text-textSecondary">{plan.description}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white text-2xl font-bold">
                    ${plan.price}
                  </Text>
                  <Text className="text-textSecondary">per month</Text>
                </View>
              </View>

              <View className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center space-x-3">
                    <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                      <Check size={12} color="#6366F1" />
                    </View>
                    <Text className="text-white flex-1">{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  plan.popular ? "bg-primary" : "bg-primary/10"
                }`}
              >
                <Text
                  className={`font-semibold text-lg ${
                    plan.popular ? "text-white" : "text-primary"
                  }`}
                >
                  {plan.button_text}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Info */}
        <View className="mt-6 mb-8 bg-surface/50 rounded-2xl p-4">
          <View className="flex-row items-start space-x-3">
            <CreditCard size={20} color="#6366F1" className="mt-1" />
            <View className="flex-1">
              <Text className="text-white font-medium mb-1">
                Flexible Billing
              </Text>
              <Text className="text-textSecondary text-sm">
                Cancel or change your plan at any time. No hidden fees or
                commitments.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
