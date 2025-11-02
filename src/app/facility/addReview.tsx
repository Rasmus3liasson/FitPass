import { Section } from "@/src/components/Section";
import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import { Star } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const { showSuccess, showError } = useGlobalFeedback();

  const handleSubmitReview = async () => {
    if (isSubmittingProp) return;

    if (rating === 0) {
      showError("Missing Rating", "Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      showError("Missing Comment", "Please write a comment before submitting.");
      return;
    }

    try {
      await onSubmit({ rating, comment });

      setRating(0);
      setComment("");

      showSuccess("Review Submitted", "Thank you for your feedback!");
    } catch (error) {
      showError("Submission Failed", "Please try again later.");
    }
  };

  return (
    <>
      <Section title={""}>
        <View className="bg-surface rounded-2xl p-4">
          <Text className="text-textPrimary font-bold text-lg mb-4">
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
            className="bg-accentGray text-textPrimary rounded-xl p-4 mb-4 min-h-[100px]"
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
            <Text className="text-textPrimary font-bold">
              {isSubmittingProp ? "Submitting..." : "Submit Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </Section>
    </>
  );
}
