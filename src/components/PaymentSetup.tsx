import { useAuth } from '@/src/hooks/useAuth';
import { PaymentMethodService } from '@/src/services/PaymentMethodService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PaymentSetupProps {
  onPaymentMethodAdded: (paymentMethodId: string) => void;
  onClose: () => void;
  customerId?: string;
}

interface TestCard {
  name: string;
  number: string;
  description: string;
  outcome: string;
}

const TEST_CARDS: TestCard[] = [
  {
    name: 'Visa Success',
    number: '4242 4242 4242 4242',
    description: 'Fungerar alltid',
    outcome: 'success'
  },
  {
    name: 'Visa Declined',
    number: '4000 0000 0000 0002',
    description: 'Avvisas alltid',
    outcome: 'declined'
  },
  {
    name: 'Mastercard Success',
    number: '5555 5555 5555 4444',
    description: 'Fungerar alltid',
    outcome: 'success'
  },
  {
    name: '3D Secure Required',
    number: '4000 0025 0000 3155',
    description: 'Kräver 3D Secure autentisering',
    outcome: '3d_secure'
  },
  {
    name: 'Insufficient Funds',
    number: '4000 0000 0000 9995',
    description: 'Otillräckliga medel',
    outcome: 'insufficient_funds'
  }
];

export default function PaymentSetup({ onPaymentMethodAdded, onClose, customerId }: PaymentSetupProps) {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null);
  const [customCardNumber, setCustomCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomCard, setShowCustomCard] = useState(false);
  const [actualCustomerId, setActualCustomerId] = useState<string | null>(customerId || null);
  const [isLoadingCustomerId, setIsLoadingCustomerId] = useState(!customerId);

  // Get customer ID if not provided
  useEffect(() => {
    const getCustomerId = async () => {
      if (customerId) {
        setActualCustomerId(customerId);
        setIsLoadingCustomerId(false);
        return;
      }

      if (!user?.id) {
        setIsLoadingCustomerId(false);
        return;
      }

      try {
        const result = await PaymentMethodService.getUserStripeCustomerId(
          user.id, 
          user.email
        );
        if (result.success && result.customerId) {
          setActualCustomerId(result.customerId);
        }
      } catch (error) {
        console.error('Error getting customer ID:', error);
      } finally {
        setIsLoadingCustomerId(false);
      }
    };

    getCustomerId();
  }, [customerId, user?.id]);

  const handleTestCardSelect = async (card: TestCard) => {
    if (!actualCustomerId) {
      Alert.alert('Fel', 'Ingen kund-ID tillgänglig');
      return;
    }

    setSelectedCard(card);
    setIsProcessing(true);

    try {
      // Call backend to create payment method
      const result = await PaymentMethodService.createPaymentMethod({
        customerId: actualCustomerId,
        cardNumber: card.number.replace(/\s/g, ''),
        expMonth: 12,
        expYear: 2028,
        cvc: '123',
        isUserAdded: true // Mark as user-added
      });

      if (result.success && result.paymentMethod) {
        Alert.alert(
          'Testkort tillagt',
          `${card.name} (${card.number}) har lagts till som betalningsmetod.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentMethodAdded(result.paymentMethod!.id);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Fel', result.message || 'Kunde inte lägga till betalningsmetod');
      }
    } catch (error: any) {
      Alert.alert('Fel', `Kunde inte lägga till betalningsmetod: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomCardSubmit = async () => {
    if (!actualCustomerId) {
      Alert.alert('Fel', 'Ingen kund-ID tillgänglig');
      return;
    }

    if (!customCardNumber || customCardNumber.length < 16) {
      Alert.alert('Fel', 'Ange ett giltigt kortnummer');
      return;
    }

    setIsProcessing(true);

    try {
      const [expMonth, expYear] = expiryDate.split('/');
      
      const result = await PaymentMethodService.createPaymentMethod({
        customerId: actualCustomerId,
        cardNumber: customCardNumber.replace(/\s/g, ''),
        expMonth: parseInt(expMonth),
        expYear: parseInt(`20${expYear}`),
        cvc,
        isUserAdded: true // Mark as user-added
      });

      if (result.success && result.paymentMethod) {
        Alert.alert(
          'Kort tillagt',
          `Ditt kort (****${customCardNumber.slice(-4)}) har lagts till.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentMethodAdded(result.paymentMethod!.id);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Fel', result.message || 'Kunde inte lägga till kort');
      }
    } catch (error: any) {
      Alert.alert('Fel', `Kunde inte lägga till kort: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  if (isLoadingCustomerId) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Laddar kunduppgifter...</Text>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Bearbetar betalningsmetod...</Text>
      </View>
    );
  }

  if (!actualCustomerId) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-red-600 text-center">
          Kunde inte ladda kunduppgifter. Försök igen senare.
        </Text>
        <TouchableOpacity 
          onPress={onClose}
          className="mt-4 bg-gray-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Stäng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900">Lägg till betalningsmetod</Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
          >
            <Text className="text-gray-600 text-lg">×</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-blue-800 font-semibold mb-2">🧪 Utvecklingsläge</Text>
          <Text className="text-blue-700 text-sm">
            Du kan använda Stripes testkort för att simulera olika betalningsscenarier. 
            Inga riktiga transaktioner kommer att genomföras.
          </Text>
        </View>

        {!showCustomCard ? (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Välj ett testkort:</Text>
            
            {TEST_CARDS.map((card, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleTestCardSelect(card)}
                className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{card.name}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{card.number}</Text>
                    <Text className="text-gray-500 text-xs mt-1">{card.description}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded text-xs ${
                    card.outcome === 'success' ? 'bg-green-100' :
                    card.outcome === 'declined' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs ${
                      card.outcome === 'success' ? 'text-green-800' :
                      card.outcome === 'declined' ? 'text-red-800' :
                      'text-yellow-800'
                    }`}>
                      {card.outcome === 'success' ? '✓ Lyckas' :
                       card.outcome === 'declined' ? '✗ Avvisas' :
                       card.outcome === '3d_secure' ? '🔒 3DS' :
                       '⚠ Avvisas'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowCustomCard(true)}
              className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 mt-4"
            >
              <Text className="text-indigo-700 font-semibold text-center">
                + Lägg till eget testkort
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowCustomCard(false)}
              className="flex-row items-center mb-4"
            >
              <Text className="text-indigo-600">← Tillbaka till testkort</Text>
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-gray-900 mb-4">Lägg till eget kort:</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Kortnummer</Text>
                <TextInput
                  value={customCardNumber}
                  onChangeText={(text) => setCustomCardNumber(formatCardNumber(text))}
                  placeholder="4242 4242 4242 4242"
                  className="border border-gray-300 rounded-lg p-3 text-base"
                  keyboardType="numeric"
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Utgångsdatum</Text>
                  <TextInput
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                    className="border border-gray-300 rounded-lg p-3 text-base"
                    keyboardType="numeric"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">CVC</Text>
                  <TextInput
                    value={cvc}
                    onChangeText={setCvc}
                    placeholder="123"
                    className="border border-gray-300 rounded-lg p-3 text-base"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCustomCardSubmit}
                className="bg-indigo-600 rounded-lg p-4 mt-6"
              >
                <Text className="text-white font-semibold text-center text-base">
                  Lägg till kort
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
