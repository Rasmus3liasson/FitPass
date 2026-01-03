import colors from '@shared/constants/custom-colors';
import { Calendar, Trophy, Users } from 'phosphor-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { OptimizedImage } from './OptimizedImage';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'custom';
  target_value: number;
  current_progress: number;
  participants_count: number;
  end_date: string;
  reward?: string;
  is_participating: boolean;
  created_by: {
    name: string;
    avatar_url?: string;
  };
}

interface ChallengesModalProps {
  challenges: Challenge[];
  onJoinChallenge: (challengeId: string) => void;
  onLeaveChallenge: (challengeId: string) => void;
  onCreateChallenge: () => void;
}

export const ChallengesSection: React.FC<ChallengesModalProps> = ({
  challenges,
  onJoinChallenge,
  onLeaveChallenge,
  onCreateChallenge,
}) => {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'weekly': return 'bg-blue-500/20 text-blue-400';
      case 'monthly': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-green-500/20 text-green-400';
    }
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const progressPercentage = getProgressPercentage(challenge.current_progress, challenge.target_value);
    const daysLeft = getDaysLeft(challenge.end_date);
    const typeColorClass = getChallengeTypeColor(challenge.type);

    return (
      <View key={challenge.id} className="bg-surface rounded-2xl p-5 mb-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Trophy size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-bold text-lg">{challenge.title}</Text>
              <Text className="text-textSecondary text-sm">{challenge.description}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${typeColorClass}`}>
            <Text className={`text-xs font-semibold capitalize ${typeColorClass.split(' ')[1]}`}>
              {challenge.type}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-textSecondary text-sm">Progress</Text>
            <Text className="text-textPrimary font-semibold">
              {challenge.current_progress}/{challenge.target_value}
            </Text>
          </View>
          <View className="w-full h-3 bg-accentGray rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          <Text className="text-primary text-xs mt-1 font-semibold">
            {progressPercentage.toFixed(0)}% Complete
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Users size={14} color={colors.borderGray} />
            <Text className="text-textSecondary text-sm ml-1">
              {challenge.participants_count} participants
            </Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={14} color={colors.borderGray} />
            <Text className="text-textSecondary text-sm ml-1">
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
            </Text>
          </View>
        </View>

        {/* Reward */}
        {challenge.reward && (
          <View className="bg-yellow-500/10 rounded-xl p-3 mb-4">
            <View className="flex-row items-center">
              <Text className="text-yellow-400 mr-2">🏆</Text>
              <Text className="text-yellow-400 font-semibold text-sm">
                Reward: {challenge.reward}
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {daysLeft > 0 && (
          <TouchableOpacity
            onPress={() => 
              challenge.is_participating 
                ? onLeaveChallenge(challenge.id)
                : onJoinChallenge(challenge.id)
            }
            className={`rounded-xl py-3 items-center ${
              challenge.is_participating 
                ? 'bg-red-500/20 border border-red-500/30' 
                : 'bg-primary'
            }`}
          >
            <Text className={`font-semibold ${
              challenge.is_participating ? 'text-red-400' : 'text-textPrimary'
            }`}>
              {challenge.is_participating ? 'Leave Challenge' : 'Join Challenge'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Creator */}
        <View className="flex-row items-center mt-3 pt-3 border-t border-accentGray">
          <View className="w-6 h-6 rounded-full bg-accentGray overflow-hidden mr-2">
            {challenge.created_by.avatar_url ? (
              <OptimizedImage
                source={{ uri: challenge.created_by.avatar_url }}
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <View className="w-full h-full bg-primary/20 items-center justify-center">
                <Text className="text-primary font-bold text-xs">
                  {challenge.created_by.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-textSecondary text-xs">
            Created by {challenge.created_by.name}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center">
          <Trophy size={24} color={colors.primary} />
          <Text className="text-textPrimary font-bold text-xl ml-2">Challenges</Text>
        </View>
        <TouchableOpacity
          onPress={onCreateChallenge}
          className="bg-primary rounded-full px-4 py-2"
        >
          <Text className="text-textPrimary font-semibold text-sm">Create</Text>
        </TouchableOpacity>
      </View>

      {/* Challenges List */}
      <ScrollView 
        className="px-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {challenges.length > 0 ? (
          challenges.map(renderChallengeCard)
        ) : (
          <View className="bg-surface rounded-2xl p-6 items-center">
            <Trophy size={48} color={colors.borderGray} />
            <Text className="text-textPrimary font-bold text-lg mt-4 mb-2">
              No Active Challenges
            </Text>
            <Text className="text-textSecondary text-center text-sm mb-4">
              Be the first to create a challenge and motivate your friends!
            </Text>
            <TouchableOpacity
              onPress={onCreateChallenge}
              className="bg-primary rounded-xl px-6 py-3"
            >
              <Text className="text-textPrimary font-semibold">Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
