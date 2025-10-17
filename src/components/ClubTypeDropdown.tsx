import { ClubType, useClubTypes } from "@/src/hooks/useClubTypes";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ClubTypeDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const ClubTypeDropdown: React.FC<ClubTypeDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select club type",
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
      <View className="bg-background rounded-xl px-4 py-3 border border-red-500">
        <Text className="text-red-400 text-sm">
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
        <ChevronDown
          size={20}
          color={isLoading ? "#9CA3AF" : "#6B7280"}
          style={{
            transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 w-full max-w-md max-h-96"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-textPrimary text-lg font-semibold">
                Select Club Type
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-primary text-base">Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="max-h-72"
            >
              {isLoading ? (
                <View className="py-8 items-center">
                  <Text className="text-textSecondary">Loading club types...</Text>
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
                    {value === type.name && <Check size={20} color="#6366F1" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
