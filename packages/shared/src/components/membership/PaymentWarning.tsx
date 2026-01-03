import colors from '@shared/constants/custom-colors';
import { ArrowRight, CreditCard } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface PaymentWarningProps {
  onAddPaymentMethod: () => void;
}

export function PaymentWarning({ onAddPaymentMethod }: PaymentWarningProps) {
  return (
    <View className="mt-6 mx-4">
      <View className="bg-surface rounded-3xl p-6 border border-white/5">
        {/* Header */}
        <View className="mb-5">
          <Text className="text-textPrimary text-xl font-semibold mb-2">
            Lägg till betalningsmetod
          </Text>
          <Text className="text-textSecondary text-sm leading-relaxed">
            För att kunna välja och hantera medlemskap behöver du en giltig
            betalningsmetod.
          </Text>
        </View>

        {/* Benefits Grid */}
        <View className="mb-6">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[140px] bg-background/50 rounded-2xl p-4">
              <Text className="text-textPrimary font-medium text-sm mb-1">
                Alla planer
              </Text>
              <Text className="text-textSecondary text-xs">
                Tillgång till samtliga medlemskap
              </Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-background/50 rounded-2xl p-4">
              <Text className="text-textPrimary font-medium text-sm mb-1">
                Flexibel hantering
              </Text>
              <Text className="text-textSecondary text-xs">
                Ändra eller avbryt när som helst
              </Text>
            </View>
          </View>
          <View className="mt-3">
            <View className="bg-background/50 rounded-2xl p-4">
              <Text className="text-textPrimary font-medium text-sm mb-1">
                Automatisk förnyelse
              </Text>
              <Text className="text-textSecondary text-xs">
                Inga avbrott i ditt medlemskap
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={onAddPaymentMethod}
          className="bg-primary rounded-2xl py-4 px-6 mb-4"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <CreditCard size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-3 mr-2">
              Lägg till betalningsmetod
            </Text>
            <ArrowRight size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
