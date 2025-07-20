import {
    ArrowLeft,
    Calendar,
    MessageSquare,
    Star,
    ThumbsUp,
    TrendingUp
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

interface ReviewsModalProps {
  visible: boolean;
  reviews: Review[];
  facilityName?: string;
  averageRating?: number;
  onClose: () => void;
}

export function ReviewsModal({
  visible,
  reviews,
  facilityName,
  averageRating,
  onClose,
}: ReviewsModalProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#8BC34A';
    if (rating >= 3.5) return '#FFC107';
    if (rating >= 3.0) return '#FF9800';
    return '#F44336';
  };

  const getSortedAndFilteredReviews = () => {
    let filtered = reviews;
    
    if (filterRating) {
      filtered = reviews.filter(review => Math.floor(review.rating) === filterRating);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  };

  const sortedReviews = getSortedAndFilteredReviews();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <StatusBar barStyle="light-content" />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
          <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-4 pb-6 bg-surface border-b border-gray-700">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center"
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View className="flex-1 items-center">
                  <Text className="text-white font-bold text-lg" numberOfLines={1}>
                    Reviews
                  </Text>
                  {facilityName && (
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                      {facilityName}
                    </Text>
                  )}
                </View>

                <View className="w-10 h-10" />
              </View>

              {/* Stats */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-2xl mr-2">
                    {averageRating?.toFixed(1) || '0.0'}
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= (averageRating || 0) ? '#FFCA28' : '#ffffff40'}
                        fill={star <= (averageRating || 0) ? '#FFCA28' : 'none'}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-gray-400 text-sm">
                  {reviews.length} reviews
                </Text>
              </View>
            </View>

            {/* Sort and Filter Options */}
            <View className="px-4 py-4 border-b border-gray-700">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  {[
                    { key: 'newest', label: 'Newest', icon: Calendar },
                    { key: 'highest', label: 'Highest Rated', icon: TrendingUp },
                    { key: 'lowest', label: 'Lowest Rated', icon: TrendingUp },
                    { key: 'oldest', label: 'Oldest', icon: Calendar },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setSortBy(option.key as any)}
                      className={`flex-row items-center px-4 py-2 rounded-full ${
                        sortBy === option.key ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <option.icon size={14} color={sortBy === option.key ? '#FFFFFF' : '#A0A0A0'} />
                      <Text className={`ml-2 text-sm font-medium ${
                        sortBy === option.key ? 'text-white' : 'text-gray-400'
                      }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Rating Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setFilterRating(null)}
                    className={`px-3 py-2 rounded-full ${
                      filterRating === null ? 'bg-primary' : 'bg-surface'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      filterRating === null ? 'text-white' : 'text-gray-400'
                    }`}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => setFilterRating(rating)}
                      className={`flex-row items-center px-3 py-2 rounded-full ${
                        filterRating === rating ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Star 
                        size={12} 
                        color={filterRating === rating ? '#FFFFFF' : '#A0A0A0'} 
                        fill={filterRating === rating ? '#FFFFFF' : '#A0A0A0'}
                      />
                      <Text className={`ml-1 text-sm font-medium ${
                        filterRating === rating ? 'text-white' : 'text-gray-400'
                      }`}>
                        {rating}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Reviews List */}
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
              {sortedReviews.length > 0 ? (
                sortedReviews.map((review, index) => (
                  <View key={review.id} className="bg-surface rounded-2xl p-4 mb-3 mt-3">
                    {/* Review Header */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <Image
                          source={{ uri: review.avatar }}
                          className="w-12 h-12 rounded-full"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-white font-semibold text-base">
                            {review.user}
                          </Text>
                          <Text className="text-gray-400 text-sm">
                            {review.date}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Rating */}
                    <View className="flex-row items-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          color={star <= review.rating ? getRatingColor(review.rating) : '#374151'}
                          fill={star <= review.rating ? getRatingColor(review.rating) : 'none'}
                        />
                      ))}
                      <View className={`rounded-full px-2 py-1 ml-3`} style={{
                        backgroundColor: `${getRatingColor(review.rating)}20`
                      }}>
                        <Text className="text-xs font-medium" style={{
                          color: getRatingColor(review.rating)
                        }}>
                          {review.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Review Text */}
                    {review.text && (
                      <Text className="text-gray-300 text-sm leading-relaxed mb-3">
                        {review.text}
                      </Text>
                    )}

                    {/* Review Actions */}
                    <View className="flex-row items-center pt-3 border-t border-gray-700">
                      <TouchableOpacity className="flex-row items-center mr-4">
                        <ThumbsUp size={14} color="#A0A0A0" />
                        <Text className="text-gray-400 text-sm ml-2">Helpful</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center">
                        <MessageSquare size={14} color="#A0A0A0" />
                        <Text className="text-gray-400 text-sm ml-2">Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View className="flex-1 items-center justify-center py-12">
                  <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                    <Star size={24} color="#6366F1" />
                  </View>
                  <Text className="text-white font-semibold text-lg mb-2">
                    No reviews match your filter
                  </Text>
                  <Text className="text-gray-400 text-sm text-center">
                    Try adjusting your filter settings
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
