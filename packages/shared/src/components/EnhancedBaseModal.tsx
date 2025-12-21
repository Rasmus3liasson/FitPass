import { X } from "lucide-react-native";
import React from "react";
import {
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { SwipeableModal } from "./SwipeableModal";

interface EnhancedBaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: string;
  contentStyle?: ViewStyle;
  showCloseButton?: boolean;
  backgroundColor?: string;
}

export const EnhancedBaseModal: React.FC<EnhancedBaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = "65%",
  contentStyle,
  showCloseButton = true,
  backgroundColor = "bg-gradient-to-b from-[#1E1E2E] to-[#2A2A3E]",
}) => {
  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      maxHeight={maxHeight}
      showScrollIndicator={false}
      enableSwipe={true}
      animationType="none"
      backgroundColor={backgroundColor}
      scrollViewProps={{
        bounces: false,
        style: contentStyle,
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-textPrimary">{title}</Text>
        </View>
        {showCloseButton && (
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
            onPress={onClose}
          >
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pb-6">
        {children}
      </View>
    </SwipeableModal>
  );
};