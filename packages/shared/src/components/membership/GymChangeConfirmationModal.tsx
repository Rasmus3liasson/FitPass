import colors from '@shared/constants/custom-colors';
import { X } from "phosphor-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeableModal } from "../SwipeableModal";

interface GymChangeConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changeType: "remove" | "replace";
  gymName: string;
  creditsUsed: number;
  totalCredits: number;
  hasUsedCredits: boolean;
}

export function GymChangeConfirmationModal({
  visible,
  onClose,
  onConfirm,
  changeType,
  gymName,
  creditsUsed,
  totalCredits,
  hasUsedCredits,
}: GymChangeConfirmationModalProps) {
  const isRemoval = changeType === "remove";
  const title = isRemoval
    ? "Bekräfta borttagning av gym"
    : "Bekräfta ersättning av gym";
  const actionText = isRemoval ? "ta bort" : "ersätta";
  const buttonText = isRemoval ? "Bekräfta borttagning" : "Bekräfta ersättning";

  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      maxHeight="90%"
      showScrollIndicator={false}
      enableSwipe={true}
      animationType="slide"
      backgroundColor="bg-background"
      scrollViewProps={{ className: "flex-1" }}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-white/5">
          <View className="flex-1">
            <Text className="text-xl font-bold text-textPrimary">{title}</Text>
            <Text className="text-sm text-textSecondary mt-1">
              Granska din förfrågan innan du fortsätter
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="p-2 rounded-full bg-surface border border-white/10"
            activeOpacity={0.7}
          >
            <X size={20} color={colors.borderGray} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-6">
          {/* Gym Information */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Gym som påverkas
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-textPrimary font-medium">
                {gymName}
              </Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-textPrimary">
                  {totalCredits} krediter/månad
                </Text>
              </View>
            </View>
          </View>

          {/* Credits Usage Information */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Kreditanvändning denna period
            </Text>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-textSecondary">Använda krediter:</Text>
              <Text className="text-textPrimary font-semibold">
                {creditsUsed}/{totalCredits}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-textSecondary">Återstående krediter:</Text>
              <Text className="text-textPrimary font-semibold">
                {totalCredits - creditsUsed}/{totalCredits}
              </Text>
            </View>
          </View>

          {/* Action Information */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Vad händer härnäst?
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="w-2 h-2 bg-primary rounded-full mt-2 mr-3" />
                <Text className="text-textSecondary text-sm flex-1">
                  {isRemoval
                    ? `${gymName} markeras för borttagning vid nästa faktureringsperiod`
                    : `${gymName} markeras för ersättning vid nästa faktureringsperiod`}
                </Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-2 h-2 bg-primary rounded-full mt-2 mr-3" />
                <Text className="text-textSecondary text-sm flex-1">
                  Du behåller åtkomst till gymmet tills nästa faktureringsperiod
                </Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-2 h-2 bg-primary rounded-full mt-2 mr-3" />
                <Text className="text-textSecondary text-sm flex-1">
                  Ändringar träder i kraft vid nästa betalning
                </Text>
              </View>
              {!isRemoval && (
                <View className="flex-row items-start">
                  <View className="w-2 h-2 bg-primary rounded-full mt-2 mr-3" />
                  <Text className="text-textSecondary text-sm flex-1">
                    Du kommer att dirigeras för att välja ett ersättningsgym
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="p-6 pt-4 bg-background border-t border-white/5">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-surface border border-white/10 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-textSecondary font-semibold text-base">
                Avbryt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 rounded-2xl py-4 items-center justify-center ${
                hasUsedCredits
                  ? "bg-amber-500/20 border border-amber-500/30"
                  : "bg-primary border border-primary/30"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold text-base ${
                  hasUsedCredits ? "text-amber-500" : "text-white"
                }`}
              >
                {buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SwipeableModal>
  );
}
