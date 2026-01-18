import colors from "@shared/constants/custom-colors";
import * as Haptics from "expo-haptics";
import { CheckIcon, X } from "phosphor-react-native";
import { useState } from "react";
import { Animated, Modal, Text, TouchableOpacity, View } from "react-native";

export interface Option {
  id: string;
  label: string;
  value: string;
  icon?: React.ComponentType<any>;
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
  const [scaleAnims] = useState(() =>
    options.reduce((acc, opt) => {
      acc[opt.id] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  );

  const handleConfirm = () => {
    if (selectedOption) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConfirm(selectedOption);
    }
  };

  const handleSelectOption = (option: Option) => {
    Haptics.selectionAsync();
    setSelectedOption(option);

    // Animate the selected card (only if animation value exists)
    const animValue = scaleAnims[option.id];
    if (animValue) {
      Animated.sequence([
        Animated.spring(animValue, {
          toValue: 0.95,
          useNativeDriver: true,
          speed: 50,
          bounciness: 10,
        }),
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 10,
        }),
      ]).start();
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
          <View className="px-6 pb-4">
            {!selectedOption && (
              <Text className="text-textSecondary text-sm mb-3 text-center">
                Välj ett alternativ nedan
              </Text>
            )}

            <View className="flex-row flex-wrap -mx-1.5">
              {options.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                const IconComponent = option.icon;

                return (
                  <Animated.View
                    key={option.id}
                    className="w-1/2 px-1.5 mb-3"
                    style={{
                      transform: [{ scale: scaleAnims[option.id] || 1 }],
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectOption(option)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <View
                        className={`rounded-2xl p-4 border-2 ${
                          isSelected
                            ? "bg-primary/15 border-primary"
                            : "bg-surface border-borderGray/40"
                        }`}
                        style={{
                          shadowColor: isSelected
                            ? colors.primary
                            : "transparent",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 12,
                          elevation: isSelected ? 6 : 0,
                        }}
                      >
                        {/* Label + icon/check (fixed layout) */}
                        <View className="flex-row items-start justify-between">
                          <Text
                            className={`text-sm font-bold leading-tight flex-1 pr-2 ${
                              isSelected ? "text-textPrimary" : "text-textPrimary"
                            }`}
                            numberOfLines={2}
                          >
                            {option.label}
                          </Text>

                          {/* Fixed-size icon container */}
                          <View
                            className={`p-2 rounded-xl ${
                              isSelected ? "bg-primary/20" : "bg-surface"
                            }`}
                          >
                            {isSelected ? (
                              <CheckIcon
                                size={24}
                                color={colors.primary}
                                weight="bold"
                              />
                            ) : (
                              IconComponent && (
                                <IconComponent
                                  size={24}
                                  color={colors.textSecondary}
                                  weight="duotone"
                                />
                              )
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
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
              <Text className="text-textPrimary text-center font-bold text-base">
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
