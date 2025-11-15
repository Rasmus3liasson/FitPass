import { AlertTriangle, CheckCircle, X } from "lucide-react-native";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GymChangeConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changeType: 'remove' | 'replace';
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
  
  const isRemoval = changeType === 'remove';
  const title = isRemoval ? 'Bekräfta borttagning av gym' : 'Bekräfta ersättning av gym';
  const actionText = isRemoval ? 'ta bort' : 'ersätta';
  const buttonText = isRemoval ? 'Bekräfta borttagning' : 'Bekräfta ersättning';
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Gym Information */}
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Gym som påverkas
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-textPrimary font-medium">{gymName}</Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-primary">
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
              <Text className="text-textPrimary font-semibold">{creditsUsed}/{totalCredits}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-textSecondary">Återstående krediter:</Text>
              <Text className="text-textPrimary font-semibold">{totalCredits - creditsUsed}/{totalCredits}</Text>
            </View>
          </View>

          {/* Warning/Information Section */}
          <View className={`rounded-2xl p-5 mb-6 border ${
            hasUsedCredits 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : 'bg-blue-500/5 border-blue-500/20'
          }`}>
            <View className="flex-row items-start">
              {hasUsedCredits ? (
                <AlertTriangle size={24} color="#F59E0B" className="mr-3 mt-1" />
              ) : (
                <CheckCircle size={24} color="#3B82F6" className="mr-3 mt-1" />
              )}
              <View className="flex-1">
                <Text className={`font-semibold text-base mb-2 ${
                  hasUsedCredits ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {hasUsedCredits ? 'Viktigt att veta' : 'Ingen kreditanvändning'}
                </Text>
                <Text className="text-textSecondary text-sm leading-5">
                  {hasUsedCredits ? (
                    `Du har redan använt ${creditsUsed} av ${totalCredits} krediter på ${gymName} denna period. Om du ${actionText}r gymmet kommer dessa krediter att gå förlorade och du får inte tillbaka dem.`
                  ) : (
                    `Du har inte använt några krediter på ${gymName} denna period, så ingen användning går förlorad.`
                  )}
                </Text>
              </View>
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
                    : `${gymName} markeras för ersättning vid nästa faktureringsperiod`
                  }
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
        </ScrollView>

        {/* Action Buttons */}
        <View className="p-6 border-t border-white/5 bg-background">
          <View className="space-y-3">
            <TouchableOpacity
              onPress={onConfirm}
              className={`py-4 px-6 rounded-xl ${
                hasUsedCredits 
                  ? 'bg-amber-600' 
                  : 'bg-primary'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-base">
                {buttonText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onClose}
              className="py-4 px-6 rounded-xl bg-surface border border-white/10"
              activeOpacity={0.7}
            >
              <Text className="text-textPrimary font-medium text-center text-base">
                Avbryt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}