import { X } from "lucide-react-native";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export interface Option {
  id: string;
  label: string;
  value: string;
}

interface OptionsModalProps {
  visible: boolean;
  title: string;
  description?: string;
  options: Option[];
  onClose: () => void;
  onConfirm: (selectedOption: Option) => void;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  multiSelect?: boolean;
}

export function OptionsModal({
  visible,
  title,
  description,
  options,
  onClose,
  onConfirm,
  confirmButtonText = "Bekräfta",
  confirmButtonColor = "bg-primary",
  cancelButtonText = "Avbryt",
  isLoading = false,
  multiSelect = false,
}: OptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-background w-full max-w-md rounded-3xl overflow-hidden">
          {/* Header */}
          <View className="bg-background p-6 border-b border-borderGray">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-textPrimary flex-1 pr-2">
                {title}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-surface"
                disabled={isLoading}
              >
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {description && (
              <Text className="text-textSecondary mt-2 text-sm">
                {description}
              </Text>
            )}
          </View>

          {/* Options List */}
          <ScrollView className="max-h-96">
            <View className="p-4">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSelectedOption(option)}
                  disabled={isLoading}
                  className={`p-4 rounded-xl mb-3 border-2 ${
                    selectedOption?.id === option.id
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-primary"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base font-medium flex-1 ${
                        selectedOption?.id === option.id
                          ? "text-primary"
                          : "text-textPrimary"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {selectedOption?.id === option.id && (
                      <View className="w-5 h-5 bg-primary rounded-full items-center justify-center ml-2">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-4 border-t border-borderGray">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedOption || isLoading}
              className={`rounded-xl py-4 mb-3 ${
                selectedOption && !isLoading
                  ? confirmButtonColor
                  : "bg-accentGray"
              }`}
            >
              <Text className="text-white text-center font-bold text-base">
                {isLoading ? "Bearbetar..." : confirmButtonText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="rounded-xl py-4 bg-surface"
            >
              <Text className="text-textPrimary text-center font-semibold">
                {cancelButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
