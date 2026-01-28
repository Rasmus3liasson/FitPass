import colors from '@fitpass/shared/constants/custom-colors';
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { DAYS, DAY_LABELS } from '../constants/days';

type Props = {
  value: any;
  onChange: (val: any) => void;
};

export const OpenHoursInput = ({ value, onChange }: Props) => {
  const openHours = typeof value === 'string' ? JSON.parse(value) : value || {};

  const handleTimeChange = (day: string, which: 'open' | 'close', time: string) => {
    const [open, close] = (openHours[day] || '08:00-20:00').split('-');
    const newVal = {
      ...openHours,
      [day]: which === 'open' ? `${time}-${close}` : `${open}-${time}`,
    };
    onChange(newVal);
  };

  return (
    <View className="mb-4">
      <Text className="text-textPrimary font-semibold mb-2">Öppettider</Text>

      {DAYS.map((day) => {
        const [open, close] = (openHours[day] || '08:00-20:00').split('-');

        return (
          <View key={day} className="flex-row items-center mb-2">
            <Text className="w-24 text-textPrimary">{DAY_LABELS[day]}</Text>

            <TextInput
              className="bg-surface text-textPrimary rounded-lg px-2 py-1 border border-borderGray w-20 mr-2"
              value={open}
              onChangeText={(t) => handleTimeChange(day, 'open', t)}
              placeholder="08:00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />

            <Text className="text-textPrimary mx-1">-</Text>

            <TextInput
              className="bg-surface text-textPrimary rounded-lg px-2 py-1 border border-borderGray w-20"
              value={close}
              onChangeText={(t) => handleTimeChange(day, 'close', t)}
              placeholder="20:00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        );
      })}
    </View>
  );
};
