import colors from '@shared/constants/custom-colors';
import { useGlobalFeedback } from '@shared/hooks/useGlobalFeedback';
import { StarIcon, X } from 'phosphor-react-native';
import { useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ReviewData {
  rating: number;
  comment: string;
}

interface AddReviewProps {
  onSubmit: (data: ReviewData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialRating?: number;
  initialComment?: string;
  facilityName?: string;
}

export function AddReview({
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp = false,
  initialRating = 0,
  initialComment = '',
  facilityName,
}: AddReviewProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [focusAnimation] = useState(new Animated.Value(0));
  const { showSuccess, showError } = useGlobalFeedback();

  const handleSubmitReview = async () => {
    if (isSubmittingProp) return;

    if (rating === 0) {
      showError('Betyg krävs', 'Välj ett stjärnbetyg');
      return;
    }

    if (comment.trim().length < 10) {
      showError('Recensionen för kort', 'Skriv minst 10 tecken');
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
      });

      showSuccess('Recension skickad!', 'Tack för din feedback');
    } catch (error) {
      showError('Misslyckades att skicka', 'Försök igen senare');
    }
  };

  const handleCancel = () => {
    if (comment.trim() || rating > 0) {
      // Note: Consider implementing CustomAlert for confirmation dialogs
      // For now, show warning and cancel anyway
      showError('Osparade ändringar', 'Du har osparade ändringar i din recension.');
      onCancel();
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
    <View className="mt-4 mb-4">
      <View className="bg-surface rounded-xl p-4">
        {/* Compact Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-textPrimary font-bold text-base">Din recension</Text>
          <TouchableOpacity
            onPress={handleCancel}
            className="w-7 h-7 rounded-full bg-borderGray/20 items-center justify-center"
          >
            <X size={14} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Compact Rating Section */}
        <View className="mb-4">
          <Text className="text-textSecondary text-xs mb-2 font-medium">Betyg *</Text>
          <View className="flex-row items-center bg-background rounded-lg p-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} className="p-1.5">
                <StarIcon
                  size={28}
                  color={star <= rating ? colors.accentYellow : colors.borderGray}
                  weight={star <= rating ? 'fill' : 'regular'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compact Comment Section */}
        <View className="mb-4">
          <Text className="text-textSecondary text-xs mb-2 font-medium">Din upplevelse *</Text>
          <Animated.View
            style={{
              borderColor,
              borderWidth: 1,
            }}
            className="rounded-lg overflow-hidden"
          >
            <TextInput
              className="bg-background text-textPrimary p-3 min-h-[100px] text-sm"
              placeholder="Dela din upplevelse, vad gillade eller ogillade du?"
              placeholderTextColor={colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              textAlignVertical="top"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </Animated.View>
          <View className="flex-row justify-between items-center mt-1.5">
            <Text className="text-textSecondary text-xs">{comment.length}/500</Text>
            {comment.length >= 10 && (
              <Text className="text-accentGreen text-xs font-medium">✓ Bra längd</Text>
            )}
          </View>
        </View>

        {/* Compact Action Button */}
        <TouchableOpacity
          onPress={handleSubmitReview}
          disabled={isSubmittingProp || rating === 0}
          className={`w-full rounded-lg py-3 flex-row items-center justify-center ${
            isSubmittingProp || rating === 0 ? 'bg-borderGray/30' : 'bg-primary'
          }`}
        >
          <Text className="text-white font-semibold text-sm">
            {isSubmittingProp ? 'Skickar...' : 'Publicera recension'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default AddReview;
