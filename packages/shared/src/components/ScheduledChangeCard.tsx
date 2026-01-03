import colors from '@shared/constants/custom-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';
import { scheduledChangeService } from '../services/ScheduledChangeService';
import { ScheduledChange } from '../types/membership-scheduling';

interface ScheduledChangeCardProps {
  scheduledChange: ScheduledChange;
  currentPlanTitle: string;
  onCancel?: () => void;
  className?: string;
}

export const ScheduledChangeCard: React.FC<ScheduledChangeCardProps> = ({
  scheduledChange,
  currentPlanTitle,
  onCancel,
  className = ''
}) => {
  const statusColor = scheduledChangeService.getStatusColor(scheduledChange.status);
  const statusMessage = scheduledChangeService.getStatusMessage(scheduledChange.status);
  const timeUntilChange = scheduledChangeService.formatNextBillingDate(scheduledChange.nextBillingDate);
  const { showInfo } = useGlobalFeedback();

  const handleCancel = () => {
    // Note: Consider implementing CustomAlert for confirmation dialogs
    // For now, directly call onCancel
    onCancel?.();
  };

  return (
    <View className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={statusColor} 
          />
          <Text className="ml-2 text-lg font-semibold text-gray-900">
            Plan Change Scheduled
          </Text>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Text 
            className="text-xs font-medium capitalize"
            style={{ color: statusColor }}
          >
            {scheduledChange.status}
          </Text>
        </View>
      </View>

      {/* Change Details */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">Current Plan:</Text>
          <Text className="font-medium text-gray-900">{currentPlanTitle}</Text>
        </View>
        
        <View className="flex-row items-center justify-center my-2">
          <Ionicons name="arrow-down" size={20} color={colors.borderGray} />
        </View>
        
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">Changing To:</Text>
          <Text className="font-medium text-blue-600">{scheduledChange.planTitle}</Text>
        </View>
        
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">New Credits:</Text>
          <Text className="font-medium text-gray-900">{scheduledChange.planCredits}</Text>
        </View>
      </View>

      {/* Timing */}
      <View className="bg-blue-50 rounded-lg p-3 mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-600">Change Date:</Text>
          <Text className="font-medium text-gray-900">
            {scheduledChange.nextBillingDateFormatted}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-gray-600">Time Until:</Text>
          <Text className="font-medium text-blue-600">{timeUntilChange}</Text>
        </View>
      </View>

      {/* Status Message */}
      <Text className="text-sm text-gray-600 text-center mb-4">
        {statusMessage}
      </Text>

      {/* Actions */}
      {scheduledChange.status === 'confirmed' && onCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          className="bg-red-50 border border-red-200 rounded-lg py-3 px-4"
        >
          <Text className="text-red-600 text-center font-medium">
            Cancel Scheduled Change
          </Text>
        </TouchableOpacity>
      )}

      {scheduledChange.status === 'pending' && (
        <View className="bg-amber-50 border border-amber-200 rounded-lg py-3 px-4">
          <Text className="text-amber-800 text-center">
            Your plan change is being processed and will be confirmed shortly.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ScheduledChangeCard;