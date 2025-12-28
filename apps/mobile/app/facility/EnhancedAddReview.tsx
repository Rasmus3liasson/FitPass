import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { Send, Star, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  const { showSuccess, showError } = useGlobalFeedback();

  const handleSubmitReview = async () => {
    if (isSubmittingProp) return;

    if (rating === 0) {
      showError("Betyg krävs", "Välj ett stjärnbetyg");
      return;
    }

    if (comment.trim().length < 10) {
      showError("Recensionen för kort", "Skriv minst 10 tecken");
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
      });

      showSuccess("Recension skickad!", "Tack för din feedback");
    } catch (error) {
      showError("Misslyckades att skicka", "Försök igen senare");
    }
  };

  const handleCancel = () => {
    if (comment.trim() || rating > 0) {
      Alert.alert(
        "Kassera recension?",
        "Du har osparade ändringar. Är du säker på att du vill kassera denna recension?",
        [
          { text: "Fortsätt skriva", style: "cancel" },
          { text: "Kassera", style: "destructive", onPress: onCancel },
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
            <Text className="text-textPrimary font-bold text-lg">
              Skriv en recension
            </Text>
            {facilityName && (
              <Text className="text-textSecondary text-sm mt-1">
                Dela din upplevelse av {facilityName}
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
            Hur skulle du betygsätta denna plats?
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
        </View>

        {/* Comment Section */}
        <View className="mb-6">
          <Text className="text-textPrimary font-semibold text-base mb-3">
            Berätta mer om din upplevelse
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
              placeholder="Vad gillade eller ogillade du? Hur var servicen, faciliteterna, renligheten etc.?"
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
            <Text className="text-textSecondary text-xs">
              {comment.length}/500 tecken
            </Text>
            {comment.length >= 10 && (
              <Text className="text-green-500 text-xs">✓ Bra längd</Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmitReview}
          disabled={isSubmittingProp || rating === 0}
          className={`w-full rounded-xl p-4 flex-row items-center justify-center ${
            isSubmittingProp || rating === 0 ? "bg-accentGray" : "bg-primary"
          }`}
        >
          <Send size={16} color="#FFFFFF" />
          <Text className="text-textPrimary font-semibold ml-2">
            {isSubmittingProp ? "Skickar..." : "Skicka recension"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
