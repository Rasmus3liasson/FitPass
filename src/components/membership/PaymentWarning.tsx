import { AlertTriangle, ArrowRight, CreditCard } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PaymentWarningProps {
  onAddPaymentMethod: () => void;
}

export function PaymentWarning({ onAddPaymentMethod }: PaymentWarningProps) {
  return (
    <View className="mt-6 mx-4">
      <View 
        className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 border-2 border-orange-200 rounded-3xl p-6"
        style={{
          shadowColor: "#f59e0b",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Header with Icon */}
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
            <AlertTriangle size={24} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-orange-800 text-lg font-bold">
              Betalningsuppgifter krävs
            </Text>
            <Text className="text-orange-600 text-sm">
              För att välja ett medlemskap
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-orange-700 text-sm mb-6 leading-relaxed">
          För att kunna välja och hantera medlemskap behöver du först lägga till 
          giltiga betalningsuppgifter. Detta säkerställer en smidig upplevelse.
        </Text>

        {/* Features */}
        <View className="mb-6">
          <Text className="text-orange-800 font-semibold mb-3">
            När du lagt till betalningsuppgifter kan du:
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3" />
              <Text className="text-orange-700 text-sm">
                Välja mellan alla medlemskapsplaner
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3" />
              <Text className="text-orange-700 text-sm">
                Hantera och ändra ditt medlemskap
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3" />
              <Text className="text-orange-700 text-sm">
                Automatisk förnyelse av dina krediter
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={onAddPaymentMethod}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl py-4 px-6"
          activeOpacity={0.8}
          style={{
            shadowColor: "#f59e0b",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center justify-center">
            <CreditCard size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base ml-2">
              Lägg till betalningsuppgifter
            </Text>
            <ArrowRight size={16} color="#ffffff" className="ml-2" />
          </View>
        </TouchableOpacity>

        {/* Security Note */}
        <View className="mt-4 pt-4 border-t border-orange-200">
          <Text className="text-orange-600 text-xs text-center">
            🔒 Dina betalningsuppgifter är säkra och krypterade
          </Text>
        </View>
      </View>
    </View>
  );
}