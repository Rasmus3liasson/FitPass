import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useCreateMembership, useMembership, useUpdateMembershipPlan } from "@/src/hooks/useMembership";
import { useMembershipPlans } from "@/src/hooks/useMembershipPlans";
import { updateMembershipPlan } from "@/src/lib/integrations/supabase/queries/membershipQueries";
import { MembershipPlan } from "@/types";
import { StatusBar } from "expo-status-bar";
import { CreditCard, Info, X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function MembershipDetails() {
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership } = useMembership();
  const { user } = useAuth();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembershipPlan();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!user?.id) return;
    if (membership) {
      await updateMembershipPlan(user.id, planId);
    } else {
      createMembership.mutate(
        { userId: user.id, planId },
        {
          onSuccess: () => {
            Toast.show({
              type: "success",
              text1: "Membership Activated!",
              text2: "Your new membership plan is now active.",
              position: "bottom",
            });
          },
          onError: (error: any) => {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: error?.message || "Could not activate membership.",
              position: "bottom",
            });
          },
        }
      );
    }
  };

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
        <View className="mt-6 flex-row flex-wrap justify-between">
          {plans?.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              className="bg-surface rounded-2xl p-6 mb-4"
              style={{ width: "48%" }}
              onPress={() => {
                setSelectedPlan(plan);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-xl font-bold mb-1">{plan.title}</Text>
              <Text className="text-textSecondary">{plan.description}</Text>
              <Text className="text-white text-2xl font-bold mt-2">${plan.price}</Text>
              <Text className="text-textSecondary">per month</Text>
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#222",
              borderRadius: 20,
              padding: 24,
              width: 320,
              maxWidth: "90%",
              alignItems: "flex-start",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            {selectedPlan && (
              <>
                <Text className="text-white text-2xl font-bold mb-2">{selectedPlan.title}</Text>
                <Text className="text-textSecondary mb-2">{selectedPlan.description}</Text>
                <Text className="text-white text-xl font-bold mb-2">${selectedPlan.price} / month</Text>
                <Text className="text-white font-semibold mb-2">Features:</Text>
                {selectedPlan.features.map((feature, idx) => (
                  <Text key={idx} className="text-white mb-1">• {feature}</Text>
                ))}
                <TouchableOpacity
                  style={{
                    backgroundColor: "#6366F1",
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    marginTop: 16,
                    alignSelf: "stretch",
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    if (!user) return;
                    if (membership) {
                      updateMembership.mutate(
                        { userId: user.id, planId: selectedPlan.id },
                        {
                          onSuccess: () => {
                            Toast.show({
                              type: "success",
                              text1: "Membership Updated!",
                              text2: "Your membership plan has been changed.",
                              position: "bottom",
                            });
                          },
                          onError: (error) => {
                            Toast.show({
                              type: "error",
                              text1: "Error",
                              text2: error?.message || "Could not update membership.",
                              position: "bottom",
                            });
                          },
                        }
                      );
                    } else {
                      createMembership.mutate({ userId: user.id, planId: selectedPlan.id });
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                    Choose this plan
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaWrapper>
  );
}
