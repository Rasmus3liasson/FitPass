import { DotsThreeIcon } from 'phosphor-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import colors from '../../constants/custom-colors';
import { PaymentMethod } from '../../services/PaymentMethodService';

interface PaymentCardProps {
  method: PaymentMethod;
  onOpenMenu: (method: PaymentMethod) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ method, onOpenMenu }) => {
  const getCardColors = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return [colors.primary, colors.accentBlue];
      case 'mastercard':
        return [colors.accentOrange, colors.accentRed];
      case 'amex':
        return [colors.accentBlue, colors.primary];
      default:
        return [colors.surface, colors.surface];
    }
  };

  const [bgStart, bgEnd] = getCardColors(method.card?.brand);

  return (
    <View
      className="rounded-3xl p-6 overflow-hidden"
      style={{
        backgroundColor: bgStart,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Glassy highlights */}
      <View className="absolute top-0 left-0 right-0 h-20 bg-white/10 rounded-t-3xl" />

      <View className="flex-row justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-white font-bold uppercase tracking-widest text-base">
            {method.card?.brand}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {method.isDefault && (
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">Standard</Text>
            </View>
          )}

          {method.isVirtual && (
            <View className="bg-accentBlue px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">Virtuellt</Text>
            </View>
          )}

          {method.card?.funding && (
            <View className="bg-white/20 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">
                {method.card.funding.toUpperCase()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onOpenMenu(method)}
            className="bg-white/20 p-2 rounded-full"
          >
            <DotsThreeIcon size={22} color="white" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {method.billing_details?.name && (
        <Text className="text-white/80 text-sm mb-2">{method.billing_details.name}</Text>
      )}

      <Text className="text-white font-mono text-2xl font-bold mb-4" style={{ letterSpacing: 4 }}>
        •••• •••• •••• {method.card?.last4}
      </Text>

      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-white/70 text-xs mb-1">GILTIG TOM</Text>
          <Text className="text-white font-mono text-base font-bold">
            {String(method.card?.exp_month).padStart(2, '0')}/{method.card?.exp_year}
          </Text>
        </View>

        {method.card?.country && (
          <Text className="text-white/50 text-xs">{method.card.country.toUpperCase()}</Text>
        )}
      </View>
    </View>
  );
};
