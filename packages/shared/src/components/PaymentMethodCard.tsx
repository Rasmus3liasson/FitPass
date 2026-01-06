import colors from '@shared/constants/custom-colors';
import { CreditCard, TrashIcon } from "phosphor-react-native";

import { Text, TouchableOpacity, View } from "react-native";
import StatusBadge from "./ui/StatusBadge";

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding?: string;
  };
  klarna?: {
    country?: string;
  };
  swish?: {
    phone_last4?: string;
  };
  isDefault?: boolean;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onUpdate: () => void;
  onRemove?: () => void;
}

const getPaymentMethodIcon = (type: string, brand?: string) => {
  if (type === "card") {
    switch (brand?.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💎";
      default:
        return "💳";
    }
  }
  // Future payment methods
  switch (type) {
    case "klarna":
      return "🛍️";
    case "swish":
      return "📱";
    case "bank_transfer":
      return "🏦";
    default:
      return "💰";
  }
};

const getPaymentMethodLabel = (
  type: string,
  brand?: string,
  funding?: string
) => {
  if (type === "card") {
    const fundingType =
      funding === "credit"
        ? "Kreditkort"
        : funding === "debit"
        ? "Bankkort"
        : "Kort";
    return `${fundingType} ${
      brand ? `(${brand.charAt(0).toUpperCase() + brand.slice(1)})` : ""
    }`;
  }

  switch (type) {
    case "klarna":
      return "Klarna";
    case "swish":
      return "Swish";
    case "bank_transfer":
      return "Bankgiro";
    default:
      return "Betalningsmetod";
  }
};

export function PaymentMethodCard({
  paymentMethod,
  onUpdate,
  onRemove,
}: PaymentMethodCardProps) {
  const { type, card, klarna, swish } = paymentMethod;
  const icon = getPaymentMethodIcon(type, card?.brand);
  const label = getPaymentMethodLabel(type, card?.brand, card?.funding);

  return (
    <View className="bg-surface border border-borderGray rounded-2xl p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mr-3">
            <Text className="text-2xl">{icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-base mb-1">
              {label}
            </Text>
            {card && (
              <Text className="text-textSecondary text-sm">
                •••• {card.last4}
              </Text>
            )}
            {swish && swish.phone_last4 && (
              <Text className="text-textSecondary text-sm">
                •••• {swish.phone_last4}
              </Text>
            )}
            {klarna && klarna.country && (
              <Text className="text-textSecondary text-sm">
                {klarna.country}
              </Text>
            )}
          </View>
        </View>
        {paymentMethod.isDefault ? (
          <StatusBadge status="active" />
        ) : (
          <View className="bg-gray-500/20 px-3 py-1.5 rounded-full">
            <Text className="text-gray-500 text-xs font-bold">INAKTIV</Text>
          </View>
        )}
      </View>

      {/* Details - Only show for cards */}
      {type === "card" && card && (
        <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-borderGray/50">
          <View>
            <Text className="text-textSecondary text-xs mb-1">Giltig till</Text>
            <Text className="text-textPrimary font-semibold">
              {card.exp_month.toString().padStart(2, "0")}/
              {card.exp_year.toString().slice(-2)}
            </Text>
          </View>
        </View>
      )}

      {/* Details for other payment types */}
      {type === "klarna" && (
        <View className="mb-4 pb-4 border-b border-borderGray/50">
          <Text className="text-textSecondary text-xs">
            Betala senare med Klarna
          </Text>
        </View>
      )}

      {type === "swish" && (
        <View className="mb-4 pb-4 border-b border-borderGray/50">
          <Text className="text-textSecondary text-xs">
            Mobil betalning med Swish
          </Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onUpdate}
          className="flex-1 bg-primary/10 rounded-xl py-3 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <CreditCard size={16} color={colors.primary} />
          <Text className="text-primary font-semibold ml-2">
            Byt betalningsmetod
          </Text>
        </TouchableOpacity>

        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            className="bg-red-500/10 rounded-xl px-4 py-3 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <TrashIcon size={16} color={colors.accentRed} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
