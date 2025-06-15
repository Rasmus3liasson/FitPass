import { ReviewCard } from "@/components/ReviewCard";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  id: string;
  reviews: any[];
}

export function Reviews({ id, reviews }: Props) {
  const router = useRouter();

  return (
    <View className="mt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-bold text-lg">Reviews</Text>
        <TouchableOpacity
          onPress={() => router.push(`/facility/${id}/reviews`)}
        >
          <Text className="text-primary text-sm">See All</Text>
        </TouchableOpacity>
      </View>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          userName={review.user}
          userAvatar={review.avatar}
          rating={review.rating}
          date={review.date}
          text={review.text}
        />
      ))}
    </View>
  );
}
