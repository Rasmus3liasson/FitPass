import { Send, Star, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import colors from "../../constants/custom-colors";

interface ReviewData {
  rating: number;
  comment: string;
}

interface EnhancedAddReviewProps {
  onSubmit: (data: ReviewData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialRating?: number;
  initialComment?: string;
  facilityName?: string;
}

export function EnhancedAddReview({
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp = false,
  initialRating = 0,
  initialComment = "",
  facilityName,
}: EnhancedAddReviewProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [focusAnimation] = useState(new Animated.Value(0));

  const handleSubmitReview = async () => {
    if (isSubmittingProp) return;

    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Rating Required",
        text2: "Please select a star rating",
      });
      return;
    }

    if (comment.trim().length < 10) {
      Toast.show({
        type: "error",
        text1: "Review Too Short",
        text2: "Please write at least 10 characters",
      });
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Review Submitted!",
        text2: "Thank you for your feedback",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to Submit",
        text2: "Please try again later",
      });
    }
  };

  const handleCancel = () => {
    if (comment.trim() || rating > 0) {
      Alert.alert(
        "Discard Review?",
        "You have unsaved changes. Are you sure you want to discard this review?",
        [
          { text: "Keep Writing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  const handleFocus = () => {
    Animated.timing(focusAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary],
  });

  return (
    <View className="mt-8">
      <View className="bg-surface rounded-2xl p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-textPrimary font-bold text-lg">Write a Review</Text>
            {facilityName && (
              <Text className="text-accentGray text-sm mt-1">
                Share your experience at {facilityName}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleCancel}
            className="w-8 h-8 rounded-full bg-accentGray items-center justify-center"
          >
            <X size={16} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Rating Section */}
        <View className="mb-6">
          <Text className="text-textPrimary font-semibold text-base mb-3">
            How would you rate this place?
          </Text>
          <View className="flex-row items-center justify-center space-x-2 bg-background rounded-xl p-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="p-2"
              >
                <Star
                  size={32}
                  color={star <= rating ? "#FFCA28" : "#374151"}
                  fill={star <= rating ? "#FFCA28" : "none"}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text className="text-center text-accentGray text-sm mt-2">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View className="mb-6">
          <Text className="text-textPrimary font-semibold text-base mb-3">
            Tell us more about your experience
          </Text>
          <Animated.View
            style={{
              borderColor,
              borderWidth: 2,
            }}
            className="rounded-xl overflow-hidden"
          >
            <TextInput
              className="bg-background text-textPrimary p-4 min-h-[120px] text-base"
              placeholder="What did you like or dislike? How was the service, facilities, cleanliness, etc.?"
              placeholderTextColor={colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </Animated.View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-accentGray text-xs">
              {comment.length}/500 characters
            </Text>
            {comment.length >= 10 && (
              <Text className="text-green-500 text-xs">✓ Good length</Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmitReview}
          disabled={isSubmittingProp || rating === 0}
          className={`w-full rounded-xl p-4 flex-row items-center justify-center ${
            isSubmittingProp || rating === 0
              ? 'bg-accentGray'
              : 'bg-primary'
          }`}
        >
          <Send size={16} color="#FFFFFF" />
          <Text className="text-textPrimary font-semibold ml-2">
            {isSubmittingProp ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
