import colors from '@shared/constants/custom-colors';
import { Membership, Subscription } from '../../types';
import { getMembershipStatus } from '../../utils/membershipStatus';
import { Calendar, TrendUp, Lightning } from 'phosphor-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from '../ui/StatusBadge';

interface CurrentMembershipCardProps {
  membership: Membership;
  subscription?: Subscription | null;
  onManage?: () => void;
}

export function CurrentMembershipCard({
  membership,
  subscription,
  onManage,
}: CurrentMembershipCardProps) {
  const creditsRemaining = membership.credits - (membership.credits_used || 0);
  const usagePercentage = Math.round(((membership.credits_used || 0) / membership.credits) * 100);

  return (
    <View className="mt-6">
      {/* Premium Current Plan Card */}
      <TouchableOpacity
        className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl p-6 mb-4"
        onPress={onManage}
        activeOpacity={0.9}
        style={{
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        {/* Status Badge */}
        <View className="absolute top-4 right-4">
          <StatusBadge status={getMembershipStatus(membership)} />
        </View>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
            NUVARANDE PLAN
          </Text>
          <Text className="text-white text-3xl font-black tracking-tight">
            {membership.plan_type}
          </Text>
          <Text className="text-white/70 text-sm font-medium">
            Obegränsad access • Alla faciliteter
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-6 gap-3">
          {/* Credits Card */}
          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <Lightning size={18} color="white" />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Krediter
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">{creditsRemaining}</Text>
            <Text className="text-white/60 text-xs">av {membership.credits} totalt</Text>
          </View>

          {/* Usage Card */}
          <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <View className="flex-row items-center justify-between mb-2">
              <TrendUp size={18} color="white" />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Använt
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">{membership.credits_used || 0}</Text>
            <Text className="text-white/60 text-xs">träningspass</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white/70 text-xs font-semibold tracking-wide">
              MÅNADSFÖRBRUKNING
            </Text>
            <Text className="text-white text-xs font-bold">{usagePercentage}%</Text>
          </View>
          <View className="bg-white/20 rounded-full h-2 overflow-hidden">
            <View
              className="bg-white rounded-full h-full"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </View>
        </View>

        {/* Subscription Info */}
        {subscription && (
          <View className="bg-white/10 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Calendar size={16} color="white" />
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Prenumeration
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white text-sm font-bold capitalize">
                  {subscription.status}
                </Text>
                {subscription.current_period_end && (
                  <Text className="text-white/60 text-xs">
                    Nästa: {new Date(subscription.current_period_end).toLocaleDateString('sv-SE')}
                  </Text>
                )}
              </View>
              <View
                className={`px-2 py-1 rounded-full ${
                  subscription.status === 'active' ? 'bg-green-500/30' : 'bg-yellow-500/30'
                }`}
              >
                <Text className="text-white text-xs font-bold">
                  {subscription.status === 'active' ? '✓' : '⚠'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Hint */}
        <View className="flex-row items-center justify-between">
          <Text className="text-white/80 text-sm font-medium">Tryck för att hantera plan</Text>
          <View className="w-2 h-2 bg-white/60 rounded-full" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
