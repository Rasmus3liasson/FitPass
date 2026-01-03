import { Plus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
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
}

export const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  onRefresh,
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
    <View
      className="bg-surface rounded-3xl p-6 mb-6"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-textPrimary">
            Betalningsmetoder
          </Text>
        </View>
        <TouchableOpacity
          onPress={onAddPaymentMethod}
          className="bg-primary rounded-xl px-4 py-2.5 flex-row items-center"
          activeOpacity={0.7}
          style={{
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Plus size={18} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <View className="space-y-3">
          {paymentMethods.map((method, index) => (
            <View
              key={method.id}
              className="bg-background/50 rounded-2xl p-4 border border-surface/50"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="flex-row items-center justify-between">
                {/* Card Info */}
                <View className="flex-row items-center flex-1">
                  <View className="w-14 h-14 rounded-xl bg-primary/5 items-center justify-center mr-4">
                    <Text className="text-4xl">
                      {getCardBrandIcon(method.card?.brand || "card")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-textPrimary font-bold text-base">
                        {method.card?.brand.toUpperCase()} ••••{" "}
                        {method.card?.last4}
                      </Text>
                      {method.isDefault && (
                        <View className="bg-green-500/15 px-2.5 py-1 rounded-full ml-2">
                          <Text className="text-green-600 text-xs font-bold">
                            Standard
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-textSecondary text-sm">
                      Utgår {method.card?.exp_month}/{method.card?.exp_year}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center ml-2">
                  {!method.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultPaymentMethod(method.id)}
                      disabled={settingDefaultId === method.id}
                      className="bg-primary/10 rounded-xl px-3 py-2 mr-2"
                      activeOpacity={0.7}
                    >
                      {settingDefaultId === method.id ? (
                        <ActivityIndicator size="small" color="#6366f1" />
                      ) : (
                        <Text className="text-primary text-xs font-bold">
                          Sätt som standard
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeletePaymentMethod(method.id)}
                    disabled={deletingMethodId === method.id}
                    className="bg-red-500/10 rounded-xl p-2.5"
                    activeOpacity={0.7}
                  >
                    {deletingMethodId === method.id ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Trash2 size={18} color="#ef4444" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center py-12">
          <Text className="text-textPrimary font-bold text-xl mb-2">
            Inga betalningsmetoder
          </Text>
          <Text className="text-textSecondary text-center text-sm mb-6 px-4 leading-relaxed">
            Lägg till ett betalkort för att hantera dina betalningar
          </Text>
          <TouchableOpacity
            onPress={onAddPaymentMethod}
            className="bg-primary rounded-2xl px-6 py-3.5 flex-row items-center"
            activeOpacity={0.7}
            style={{
              shadowColor: "#6366f1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2 text-base">
              Lägg till kort
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
