import { Section } from "@/src/components/Section";
import { Star } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import colors from "../../constants/custom-colors";

interface ReviewData {
  rating: number;
  comment: string;
}

interface AddReviewProps {
  onSubmit: (data: ReviewData) => Promise<void>;
  isSubmitting?: boolean;
  initialRating?: number;
  initialComment?: string;
}

export default function AddReview({
  onSubmit,
  isSubmitting: isSubmittingProp = false,
  initialRating = 0,
  initialComment = "",
}: AddReviewProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  const handleSubmitReview = async () => {
    if (isSubmittingProp) return;

    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Missing Rating",
        text2: "Please select a star rating.",
        position: "bottom",
      });
      return;
    }

    if (!comment.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Comment",
        text2: "Please write a comment before submitting.",
        position: "bottom",
      });
      return;
    }

    try {
      await onSubmit({ rating, comment });

      setRating(0);
      setComment("");

      Toast.show({
        type: "success",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
        position: "bottom",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: "Please try again later.",
        position: "bottom",
      });
    }
  };

  return (
    <>
      <Section title={""}>
        <View className="bg-surface rounded-2xl p-4">
          <Text className="text-white font-bold text-lg mb-4">
            Leave a Review
          </Text>

          <View className="flex-row mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="mr-2"
              >
                <Star
                  size={24}
                  color={star <= rating ? colors.accentYellow : colors.accentGray}
                  fill={star <= rating ? colors.accentYellow : "none"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Text */}
          <TextInput
            className="bg-accentGray text-white rounded-xl p-4 mb-4 min-h-[100px]"
            placeholder="Write your review..."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={comment}
            onChangeText={setComment}
          />

          {/* Submit Button */}
          <TouchableOpacity
            className={`bg-primary rounded-xl p-4 items-center ${
              isSubmittingProp ? "opacity-50" : ""
            }`}
            onPress={handleSubmitReview}
            disabled={isSubmittingProp || rating === 0}
          >
            <Text className="text-white font-bold">
              {isSubmittingProp ? "Submitting..." : "Submit Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </Section>
    </>
  );
}
