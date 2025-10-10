import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { useAuth } from '@/src/hooks/useAuth';
import { getClubs } from '@/src/lib/integrations/supabase/queries/clubQueries';
import { PaymentMethodService } from '@/src/services/PaymentMethodService';
import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

export default function DebugScreen() {
  const [clubsData, setClubsData] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const testClubsData = async () => {
    setLoading(true);
    try {
      const clubs = await getClubs();
      setClubsData(clubs);
    } catch (error) {
      console.error('❌ Error loading clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await PaymentMethodService.getPaymentMethodsForUser(user.id, user.email);
      setPaymentMethods(result.paymentMethods || []);
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${user.id}/sync-payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setPaymentMethods(result.paymentMethods || []);
      } else {
        console.error('Sync failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error syncing payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testClubsData();
  }, []);

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1 bg-background p-4">
        <Text className="text-textPrimary text-xl font-bold mb-4">Debug Screen</Text>
        
        <View className="mb-6">
          <Text className="text-textPrimary text-lg font-bold mb-2">Clubs Data</Text>
          <Button title="Reload Clubs" onPress={testClubsData} disabled={loading} />
          <Text className="text-textSecondary mt-2">
            Total: {clubsData.length} | 
            With Coords: {clubsData.filter(c => c.latitude && c.longitude).length}
          </Text>
          {clubsData.slice(0, 3).map((club, index) => (
            <View key={index} className="bg-surface p-3 rounded-lg mt-2">
              <Text className="text-textPrimary font-bold">{club.name}</Text>
              <Text className="text-textSecondary">
                Lat: {club.latitude || 'null'} | Lng: {club.longitude || 'null'}
              </Text>
              <Text className="text-textSecondary">
                Area: {club.area} | Type: {club.type}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <Text className="text-textPrimary text-lg font-bold mb-2">Payment Methods</Text>
          <Button title="Test Payment Methods" onPress={testPaymentMethods} disabled={loading || !user} />
          <Button title="Force Sync Payment Methods" onPress={syncPaymentMethods} disabled={loading || !user} />
          <Text className="text-textSecondary mt-2">
            Count: {paymentMethods.length}
          </Text>
          {paymentMethods.map((pm, index) => (
            <View key={index} className="bg-surface p-3 rounded-lg mt-2">
              <Text className="text-textPrimary font-bold">
                {pm.card?.brand} •••• {pm.card?.last4}
              </Text>
              <Text className="text-textSecondary">
                Default: {pm.isDefault?.toString() || 'undefined'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
