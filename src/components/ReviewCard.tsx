import { Star } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar
          source={{ uri: userAvatar }}
          size={40}
          rounded
          containerStyle={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars()}</View>
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.reviewText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  date: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#E5E5E5",
  },
});
