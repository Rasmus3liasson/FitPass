import { useAuth } from "@/src/hooks/useAuth";
import { useAddReview } from "@/src/hooks/useClubs";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

interface Props {
  reviews: Review[];
  id: string;

  onToggleAddReview: () => void;
}

export function Reviews({ reviews, id, onToggleAddReview }: Props) {
  const [visibleReviews, setVisibleReviews] = useState(5);
  const router = useRouter();
  const auth = useAuth();
  const addReview = useAddReview();

  const handleLoadMore = () => {
    setVisibleReviews((prev) => prev + 5);
  };

  const handleSubmitReview = async (data: {
    rating: number;
    comment: string;
  }) => {
    if (!auth.user?.id) {
      router.push("/login/");
      return;
    }

    try {
      await addReview.mutateAsync({
        userId: auth.user.id,
        clubId: id,
        rating: data.rating,
        comment: data.comment,
      });
      onToggleAddReview();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color={star <= rating ? "#FFD700" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };

  return (
    <View className="mt-8 px-2">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-2xl font-semibold">Reviews</Text>
        <TouchableOpacity
          className="flex-row items-center space-x-1"
          onPress={onToggleAddReview}
        >
          <Ionicons name="create-outline" size={20} color="#6366F1" />
          <Text 
            onPress={onToggleAddReview} 
            className="text-indigo-600 text-base font-medium"
          >
            Add Review
          </Text>
        </TouchableOpacity>
      </View>

      {reviews.slice(0, visibleReviews).map((review) => (
        <View
          key={review.id}
          className="bg-surface rounded-xl p-4 mb-3 shadow-md shadow-gray-300"
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center space-x-3">
              <Image
                source={{
                  uri: review.avatar || "https://via.placeholder.com/40",
                }}
                className="w-10 h-10 rounded-full"
              />
              <View className="pl-4">
                <Text className="text-base font-semibold mb-0.5 text-white">
                  {review.user}
                </Text>
                <Text className="text-sm text-white">{review.date}</Text>
              </View>
            </View>
            {renderStars(review.rating)}
          </View>
          <Text className="text-base text-white leading-6">{review.text}</Text>
        </View>
      ))}

      {reviews.length > visibleReviews && (
        <TouchableOpacity
          className="flex-row justify-center items-center space-x-2 py-3 mt-2"
          onPress={handleLoadMore}
        >
          <Text className="text-indigo-600 text-base font-medium">
            Load More Reviews
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6366F1" />
        </TouchableOpacity>
      )}
    </View>
  );
}
