import { X } from 'phosphor-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  confirmStyle = 'default',
  onConfirm,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-surface rounded-3xl w-full max-w-sm">
          {/* Header with close button */}
          <View className="flex-row items-center justify-between p-6 pb-4">
            <Text className="text-textPrimary text-lg font-semibold flex-1 pr-4">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-accentGray/50 items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Message */}
          {message && (
            <View className="px-6 pb-6">
              <Text className="text-textSecondary text-base leading-6">{message}</Text>
            </View>
          )}

          {/* Action Button */}
          <View className="p-6 pt-0">
            <TouchableOpacity
              onPress={() => {
                onConfirm();
                onClose();
              }}
              className={`py-4 rounded-xl ${
                confirmStyle === 'destructive' ? 'bg-red-500' : 'bg-primary'
              }`}
            >
              <Text className="text-textPrimary text-center font-semibold text-lg">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
