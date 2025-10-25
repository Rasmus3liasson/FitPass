import { MembershipPlan } from "@/types";
import { Check, CreditCard, Info, Star, X, Zap } from "lucide-react-native";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PlanSelectionModalProps {
  visible: boolean;
  selectedPlan: MembershipPlan | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  hasExistingMembership?: boolean;
}

export function PlanSelectionModal({
  visible,
  selectedPlan,
  onClose,
  onConfirm,
  isLoading = false,
  hasExistingMembership = false,
}: PlanSelectionModalProps) {
  if (!selectedPlan) return null;

  const getPlanIcon = (planTitle: string) => {
    if (planTitle.toLowerCase().includes('premium') || planTitle.toLowerCase().includes('pro')) {
      return <Star size={32} color="#FFD700" fill="#FFD700" />;
    }
    return <Zap size={32} color="#6366F1" />;
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
                <X size={20} color="#ffffff" />
              </TouchableOpacity>

              <View className="items-center mt-2">
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  {getPlanIcon(selectedPlan.title)}
                </View>
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
                      {selectedPlan.price > 0 ? `${selectedPlan.price} kr` : 'Gratis'}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide mb-1">
                      Krediter
                    </Text>
                    <View className="flex-row items-center">
                      <Zap size={20} color="#6366F1" />
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
                      <Check size={16} color="#10B981" />
                      <Text className="text-textSecondary text-sm ml-3 flex-1">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Warning for existing membership */}
              {hasExistingMembership && (
                <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-start">
                    <Info size={20} color="#f59e0b" />
                    <View className="ml-3 flex-1">
                      <Text className="text-orange-800 font-semibold mb-1">
                        Ändra medlemskap
                      </Text>
                      <Text className="text-orange-700 text-sm">
                        Din nuvarande plan kommer att uppdateras. Nya villkor träder i kraft omedelbart.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl py-4 px-6"
                  onPress={onConfirm}
                  disabled={isLoading}
                  style={{
                    shadowColor: "#6366F1",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CreditCard size={20} color="#ffffff" />
                        <Text className="text-white font-bold text-base ml-2">
                          {hasExistingMembership ? 'Uppdatera plan' : 'Välj denna plan'}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-surface border border-border rounded-2xl py-4 px-6"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text className="text-textSecondary font-semibold text-base text-center">
                    Avbryt
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}