import colors from '@shared/constants/custom-colors';
import { Calendar, PencilSimple, X } from "phosphor-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface ScheduledChangeCardProps {
  scheduledChange: {
    planId: string;
    planTitle: string;
    planCredits: number;
    nextBillingDate: string;
    nextBillingDateFormatted: string;
    status: string;
    confirmed: boolean;
  };
  onCancel?: () => void;
  onEdit?: () => void;
}

export function ScheduledChangeCard({ 
  scheduledChange, 
  onCancel,
  onEdit
}: ScheduledChangeCardProps) {
  return (
    <View className="mx-4 mt-4 mb-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
      {/* Header with close button */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-1">
            <Calendar size={16} color={colors.accentBlue} />
            <Text className="text-blue-700 text-xs font-semibold uppercase tracking-wide ml-2">
              Schemalagd ändring
            </Text>
          </View>
          <Text className="text-gray-900 text-lg font-bold">
            Byter till {scheduledChange.planTitle}
          </Text>
          <Text className="text-gray-600 text-sm">
            Aktiveras {scheduledChange.nextBillingDateFormatted}
          </Text>
        </View>
        
        {onCancel && (
          <TouchableOpacity
            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            onPress={onCancel}
          >
            <X size={16} color={colors.borderGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info and actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-blue-200">
        <View className="flex-row items-center">
          <View className="bg-blue-100 rounded-lg px-3 py-1">
            <Text className="text-blue-800 text-sm font-semibold">
              {scheduledChange.planCredits} krediter
            </Text>
          </View>
          <View className="bg-orange-100 rounded-lg px-3 py-1 ml-2">
            <Text className="text-orange-800 text-sm font-semibold">
              Väntar
            </Text>
          </View>
        </View>

        {onEdit && (
          <TouchableOpacity
            className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
            onPress={onEdit}
          >
            <PencilSimple size={14} color={colors.borderGray} />
            <Text className="text-gray-700 text-sm font-medium ml-1">
              Ändra
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}