import colors from '@shared/constants/custom-colors';
import { X } from "phosphor-react-native";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

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
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        className="flex-1 bg-black/60 justify-end"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-background rounded-t-3xl"
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-black text-textPrimary">
                  {title}
                </Text>
                {description && (
                  <Text className="text-textSecondary mt-2 text-sm leading-5">
                    {description}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="w-10 h-10 items-center justify-center rounded-full bg-accentGray/20"
                disabled={isLoading}
              >
                <X size={22} color={colors.borderGray} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Options Grid */}
          <View className="px-6 pb-6">
            <View className="flex-row flex-wrap -mx-1.5">
              {options.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setSelectedOption(option)}
                    disabled={isLoading}
                    className="w-1/2 px-1.5 mb-3"
                  >
                    <View
                      className={`rounded-2xl p-4 border-2 ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-borderGray"
                      }`}
                      style={{
                        shadowColor: isSelected ? colors.primary : "transparent",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: isSelected ? 4 : 0,
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          className={`text-base font-bold flex-1 leading-tight text-textPrimary`}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Actions */}
          <View className="px-6 pb-8 pt-2">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedOption || isLoading}
              className={`rounded-2xl py-4 mb-3 ${
                selectedOption && !isLoading
                  ? confirmButtonColor
                  : "bg-accentGray/50"
              }`}
              style={{
                shadowColor:
                  selectedOption && !isLoading ? colors.primary : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: selectedOption && !isLoading ? 6 : 0,
              }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isLoading ? "Bearbetar..." : confirmButtonText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="py-3"
            >
              <Text className="text-textSecondary text-center font-semibold">
                {cancelButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
