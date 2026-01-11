import { PlusIcon, Trash } from "phosphor-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";
import { useAuth } from "../../hooks/useAuth";
import { useGlobalFeedback } from "../../hooks/useGlobalFeedback";
import {
  PaymentMethod,
  PaymentMethodService,
} from "../../services/PaymentMethodService";

interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  onRefresh,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalFeedback();
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id) return;

    setDeletingMethodId(paymentMethodId);
    try {
      const result = await PaymentMethodService.deletePaymentMethod(
        paymentMethodId
      );

      if (result.success) {
        showSuccess("Borttagen", "Betalningsmetoden har tagits bort");
        await onRefresh();
      } else {
        showError("Fel", result.error || "Kunde inte ta bort betalningsmetod");
      }
    } catch (error) {
      showError("Fel", "Ett fel uppstod");
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id) return;

    setSettingDefaultId(paymentMethodId);
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(
        user.id,
        paymentMethodId
      );

      if (result.success) {
        showSuccess("Uppdaterad", "Standardbetalningsmetod ändrad");
        await onRefresh();
      } else {
        showError("Fel", result.error || "Kunde inte ändra standardmetod");
      }
    } catch (error) {
      showError("Fel", "Ett fel uppstod");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💎";
      default:
        return "💳";
    }
  };

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-semibold text-textPrimary">
          Betalningsmetoder
        </Text>
        <TouchableOpacity
          onPress={onAddPaymentMethod}
          disabled={isLoading}
          className="bg-primary rounded-xl px-4 py-2.5 flex-row items-center gap-2"
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <PlusIcon size={20} color="white" weight="bold" />
              <Text className="text-white font-semibold text-sm">
                Lägg till
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <View className="gap-3">
          {paymentMethods.map((method, index) => (
            <View
              key={method.id}
              className="bg-surface rounded-xl p-4 border border-borderGray/10"
            >
              {/* Main Card Info */}
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                  <Text className="text-xl">
                    {getCardBrandIcon(method.card?.brand || "card")}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold text-base">
                    {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                  </Text>
                  <Text className="text-textSecondary text-xs mt-0.5">
                    Utgår {method.card?.exp_month}/{method.card?.exp_year}
                  </Text>
                </View>
                {method.isDefault && (
                  <View className="bg-accentGreen/15 px-2.5 py-1 rounded-lg">
                    <Text className="text-accentGreen text-xs font-semibold">
                      Standard
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions Row */}
              <View className="flex-row items-center gap-2 pt-3 border-t border-borderGray/10">
                {!method.isDefault && (
                  <TouchableOpacity
                    onPress={() => handleSetDefaultPaymentMethod(method.id)}
                    disabled={settingDefaultId === method.id}
                    className="flex-1 bg-primary/10 py-2.5 rounded-lg flex-row items-center justify-center"
                    activeOpacity={0.7}
                  >
                    {settingDefaultId === method.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text className="text-primary font-semibold text-xs">
                        Sätt som standard
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleDeletePaymentMethod(method.id)}
                  disabled={deletingMethodId === method.id}
                  className={`${
                    method.isDefault ? "flex-1" : ""
                  } bg-accentRed/10 py-2.5 px-3 rounded-lg flex-row items-center justify-center gap-1.5`}
                  activeOpacity={0.7}
                >
                  {deletingMethodId === method.id ? (
                    <ActivityIndicator size="small" color={colors.accentRed} />
                  ) : (
                    <>
                      <Trash size={16} color={colors.accentRed} />
                      <Text className="text-accentRed font-semibold text-xs">
                        Ta bort
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-textPrimary font-semibold text-base mb-1">
            Inga betalningsmetoder
          </Text>
          <Text className="text-textSecondary text-center text-sm leading-relaxed">
            Lägg till ett betalkort för att hantera dina betalningar
          </Text>
        </View>
      )}
    </View>
  );
};
