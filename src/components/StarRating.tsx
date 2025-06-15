import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  style?: ViewStyle;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 24,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.star}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? "#FFD700" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    marginHorizontal: 4,
  },
}); 