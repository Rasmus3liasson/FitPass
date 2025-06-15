import { Star } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const [isSubmitting, setIsSubmitting] = useState(isSubmittingProp);

  // You may want to handle submit logic here or pass it as a prop
  const handleSubmitReview = async () => {
    if (isSubmitting || rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="mt-6 bg-surface rounded-2xl p-4">
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
              color={star <= rating ? "#FFCA28" : "#4B4B4B"}
              fill={star <= rating ? "#FFCA28" : "none"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Review Text */}
      <TextInput
        className="bg-[#2A2A2A] text-white rounded-xl p-4 mb-4 min-h-[100px]"
        placeholder="Write your review..."
        placeholderTextColor="#A0A0A0"
        multiline
        value={comment}
        onChangeText={setComment}
      />

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-primary rounded-xl p-4 items-center ${
          isSubmitting ? "opacity-50" : ""
        }`}
        onPress={handleSubmitReview}
        disabled={isSubmitting || rating === 0}
      >
        <Text className="text-white font-bold">
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}