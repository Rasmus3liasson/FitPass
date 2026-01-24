import { X } from 'phosphor-react-native';
import React from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

interface ActionSheetOption {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive';
  icon?: React.ReactNode;
}

interface CustomActionSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export const CustomActionSheet: React.FC<CustomActionSheetProps> = ({
  visible,
  title,
  message,
  options,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-3xl max-h-[70%]">
          {/* Header with close button */}
          <View className="flex-row items-center justify-between p-4 border-b border-borderGray">
            <View className="flex-1">
              {title && <Text className="text-textPrimary text-lg font-semibold">{title}</Text>}
              {message && <Text className="text-textSecondary text-sm mt-1">{message}</Text>}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-accentGray/50 items-center justify-center ml-4"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View className="p-4">
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    option.onPress();
                  }, 300);
                }}
                className={`flex-row items-center py-4 px-4 rounded-xl mb-2 ${
                  option.style === 'destructive' ? 'bg-red-500/10' : 'bg-background'
                }`}
              >
                {option.icon && <View className="mr-3">{option.icon}</View>}
                <Text
                  className={`text-lg font-medium ${
                    option.style === 'destructive' ? 'text-accentRed' : 'text-textPrimary'
                  }`}
                >
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
