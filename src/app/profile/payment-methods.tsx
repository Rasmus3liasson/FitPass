import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { StatusBar } from "expo-status-bar";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "visa",
      last4: "4242",
      expiryMonth: "12",
      expiryYear: "2025",
      isDefault: true,
    },
    {
      id: "2",
      type: "mastercard",
      last4: "5555",
      expiryMonth: "08",
      expiryYear: "2024",
      isDefault: false,
    },
  ]);

  const getCardIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      default:
        return "💳";
    }
  };

  const getCardColor = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "visa":
        return ["#1A1F71", "#F7B600"];
      case "mastercard":
        return ["#EB001B", "#F79E1B"];
      case "amex":
        return ["#006FCF", "#2E77BB"];
      default:
        return ["#6366F1", "#EC4899"];
    }
  };

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
            Payment Methods
          </Text>
          <Text className="text-textSecondary text-base">
            Manage your payment methods and billing information
          </Text>
        </View>

        {/* Payment Methods List */}
        <View className="mt-6 space-y-4">
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              className="bg-surface rounded-2xl p-4"
              activeOpacity={0.9}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-3">
                  <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                    <Text className="text-2xl">{getCardIcon(method.type)}</Text>
                  </View>
                  <View>
                    <Text className="text-white text-lg font-semibold capitalize">
                      {method.type} •••• {method.last4}
                    </Text>
                    <Text className="text-textSecondary">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </Text>
                  </View>
                </View>
                {method.isDefault && (
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-sm font-medium">
                      Default
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Card Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-surface rounded-2xl p-4 mt-6 mb-8"
          activeOpacity={0.9}
        >
          <Plus size={20} color="#6366F1" />
          <Text className="text-primary font-semibold text-lg ml-2">
            Add New Card
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
} 