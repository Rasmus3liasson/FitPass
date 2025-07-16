import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SimpleSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
}

export const SimpleSlider: React.FC<SimpleSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  label,
}) => {
  const generateValues = () => {
    const values = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  };

  const values = generateValues();

  return (
    <View className="bg-surface rounded-xl p-4">
      {label && <Text className="text-white font-medium mb-3">{label}</Text>}
      <View className="flex-row flex-wrap gap-2">
        {values.map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => onValueChange(val)}
            className={`px-3 py-2 rounded-lg border ${
              value === val
                ? "bg-primary border-primary"
                : "bg-transparent border-borderGray"
            }`}
          >
            <Text
              className={`text-sm ${
                value === val ? "text-white" : "text-textSecondary"
              }`}
            >
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
