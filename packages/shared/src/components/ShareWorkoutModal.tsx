import colors from '@shared/constants/custom-colors';
import { Clock, MapPin, Send, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';
import { BaseModal } from './BaseModal';
import { OptimizedImage } from './OptimizedImage';

interface ShareWorkoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  workoutData?: {
    type: string;
    facility_name: string;
    duration: number;
    facility_image?: string;
  };
  onShare: (data: {
    caption: string;
    visibility: 'public' | 'friends' | 'private';
    includeLocation: boolean;
    tagFriends: string[];
  }) => void;
}

export const ShareWorkoutModal: React.FC<ShareWorkoutModalProps> = ({
  isVisible,
  onClose,
  workoutData,
  onShare,
}) => {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [includeLocation, setIncludeLocation] = useState(true);
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const { showInfo } = useGlobalFeedback();

  const handleShare = () => {
    if (!workoutData) return;

    onShare({
      caption,
      visibility,
      includeLocation,
      tagFriends: taggedFriends,
    });

    // Reset form
    setCaption('');
    setVisibility('friends');
    setIncludeLocation(true);
    setTaggedFriends([]);
    onClose();
  };

  const visibilityOptions = [
    { key: 'public', label: 'Public', desc: 'Everyone can see' },
    { key: 'friends', label: 'Friends', desc: 'Only your friends' },
    { key: 'private', label: 'Private', desc: 'Just for you' },
  ];

  return (
    <BaseModal
      visible={isVisible}
      onClose={onClose}
      title="Share Workout"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Workout Summary */}
        {workoutData && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-3">
                <Text className="text-primary text-lg">💪</Text>
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-bold text-lg">{workoutData.type}</Text>
                <View className="flex-row items-center space-x-4 mt-1">
                  <View className="flex-row items-center">
                    <MapPin size={12} color={colors.borderGray} />
                    <Text className="text-textSecondary text-sm ml-1">{workoutData.facility_name}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={12} color={colors.borderGray} />
                    <Text className="text-textSecondary text-sm ml-1">{workoutData.duration} min</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {workoutData.facility_image && (
              <View className="rounded-lg overflow-hidden">
                <OptimizedImage
                  source={{ uri: workoutData.facility_image }}
                  style={{ width: '100%', height: 120 }}
                  className="bg-accentGray"
                />
              </View>
            )}
          </View>
        )}

        {/* Caption Input */}
        <View className="mb-4">
          <Text className="text-textPrimary font-semibold mb-2">Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="How was your workout? Share your thoughts..."
            placeholderTextColor={colors.borderGray}
            multiline
            className="bg-surface rounded-xl p-4 text-textPrimary min-h-[100px]"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        {/* Visibility Settings */}
        <View className="mb-4">
          <Text className="text-textPrimary font-semibold mb-3">Who can see this?</Text>
          {visibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setVisibility(option.key as any)}
              className={`flex-row items-center p-4 rounded-xl mb-2 ${
                visibility === option.key ? 'bg-primary/20 border border-primary' : 'bg-surface'
              }`}
            >
              <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                visibility === option.key ? 'bg-primary border-primary' : 'border-accentGray'
              }`}>
                {visibility === option.key && (
                  <View className="w-full h-full rounded-full bg-white" style={{ transform: [{ scale: 0.4 }] }} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-medium">{option.label}</Text>
                <Text className="text-textSecondary text-sm">{option.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Options */}
        <View className="mb-6">
          <Text className="text-textPrimary font-semibold mb-3">Options</Text>
          
          <TouchableOpacity
            onPress={() => setIncludeLocation(!includeLocation)}
            className="flex-row items-center justify-between p-4 bg-surface rounded-xl mb-3"
          >
            <View className="flex-row items-center">
              <MapPin size={20} color={colors.borderGray} />
              <Text className="text-textPrimary ml-3">Include location</Text>
            </View>
            <View className={`w-12 h-6 rounded-full ${includeLocation ? 'bg-primary' : 'bg-accentGray'}`}>
              <View className={`w-5 h-5 bg-white rounded-full mt-0.5 ${includeLocation ? 'ml-6' : 'ml-0.5'}`} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => showInfo('Coming Soon', 'Friend tagging feature will be available soon!')}
            className="flex-row items-center justify-between p-4 bg-surface rounded-xl"
          >
            <View className="flex-row items-center">
              <Users size={20} color={colors.borderGray} />
              <Text className="text-textPrimary ml-3">Tag friends</Text>
            </View>
            <Text className="text-textSecondary">0 tagged</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 pb-4">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 bg-accentGray rounded-xl py-4 items-center"
          >
            <Text className="text-textPrimary font-semibold">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 bg-primary rounded-xl py-4 items-center flex-row justify-center"
          >
            <Send size={16} color="white" />
            <Text className="text-textPrimary font-semibold ml-2">Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BaseModal>
  );
};
