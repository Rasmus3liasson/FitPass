import { LinearGradient } from "expo-linear-gradient";
import { Calendar, ChevronRight, CreditCard, Zap } from "lucide-react-native";
import { useState } from "react";
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from 'react-native-toast-message';
import { useAuth } from "../hooks/useAuth";
import SubscriptionSyncService from "../services/SubscriptionSyncService";

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  default_price: {
    id: string;
    unit_amount: number | null;
    currency: string;
  } | null;
}

interface MembershipCardProps {
  type: string;
  startDate: string;
  credits: number;
  creditsUsed: number;
  onPress: () => void;
  onMembershipChanged?: () => void;
}

export function MembershipCard({
  type,
  startDate,
  credits,
  creditsUsed,
  onPress,
  onMembershipChanged,
}: MembershipCardProps) {
  const width = Dimensions.get("window").width - 32;
  const progressWidth = (creditsUsed / credits) * (width - 32);
  const { user } = useAuth();
  
  const [showStripeProducts, setShowStripeProducts] = useState(false);
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const loadStripeProducts = async () => {
    setIsLoading(true);
    try {
      const result = await SubscriptionSyncService.getStripeProducts();
      if (result.success) {
        setStripeProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading Stripe products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeMembership = async (stripePriceId: string, productName: string) => {
    if (!user?.id) return;

    setIsCreatingSubscription(true);
    try {
      const result = await SubscriptionSyncService.createSubscriptionMembership(
        user.id,
        stripePriceId
      );

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Medlemskap Uppgraderat!',
          text2: `Du har nu ${productName} medlemskap.`,
          position: 'top',
          visibilityTime: 4000,
        });
        setShowStripeProducts(false);
        onMembershipChanged?.();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Uppgraderingen misslyckades',
          text2: result.error || 'Okänt fel uppstod.',
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Fel vid uppgradering',
        text2: error.message || 'Kunde inte uppgradera medlemskap.',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleChangePress = () => {
    setShowStripeProducts(true);
    loadStripeProducts();
  };

  return (
    <>
      <TouchableOpacity
        className="rounded-2xl overflow-hidden mt-4"
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#6366F1", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl"
        >
          <View className="p-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center space-x-2">
                <CreditCard size={16} color="#FFFFFF" />
                <Text className="text-textPrimary font-bold text-base">
                  {type} Membership
                </Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </View>

            {/* Info */}
            <View className="mb-6">
              <Text className="text-xs text-textPrimary/70 mb-3">
                Member since {startDate}
              </Text>
              <Text className="text-sm font-semibold text-textPrimary mb-2">
                Monthly Credits
              </Text>

              <View className="mt-2">
                <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{ width: progressWidth }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-textPrimary/70">
                    Used: {creditsUsed}
                  </Text>
                  <Text className="text-xs text-textPrimary/70">Total: {credits}</Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View className="border-t border-white/20 pt-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center space-x-2">
                  <Calendar size={14} color="#FFFFFF" />
                  <Text className="text-xs text-textPrimary">Renews July 10, 2025</Text>
                </View>
                <TouchableOpacity
                  onPress={handleChangePress}
                  className="flex-row items-center space-x-1"
                >
                  <Zap size={14} color="#FFFFFF" />
                  <Text className="text-xs text-textPrimary font-medium">Ändra</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stripe Products Modal */}
      <Modal
        visible={showStripeProducts}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background">
          <View className="flex-row justify-between items-center p-4 border-b border-border">
            <Text className="text-textPrimary text-lg font-bold">Välj Medlemskap</Text>
            <TouchableOpacity
              onPress={() => setShowStripeProducts(false)}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
            >
              <Text className="text-textPrimary font-medium">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {isLoading ? (
              <Text className="text-textPrimary text-center mt-8">Laddar produkter...</Text>
            ) : (
              stripeProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => product.default_price && handleUpgradeMembership(product.default_price.id, product.name)}
                  disabled={isCreatingSubscription}
                  className={`mb-4 p-4 rounded-xl border-2 ${
                    isCreatingSubscription ? 'bg-gray-600/50 border-gray-600' : 'bg-surface border-primary'
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-textPrimary font-bold text-lg flex-1">
                      {product.name}
                    </Text>
                    <Text className="text-primary font-bold text-lg ml-2">
                      {product.default_price?.unit_amount ? 
                        `${(product.default_price.unit_amount / 100).toFixed(0)} SEK` : 
                        'Gratis'
                      }
                    </Text>
                  </View>
                  
                  {product.description && (
                    <Text className="text-textSecondary text-sm mb-3">
                      {product.description}
                    </Text>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-textSecondary text-xs">
                      Per månad
                    </Text>
                    <View className="flex-row items-center space-x-1">
                      <Zap size={12} color="#6366F1" />
                      <Text className="text-primary text-xs font-medium">
                        {isCreatingSubscription ? 'Skapar...' : 'Välj Plan'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {stripeProducts.length === 0 && !isLoading && (
              <View className="text-center mt-8">
                <Text className="text-textSecondary">Inga produkter tillgängliga</Text>
                <Text className="text-textSecondary text-sm mt-2">
                  Synka produkter från Stripe först
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
