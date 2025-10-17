import { PaymentMethodService } from '@/src/services/PaymentMethodService';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface PaymentMethodDetailsModalProps {
  paymentMethodId: string;
  isVisible: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface PaymentMethodDetails {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
    country: string;
  };
  billing_details?: {
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    email?: string;
    name?: string;
    phone?: string;
  };
  created: number;
  metadata?: Record<string, string>;
}

export default function PaymentMethodDetailsModal({
  paymentMethodId,
  isVisible,
  onClose,
  onUpdated,
}: PaymentMethodDetailsModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields for editing
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (isVisible && paymentMethodId) {
      loadPaymentMethodDetails();
    }
  }, [isVisible, paymentMethodId]);

  const loadPaymentMethodDetails = async () => {
    try {
      setLoading(true);
      const result = await PaymentMethodService.getPaymentMethodDetails(paymentMethodId);
      
      if (result.success && result.paymentMethod) {
        const pm = result.paymentMethod;
        setPaymentMethod(pm);
        
        // Populate form fields
        setName(pm.billing_details?.name || '');
        setEmail(pm.billing_details?.email || '');
        setPhone(pm.billing_details?.phone || '');
        setAddressLine1(pm.billing_details?.address?.line1 || '');
        setAddressLine2(pm.billing_details?.address?.line2 || '');
        setCity(pm.billing_details?.address?.city || '');
        setState(pm.billing_details?.address?.state || '');
        setPostalCode(pm.billing_details?.address?.postal_code || '');
        setCountry(pm.billing_details?.address?.country || 'SE');
      } else {
        Alert.alert('Fel', 'Kunde inte ladda betalningsmetoddetaljer');
      }
    } catch (error) {
      console.error('Error loading payment method details:', error);
      Alert.alert('Fel', 'Ett fel uppstod när betalningsmetoddetaljer skulle laddas');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      const billingDetails = {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: {
          line1: addressLine1.trim() || undefined,
          line2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          country: country.trim() || 'SE',
        },
      };

      const result = await PaymentMethodService.updatePaymentMethodBillingDetails(
        paymentMethodId,
        billingDetails
      );

      if (result.success) {
        Alert.alert('Framgång', 'Betalningsmetod uppdaterad', [
          {
            text: 'OK',
            onPress: () => {
              setIsEditing(false);
              onUpdated();
              loadPaymentMethodDetails(); // Reload to show updated data
            },
          },
        ]);
      } else {
        Alert.alert('Fel', result.error || 'Kunde inte uppdatera betalningsmetod');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      Alert.alert('Fel', 'Ett fel uppstod när betalningsmetod skulle uppdateras');
    } finally {
      setUpdating(false);
    }
  };

  const getCardBrandEmoji = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💎';
      case 'discover': return '🔍';
      default: return '💳';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFundingText = (funding: string) => {
    switch (funding) {
      case 'credit': return 'Kreditkort';
      case 'debit': return 'Betalkort';
      case 'prepaid': return 'Förbetalt kort';
      case 'unknown': return 'Okänd typ';
      default: return funding;
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16 bg-surface">
          <TouchableOpacity 
            onPress={onClose} 
            className="w-10 h-10 rounded-full bg-accentGray items-center justify-center"
          >
            <Text className="text-textPrimary text-lg">✕</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Text className="text-primary">💳</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">Kortdetaljer</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className="bg-primary/20 px-3 py-2 rounded-full"
            disabled={loading}
          >
            <Text className="text-primary font-semibold">
              {isEditing ? 'Avbryt' : 'Redigera'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center bg-background">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">Laddar kortdetaljer...</Text>
          </View>
        ) : paymentMethod ? (
          <ScrollView className="flex-1 bg-background">
            <View className="p-6">
              {/* Card Information */}
              {paymentMethod.card && (
                <View className="bg-gradient-to-r from-primary to-accentPurple rounded-2xl p-6 mb-6 shadow-2xl">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-3xl">
                      {getCardBrandEmoji(paymentMethod.card.brand)}
                    </Text>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-textPrimary text-sm font-semibold">
                        {getFundingText(paymentMethod.card.funding)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-textPrimary text-3xl font-mono mb-6 tracking-wider">
                    •••• •••• •••• {paymentMethod.card.last4}
                  </Text>
                  
                  <View className="flex-row justify-between items-end">
                    <View>
                      <Text className="text-textPrimary/70 text-sm mb-1">Utgår</Text>
                      <Text className="text-textPrimary text-xl font-bold">
                        {paymentMethod.card.exp_month.toString().padStart(2, '0')}/
                        {paymentMethod.card.exp_year.toString().slice(-2)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-textPrimary/70 text-sm mb-1">Märke</Text>
                      <Text className="text-textPrimary text-xl font-bold capitalize">
                        {paymentMethod.card.brand}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-textPrimary/70 text-sm mb-1">Land</Text>
                      <Text className="text-textPrimary text-xl font-bold">
                        {paymentMethod.card.country || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Card Metadata */}
              <View className="bg-surface rounded-2xl p-6 mb-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">ℹ️</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">Kortinformation</Text>
                </View>
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary">Skapad</Text>
                    <Text className="text-textPrimary font-semibold">{formatDate(paymentMethod.created)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                    <Text className="text-textSecondary">Typ</Text>
                    <Text className="text-textPrimary font-semibold capitalize">{paymentMethod.type}</Text>
                  </View>
                  <View className="flex-row justify-between items-center py-3">
                    <Text className="text-textSecondary">ID</Text>
                    <Text className="text-textPrimary font-mono text-sm bg-accentGray/30 px-2 py-1 rounded">
                      {paymentMethod.id.slice(0, 20)}...
                    </Text>
                  </View>
                </View>
              </View>

              {/* Billing Details */}
              <View className="bg-surface rounded-2xl p-6 border border-accentGray/30">
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                      <Text className="text-primary">📋</Text>
                    </View>
                    <Text className="text-lg font-bold text-textPrimary">Faktureringsuppgifter</Text>
                  </View>
                  {!isEditing && (
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="bg-primary/20 px-4 py-2 rounded-full"
                    >
                      <Text className="text-primary font-semibold">Redigera</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditing ? (
                  <View className="space-y-6">
                    {/* Name */}
                    <View>
                      <Text className="text-textPrimary font-semibold mb-3">Namn</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Ditt fullständiga namn"
                        placeholderTextColor="#A0A0A0"
                        className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                      />
                    </View>

                    {/* Email */}
                    <View>
                      <Text className="text-textPrimary font-semibold mb-3">E-post</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="din@email.com"
                        placeholderTextColor="#A0A0A0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                      />
                    </View>

                    {/* Phone */}
                    <View>
                      <Text className="text-textPrimary font-semibold mb-3">Telefon</Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+46 70 123 45 67"
                        placeholderTextColor="#A0A0A0"
                        keyboardType="phone-pad"
                        className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                      />
                    </View>

                    {/* Address Line 1 */}
                    <View>
                      <Text className="text-textPrimary font-semibold mb-3">Adress</Text>
                      <TextInput
                        value={addressLine1}
                        onChangeText={setAddressLine1}
                        placeholder="Gatuadress"
                        placeholderTextColor="#A0A0A0"
                        className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                      />
                    </View>

                    {/* Address Line 2 */}
                    <View>
                      <TextInput
                        value={addressLine2}
                        onChangeText={setAddressLine2}
                        placeholder="Lägenhetsnummer, etc. (valfritt)"
                        placeholderTextColor="#A0A0A0"
                        className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                      />
                    </View>

                    {/* City and Postal Code */}
                    <View className="flex-row space-x-4">
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold mb-3">Stad</Text>
                        <TextInput
                          value={city}
                          onChangeText={setCity}
                          placeholder="Stockholm"
                          placeholderTextColor="#A0A0A0"
                          className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold mb-3">Postnummer</Text>
                        <TextInput
                          value={postalCode}
                          onChangeText={setPostalCode}
                          placeholder="123 45"
                          placeholderTextColor="#A0A0A0"
                          className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                        />
                      </View>
                    </View>

                    {/* State and Country */}
                    <View className="flex-row space-x-4">
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold mb-3">Län</Text>
                        <TextInput
                          value={state}
                          onChangeText={setState}
                          placeholder="Stockholm"
                          placeholderTextColor="#A0A0A0"
                          className="bg-accentGray/30 border border-accentGray/20 rounded-xl p-4 text-textPrimary"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-textSecondary font-medium mb-2">Land</Text>
                        <TextInput
                          value={country}
                          onChangeText={setCountry}
                          placeholder="SE"
                          className="border border-accentGray rounded-lg p-3 text-textSecondary"
                        />
                      </View>
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                      onPress={handleUpdate}
                      disabled={updating}
                      className="bg-indigo-600 rounded-lg p-4 mt-4"
                    >
                      {updating ? (
                        <View className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="white" />
                          <Text className="text-textPrimary font-semibold ml-2">Uppdaterar...</Text>
                        </View>
                      ) : (
                        <Text className="text-textPrimary font-semibold text-center">
                          Spara ändringar
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {/* Display Mode */}
                    {name && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Namn</Text>
                        <Text className="text-textSecondary flex-1 text-right">{name}</Text>
                      </View>
                    )}
                    {email && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">E-post</Text>
                        <Text className="text-textSecondary flex-1 text-right">{email}</Text>
                      </View>
                    )}
                    {phone && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Telefon</Text>
                        <Text className="text-textSecondary flex-1 text-right">{phone}</Text>
                      </View>
                    )}
                    {addressLine1 && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Adress</Text>
                        <View className="flex-1 items-end">
                          <Text className="text-textSecondary text-right">{addressLine1}</Text>
                          {addressLine2 && (
                            <Text className="text-textSecondary text-right">{addressLine2}</Text>
                          )}
                        </View>
                      </View>
                    )}
                    {(city || postalCode) && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Ort</Text>
                        <Text className="text-textSecondary flex-1 text-right">
                          {[postalCode, city].filter(Boolean).join(' ')}
                        </Text>
                      </View>
                    )}
                    {state && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Län</Text>
                        <Text className="text-textSecondary flex-1 text-right">{state}</Text>
                      </View>
                    )}
                    {country && (
                      <View className="flex-row justify-between">
                        <Text className="text-textSecondary">Land</Text>
                        <Text className="text-textSecondary flex-1 text-right">{country}</Text>
                      </View>
                    )}
                    
                    {!name && !email && !phone && !addressLine1 && !city && !postalCode && !state && (
                      <Text className="text-textSecondary text-center py-4">
                        Inga faktureringsuppgifter sparade
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Security Note */}
              <View className="bg-blue-50 p-4 rounded-lg mt-6">
                <Text className="text-blue-800 font-semibold mb-2">🔒 Säkerhetsnotering</Text>
                <Text className="text-blue-700 text-sm">
                  Kortuppgifter som kortnummer och CVC-kod kan inte visas eller ändras av säkerhetsskäl. 
                  För att uppdatera kortet måste du lägga till ett nytt kort och ta bort det gamla.
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-textSecondary">Kunde inte ladda kortdetaljer</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
