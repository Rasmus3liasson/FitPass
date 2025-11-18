import { AddCardModal } from "@/components/AddCardModal";
import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useAddUserCard, useUserCards } from "@/src/hooks/useCards";
import { StatusBar } from "expo-status-bar";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Card utilities
const cardUtils = {
  getType: (number: string) => {
    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    return "visa";
  },
  
  getIcon: (type: string) => {
    const icons = {
      visa: "🇻🇮",
      mastercard: "🇲🇨", 
      amex: "🇦🇪",
      default: "💳"
    };
    return icons[type as keyof typeof icons] || icons.default;
  }
};

// Card component for better reusability
const PaymentCard = ({ card }: { card: any }) => (
  <View className="bg-surface rounded-2xl p-4 mb-4">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-3">
          <Text className="text-2xl">{cardUtils.getIcon(card.card_type)}</Text>
        </View>
        
        <View className="flex-1">
          <Text className="text-textPrimary text-lg font-semibold capitalize">
            {card.card_type} •••• {card.last4}
          </Text>
          <Text className="text-textSecondary text-sm">
            Utgår {card.exp_month}/{card.exp_year}
          </Text>
          {card.name_on_card && (
            <Text className="text-textSecondary text-xs mt-1">
              {card.name_on_card}
            </Text>
          )}
        </View>
      </View>
      
      {card.is_default && (
        <View className="bg-primary/20 px-3 py-1 rounded-full">
          <Text className="text-primary text-xs font-medium">Standard</Text>
        </View>
      )}
    </View>
    
    {card.is_default && (
      <View className="h-1 bg-primary rounded-full mt-3" />
    )}
  </View>
);

// Empty state component
const EmptyState = ({ onAddCard }: { onAddCard: () => void }) => (
  <View className="items-center py-12">
    <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-4">
      <Text className="text-3xl">💳</Text>
    </View>
    <Text className="text-textPrimary text-lg font-semibold mb-2">
      Inga kort sparade
    </Text>
    <Text className="text-textSecondary text-center mb-6 px-4">
      Lägg till ett betalningskort för att hantera dina prenumerationer
    </Text>
    <TouchableOpacity
      className="bg-primary px-6 py-3 rounded-xl"
      onPress={onAddCard}
    >
      <Text className="text-white font-semibold">Lägg till kort</Text>
    </TouchableOpacity>
  </View>
);

export default function PaymentMethodsScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const addUserCard = useAddUserCard();
  const { user } = useAuth();
  const { data: cards, isLoading } = useUserCards(user?.id || "");

  const handleAddCard = async (cardData: {
    name: string;
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  }) => {
    if (!user) return;
    
    try {
      const last4 = cardData.number.slice(-4);
      const cardType = cardUtils.getType(cardData.number);
      
      await addUserCard.mutateAsync({
        userId: user.id,
        cardType,
        last4,
        expMonth: cardData.expMonth,
        expYear: cardData.expYear,
        nameOnCard: cardData.name,
        stripeToken: "tok_sample", // Replace with real token from Stripe
        isDefault: cards?.length === 0, // Make first card default
      });
      
      setAddModalVisible(false);
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView 
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="px-4 py-4">
          <BackButton />
          <View className="mt-4">
            <Text className="text-textPrimary text-2xl font-bold mb-2">
              Betalningsmetoder
            </Text>
            <Text className="text-textSecondary text-base">
              Hantera dina betalningsmetoder och faktureringsinformation
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-4">
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-textSecondary mt-2">Laddar kort...</Text>
            </View>
          ) : cards && cards.length > 0 ? (
            <>
              {/* Cards List */}
              <View className="mt-2">
                {cards.map((card: any) => (
                  <PaymentCard key={card.id} card={card} />
                ))}
              </View>
              
              {/* Add Card Button */}
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 mt-4 flex-row items-center justify-center"
                activeOpacity={0.8}
                onPress={() => setAddModalVisible(true)}
              >
                <Plus size={20} color="#6366F1" />
                <Text className="text-primary font-semibold text-base ml-2">
                  Lägg till nytt kort
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <EmptyState onAddCard={() => setAddModalVisible(true)} />
          )}
        </View>
      </ScrollView>

      <AddCardModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCard}
      />
    </SafeAreaWrapper>
  );
}
