import colors from '@fitpass/shared/constants/custom-colors';
import { Booking } from '@shared/types';
import { formatSwedishTime } from '@shared/utils/time';
import { X } from 'phosphor-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SwipeableModal } from '../SwipeableModal';

interface CancelConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function CancelConfirmationModal({
  visible,
  onClose,
  booking,
  onConfirm,
  isLoading,
}: CancelConfirmationModalProps) {
  if (!booking) return null;

  return (
    <SwipeableModal visible={visible} onClose={onClose} snapPoint={0.4}>
      <View className="bg-surface flex-1 px-6 py-6">
        <View className="flex-1 justify-center items-center">
          <View className="w-20 h-20 rounded-full bg-accentRed/10 justify-center items-center mb-5">
            <X size={40} color={colors.accentRed} weight="bold" />
          </View>

          <Text className="text-textPrimary text-xl font-bold mb-2 text-center">Avboka pass</Text>

          <Text className="text-textSecondary text-sm text-center mb-1">Vill du avboka</Text>
          <Text className="text-textPrimary text-base font-semibold mb-1">
            {booking.classes?.name || 'Detta pass'}
          </Text>
          <Text className="text-textSecondary text-sm text-center mb-6">
            {booking.classes?.start_time
              ? formatSwedishTime(new Date(booking.classes.start_time))
              : ''}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-surface border border-borderGray/20"
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-textPrimary text-base font-semibold">Behåll bokning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-accentRed"
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-bold">Avboka</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SwipeableModal>
  );
}
