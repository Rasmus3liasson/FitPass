import { AddCardModal } from "@/components/AddCardModal";
import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useAddUserCard, useUserCards } from "@/src/hooks/useCards";
import { StatusBar } from "expo-status-bar";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentMethodsScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const addUserCard = useAddUserCard();
  const { user } = useAuth();
  const { data: cards, isLoading } = useUserCards(user?.id || "");

  // Card type detection (simple, can be improved)
  const getCardType = (number: string) => {
    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    return "visa";
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case "visa":
        return "🇻🇮";
      case "mastercard":
        return "🇲🇨";
      case "amex":
        return "🇦🇪";
      default:
        return "💳";
    }
  };

  const handleAddCard = async (cardData: {
    name: string;
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  }) => {
    if (!user) return;
    // In production, tokenize with Stripe/etc. Here, just use last4/type.
    const last4 = cardData.number.slice(-4);
    const cardType = getCardType(cardData.number);
    await addUserCard.mutateAsync({
      userId: user.id,
      cardType,
      last4,
      expMonth: cardData.expMonth,
      expYear: cardData.expYear,
      nameOnCard: cardData.name,
      stripeToken: "tok_sample", // Replace with real token from Stripe
      isDefault: false,
    });
    setAddModalVisible(false);
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          <BackButton />
          <Text className="text-textPrimary text-2xl font-bold mt-4 mb-2">
            Payment Methods
          </Text>
          <Text className="text-textSecondary text-base">
            Manage your payment methods and billing information
          </Text>
        </View>

        {/* Cards List */}
        <View className="mt-6 space-y-4">
          {isLoading ? (
            <ActivityIndicator color="#6366F1" />
          ) : cards && cards.length > 0 ? (
            cards.map((card: any) => (
              <View
                key={card.id}
                className="bg-surface rounded-2xl p-4 flex-row items-center justify-between shadow-lg"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: card.is_default ? "#6366F1" : "#22223b",
                }}
              >
                <View className="flex-row items-center space-x-3">
                  <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                    <Text className="text-2xl">
                      {getCardIcon(card.card_type)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-textPrimary text-lg font-semibold capitalize">
                      {card.card_type} •••• {card.last4}
                    </Text>
                    <Text className="text-textSecondary">
                      Expires {card.exp_month}/{card.exp_year}
                    </Text>
                    {card.name_on_card && (
                      <Text className="text-xs text-textPrimary/60 mt-1">
                        {card.name_on_card}
                      </Text>
                    )}
                  </View>
                </View>
                {card.is_default && (
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-sm font-medium">
                      Default
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text className="text-textSecondary text-center mt-8">
              No cards saved yet.
            </Text>
          )}
        </View>

        {/* Add New Card Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-surface rounded-2xl p-4 mt-6 mb-8"
          activeOpacity={0.9}
          onPress={() => setAddModalVisible(true)}
        >
          <Plus size={20} color="#6366F1" />
          <Text className="text-primary font-semibold text-lg ml-2">
            Add New Card
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Card Modal */}
      <AddCardModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCard}
      />
    </SafeAreaWrapper>
  );
}
