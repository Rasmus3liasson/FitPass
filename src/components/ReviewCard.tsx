import { Star } from "lucide-react-native";
import { Text, View } from "react-native";
import { Avatar } from "react-native-elements/dist/avatar/Avatar";

interface ReviewCardProps {
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  text: string;
}

export function ReviewCard({
  userName,
  userAvatar,
  rating,
  date,
  text,
}: ReviewCardProps) {
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color="#FFCA28"
          fill={i < rating ? "#FFCA28" : "none"}
        />
      );
    }
    return stars;
  };

  return (
    <View className="bg-zinc-900 rounded-xl p-4 mb-3">
      <View className="flex-row mb-3">
        <Avatar
          source={{ uri: userAvatar }}
          size={40}
          rounded
          containerStyle={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        <View className="flex-1 justify-center">
          <Text className="text-base font-semibold text-white mb-1">{userName}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-0.5">{renderStars()}</View>
            <Text className="text-xs text-gray-400">{date}</Text>
          </View>
        </View>
      </View>
      <Text className="text-sm leading-5 text-zinc-200">{text}</Text>
    </View>
  );
}
