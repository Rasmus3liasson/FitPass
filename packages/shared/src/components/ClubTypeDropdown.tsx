import colors from '@shared/constants/custom-colors';
import { ClubType, useClubTypes } from "../hooks/useClubTypes";
import { Check, CaretDown } from "phosphor-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CenterModal } from "./CenterModal";

interface ClubTypeDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const ClubTypeDropdown: React.FC<ClubTypeDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Välj klubtyp",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: clubTypes, isLoading, error } = useClubTypes();

  const selectedType = clubTypes?.find((type) => type.name === value);

  const handleSelect = (type: ClubType) => {
    onValueChange(type.name);
    setIsOpen(false);
  };

  if (error) {
    return (
      <View className="bg-background rounded-xl px-4 py-3 border border-accentRed">
        <Text className="text-accentRed text-sm">
          Error loading club types. Please enter manually.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        className="bg-background rounded-xl px-4 py-3 border border-accentGray flex-row items-center justify-between"
        onPress={() => setIsOpen(true)}
        disabled={isLoading}
      >
        <Text className={`${value ? "text-textPrimary" : "text-textSecondary"} text-base`}>
          {selectedType?.name || value || placeholder}
        </Text>
        <CaretDown
          size={20}
          color={isLoading ? colors.borderGray : colors.borderGray}
          style={{
            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      <CenterModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        animationType="fade"
        backgroundColor="bg-surface"
      >
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-textPrimary text-lg font-semibold">
              Välj Klubtyp
            </Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text className="text-textPrimary text-base">Klar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-72"
          >
              {isLoading ? (
                <View className="py-8 items-center">
                  <Text className="text-textSecondary">Laddar klubtyper...</Text>
                </View>
              ) : (
                clubTypes?.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    className="flex-row items-center justify-between py-3 px-2 rounded-lg active:bg-primary/10"
                    onPress={() => handleSelect(type)}
                  >
                    <View className="flex-1">
                      <Text className="text-textPrimary text-base font-medium">
                        {type.name}
                      </Text>
                      {type.description && (
                        <Text className="text-textSecondary text-sm mt-1">
                          {type.description}
                        </Text>
                      )}
                    </View>
                    {value === type.name && <Check size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))
              )}
          </ScrollView>
        </View>
      </CenterModal>
    </View>
  );
};
