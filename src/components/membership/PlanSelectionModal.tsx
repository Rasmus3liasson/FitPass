import { Membership, MembershipPlan } from "@/types";
import { formatNextBillingDate } from "@/utils/time";
import { Calendar, Check, Clock, CreditCard, Info, Star, X, Zap } from "lucide-react-native";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PlanSelectionModalProps {
  visible: boolean;
  selectedPlan: MembershipPlan | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  hasExistingMembership?: boolean;
  currentMembership?: Membership | null;
}

export function PlanSelectionModal({
  visible,
  selectedPlan,
  onClose,
  onConfirm,
  isLoading = false,
  hasExistingMembership = false,
  currentMembership = null,
}: PlanSelectionModalProps) {
  if (!selectedPlan) return null;

  // Environment detection
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  
  console.log('🔍 Modal Environment check:', {
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
    isProduction,
    hasActiveSubscription
  });
  
  // Check if user has an active subscription that would be scheduled for change
  const hasActiveSubscription = currentMembership?.stripe_subscription_id;
  const willBeScheduled = isProduction && hasActiveSubscription;
  
  // Get next billing date for scheduling information
  const nextBillingDate = currentMembership?.next_cycle_date 
    ? formatNextBillingDate(currentMembership.next_cycle_date)
    : null;

  const getPlanIcon = (planTitle: string) => {
    if (
      planTitle.toLowerCase().includes("premium") ||
      planTitle.toLowerCase().includes("pro")
    ) {
      return <Star size={32} color="#FFD700" fill="#FFD700" />;
    }
    return <Zap size={32} color="#6366F1" />;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: "90%",
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="bg-background rounded-3xl overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-6 relative">
              <TouchableOpacity
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full items-center justify-center"
                onPress={onClose}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>

              <View className="items-center mt-2">
               {/*  <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                  {getPlanIcon(selectedPlan.title)}
                </View> */}
                <Text className="text-white text-2xl font-black mb-2">
                  {selectedPlan.title}
                </Text>
                <Text className="text-white/80 text-center mb-4">
                  {selectedPlan.description}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Plan Details */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-1">
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide mb-1">
                      Månadskostnad
                    </Text>
                    <Text className="text-textPrimary text-3xl font-black">
                      {selectedPlan.price > 0
                        ? `${selectedPlan.price} kr`
                        : "Gratis"}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide mb-1">
                      Krediter
                    </Text>
                    <View className="flex-row items-center">
                      <Zap size={20} color="#6366F1" />
                      <Text className="text-textPrimary text-3xl font-black ml-2">
                        {selectedPlan.credits}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Features */}
                <View className="bg-surface rounded-2xl p-4">
                  <Text className="text-textPrimary font-bold mb-3">
                    Vad ingår:
                  </Text>
                  {selectedPlan.features?.map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Check size={16} color="#10B981" />
                      <Text className="text-textSecondary text-sm ml-3 flex-1">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Information for existing membership */}
              {hasExistingMembership && (
                <View className={`${willBeScheduled ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-4 mb-6`}>
                  <View className="flex-row items-start">
                    {willBeScheduled ? (
                      <Calendar size={20} color="#3b82f6" />
                    ) : (
                      <Info size={20} color="#f59e0b" />
                    )}
                    <View className="ml-3 flex-1">
                      <Text className={`${willBeScheduled ? 'text-blue-800' : 'text-orange-800'} font-semibold mb-1`}>
                        {willBeScheduled ? 'Schemalagd ändring' : 'Ändra medlemskap'}
                      </Text>
                      <Text className={`${willBeScheduled ? 'text-blue-700' : 'text-orange-700'} text-sm mb-2`}>
                        {willBeScheduled
                          ? `Din plan ändras automatiskt vid nästa faktureringsperiod${nextBillingDate ? ` den ${nextBillingDate}` : ''}.`
                          : 'Din nuvarande plan kommer att uppdateras. Nya villkor träder i kraft omedelbart.'
                        }
                      </Text>
                      {willBeScheduled && nextBillingDate && (
                        <View className="flex-row items-center mt-2">
                          <Clock size={16} color="#3b82f6" />
                          <Text className="text-blue-600 text-xs font-medium ml-2">
                            Aktiveras: {nextBillingDate}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-primary rounded-2xl py-4 px-6"
                  onPress={onConfirm}
                  disabled={isLoading}
                  style={{
                    shadowColor: "#6366F1",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CreditCard size={20} color="#ffffff" />
                        <Text className="text-white font-bold text-base ml-2">
                          {hasExistingMembership
                            ? (willBeScheduled ? "Schemalägg ändring" : "Uppdatera plan")
                            : "Välj denna plan"}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
