import { LinearGradient } from "expo-linear-gradient";
import { Filter, Heart, Plus, ShoppingCart } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import colors from "../../constants/custom-colors";
import { FloatingButton } from "../FloatingButton";

// Example 1: Simple text button
export const SimpleFloatingButton = ({ onPress, text }: { onPress: () => void; text: string }) => (
  <FloatingButton onPress={onPress} position="bottom-right">
    <View className="bg-primary py-3 px-6">
      <Text className="text-textPrimary font-semibold text-base">{text}</Text>
    </View>
  </FloatingButton>
);

// Example 2: Gradient button with icon
export const GradientFloatingButton = ({ onPress, title, icon }: { 
  onPress: () => void; 
  title: string; 
  icon: React.ReactNode;
}) => (
  <FloatingButton onPress={onPress} position="bottom-center" shadowColor="#EC4899">
    <LinearGradient
      colors={['#EC4899', '#8B5CF6', '#6366F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="py-4 px-6 flex-row items-center"
    >
      {icon}
      <Text className="text-textPrimary font-bold text-lg ml-3">{title}</Text>
    </LinearGradient>
  </FloatingButton>
);

// Example 3: Multi-action floating button
export const MultiActionFloatingButton = ({ 
  onSave, 
  onFilter, 
  saveText = "Save", 
  filterText = "Filter" 
}: {
  onSave: () => void;
  onFilter: () => void;
  saveText?: string;
  filterText?: string;
}) => (
  <FloatingButton onPress={() => {}} position="bottom-center">
    <View className="bg-gray-900 p-2 flex-row rounded-2xl">
      <View className="bg-primary py-3 px-4 rounded-xl mr-2 flex-row items-center">
        <Text className="text-textPrimary font-semibold mr-2">{saveText}</Text>
        <Plus size={16} color="white" />
      </View>
      <View className="bg-gray-700 py-3 px-4 rounded-xl flex-row items-center">
        <Text className="text-textPrimary font-semibold mr-2">{filterText}</Text>
        <Filter size={16} color="white" />
      </View>
    </View>
  </FloatingButton>
);

// Example 4: Cart floating button with count
export const CartFloatingButton = ({ 
  onPress, 
  itemCount 
}: { 
  onPress: () => void; 
  itemCount: number;
}) => (
  <FloatingButton onPress={onPress} position="bottom-right">
    <View className="bg-green-600 p-4 flex-row items-center relative">
      <ShoppingCart size={20} color="white" />
      <Text className="text-textPrimary font-bold ml-2">Cart</Text>
      {itemCount > 0 && (
        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-6 h-6 items-center justify-center">
          <Text className="text-textPrimary text-xs font-bold">
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  </FloatingButton>
);

// Example 5: Like/favorite button
export const FavoriteFloatingButton = ({ 
  onPress, 
  isFavorite 
}: { 
  onPress: () => void; 
  isFavorite: boolean;
}) => (
  <FloatingButton onPress={onPress} position="bottom-right">
    <View className={`p-4 ${isFavorite ? 'bg-red-500' : 'bg-gray-600'}`}>
      <Heart 
        size={24} 
        color="white" 
        fill={isFavorite ? "white" : "transparent"} 
      />
    </View>
  </FloatingButton>
);

// Example 6: Your AdvancedFiltersModal style button
export const FilterModalButton = ({ 
  onPress, 
  text, 
  disabled = false 
}: {
  onPress: () => void;
  text: string;
  disabled?: boolean;
}) => (
  <FloatingButton
    onPress={onPress}
    disabled={disabled}
    shadowColor={colors.primary}
  >
    <View
      className={`py-4 px-6 items-center ${
        disabled ? "bg-gray-700" : "bg-primary"
      }`}
    >
      <Text
        className={`font-bold text-lg ${
          disabled ? "text-gray-400" : "text-textPrimary"
        }`}
      >
        {text}
      </Text>
    </View>
  </FloatingButton>
);
