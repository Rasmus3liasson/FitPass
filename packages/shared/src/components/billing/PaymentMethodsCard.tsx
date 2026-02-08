import { PlusIcon } from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import colors from '../../constants/custom-colors';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalFeedback } from '../../hooks/useGlobalFeedback';
import { PaymentMethod, PaymentMethodService } from '../../services/PaymentMethodService';
import { Option, OptionsModal } from '../ui/OptionsModal';
import { PaymentCard } from './PaymentCard';

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

  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const result = await PaymentMethodService.deletePaymentMethod(paymentMethodId);

      if (result.success) {
        showSuccess('Borttagen', 'Betalningsmetoden har tagits bort');
        await onRefresh();
        setModalVisible(false);
      } else {
        showError('Fel', result.error || 'Kunde inte ta bort betalningsmetod');
      }
    } catch {
      showError('Fel', 'Ett fel uppstod');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(user.id, paymentMethodId);

      if (result.success) {
        showSuccess('Uppdaterad', 'Standardbetalningsmetod ändrad');
        await onRefresh();
        setModalVisible(false);
      } else {
        showError('Fel', result.error || 'Kunde inte ändra standardmetod');
      }
    } catch {
      showError('Fel', 'Ett fel uppstod');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionConfirm = async (option: Option) => {
    if (!selectedMethod) return;

    if (option.id === 'set-default') {
      await handleSetDefaultPaymentMethod(selectedMethod.id);
    } else if (option.id === 'delete') {
      await handleDeletePaymentMethod(selectedMethod.id);
    }
  };

  const getCardOptions = (method: PaymentMethod): Option[] => {
    const options: Option[] = [];

    if (!method.isDefault) {
      options.push({
        id: 'set-default',
        label: 'Sätt som standard',
        value: 'set-default',
      });
    }

    options.push({
      id: 'delete',
      label: 'Ta bort kort',
      value: 'delete',
    });

    return options;
  };

  return (
    <>
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-textPrimary">Betalningsmetoder</Text>

          <TouchableOpacity
            onPress={onAddPaymentMethod}
            disabled={isLoading}
            className="bg-accentGreen rounded-full px-5 py-2.5 flex-row items-center gap-2"
            style={{
              shadowColor: colors.accentGreen,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <PlusIcon size={18} color="white" weight="bold" />
                <Text className="text-white font-bold text-sm">Lägg till</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="gap-4">
          {paymentMethods.map((method) => (
            <PaymentCard
              key={method.id}
              method={method}
              onOpenMenu={(method) => {
                setSelectedMethod(method);
                setModalVisible(true);
              }}
            />
          ))}
        </View>
      </View>

      <OptionsModal
        visible={modalVisible}
        title="Kortåtgärder"
        description={
          selectedMethod
            ? `${selectedMethod.card?.brand?.toUpperCase()} •••• ${selectedMethod.card?.last4}`
            : ''
        }
        options={selectedMethod ? getCardOptions(selectedMethod) : []}
        onClose={() => setModalVisible(false)}
        onConfirm={handleOptionConfirm}
        confirmButtonText="Bekräfta"
        cancelButtonText="Avbryt"
        isLoading={isProcessing}
      />
    </>
  );
};
