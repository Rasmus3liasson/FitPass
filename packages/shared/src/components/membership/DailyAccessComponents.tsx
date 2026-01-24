import colors from '@shared/constants/custom-colors';
import { Calendar, MapPin, Plus, X } from 'phosphor-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SelectedGym } from '../../hooks/useDailyAccess';

interface SelectedGymCardProps {
  gym: SelectedGym;
  onRemove: (gymId: string) => void;
  isPending?: boolean;
  canRemove?: boolean;
}

export function SelectedGymCard({
  gym,
  onRemove,
  isPending = false,
  canRemove = true,
}: SelectedGymCardProps) {
  return (
    <View className="bg-surface rounded-2xl p-4 border border-surface/20 mb-3">
      <View className="flex-row items-center">
        {/* Gym Image */}
        <View className="w-16 h-16 rounded-xl overflow-hidden mr-4">
          {gym.gym_image ? (
            <Image
              source={{ uri: gym.gym_image }}
              className="w-full h-full"
              style={{ backgroundColor: '#f3f4f6' }}
            />
          ) : (
            <View className="w-full h-full bg-primary/10 items-center justify-center">
              <MapPin size={20} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Gym Info */}
        <View className="flex-1 mr-3">
          <Text className="text-textPrimary font-semibold text-base mb-1">{gym.gym_name}</Text>

          {/* Status Badge */}
          <View className="flex-row items-center">
            <View
              className={`px-2 py-1 rounded-full mr-2 ${
                isPending
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-green-500/10 border border-green-500/20'
              }`}
            >
              <Text
                className={`text-xs font-medium ${isPending ? 'text-amber-600' : 'text-green-600'}`}
              >
                {isPending ? 'Nästa period' : 'Aktiv'}
              </Text>
            </View>

            {isPending && (
              <View className="flex-row items-center">
                <Calendar size={12} color="#d97706" />
                <Text className="text-textSecondary text-xs ml-1">
                  Träder i kraft nästa faktureringsperiod
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove Button */}
        {canRemove && (
          <TouchableOpacity
            onPress={() => onRemove(gym.gym_id)}
            className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100"
          >
            <X size={16} color={colors.accentRed} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface AddGymSlotProps {
  onPress: () => void;
  disabled?: boolean;
  currentSlots: number;
  maxSlots: number;
}

export function AddGymSlot({ onPress, disabled = false, currentSlots, maxSlots }: AddGymSlotProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`bg-surface rounded-2xl p-4 border-2 border-dashed items-center justify-center mb-3 ${
        disabled ? 'border-gray-200 bg-gray-50' : 'border-primary/30 bg-primary/5'
      }`}
      style={{ minHeight: 80 }}
    >
      <View className="items-center">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
            disabled ? 'bg-gray-200' : 'bg-primary/10'
          }`}
        >
          <Plus size={20} color={disabled ? 'colors.borderGray' : 'colors.primary'} />
        </View>

        <Text className={`font-medium text-sm ${disabled ? 'text-gray-400' : 'text-textPrimary'}`}>
          {disabled
            ? `Max ${maxSlots} gym (${currentSlots}/${maxSlots})`
            : `Lägg till gym (${currentSlots}/${maxSlots})`}
        </Text>

        {!disabled && (
          <Text className="text-textSecondary text-xs text-center mt-1">
            Tryck för att välja ett gym
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface DailyAccessStatusProps {
  isActive: boolean;
  nextCycleDate: string;
  currentSlots: number;
  maxSlots: number;
}

export function DailyAccessStatus({
  isActive,
  nextCycleDate,
  currentSlots,
  maxSlots,
}: DailyAccessStatusProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-textPrimary font-bold text-lg">Daily Access Premium</Text>
          <Text className="text-textSecondary text-sm">
            Obegränsad tillgång till dina valda gym
          </Text>
        </View>

        <View
          className={`px-3 py-1.5 rounded-full ${
            isActive
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-gray-500/10 border border-gray-500/20'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-gray-600'}`}
          >
            {isActive ? 'Aktiv' : 'Inaktiv'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-textSecondary text-xs mb-1">Valda gym</Text>
          <Text className="text-textPrimary font-semibold">
            {currentSlots} av {maxSlots} platser
          </Text>
        </View>

        <View>
          <Text className="text-textSecondary text-xs mb-1">Nästa faktureringsperiod</Text>
          <Text className="text-textPrimary font-semibold text-right">
            {formatDate(nextCycleDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}
