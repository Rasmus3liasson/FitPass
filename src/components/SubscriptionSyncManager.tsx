import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import SubscriptionSyncService from '../services/SubscriptionSyncService';
import { Button } from './Button';

interface SubscriptionSyncManagerProps {
  onSyncComplete?: () => void;
}

export const SubscriptionSyncManager: React.FC<SubscriptionSyncManagerProps> = ({ 
  onSyncComplete 
}) => {
  const {
    syncSubscriptions,
    isSyncing,
    syncError,
    membership,
    isLoadingMembership,
    membershipError,
    refreshMembership
  } = useSubscriptionManager();

  // New states for comprehensive sync
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isCompletingPayments, setIsCompletingPayments] = useState(false);
  const [incompleteCount, setIncompleteCount] = useState(0);

  const handleSync = async () => {
    try {
      const result = await syncSubscriptions();
      
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Sync Completed!',
          text2: `${result.data?.created || 0} created, ${result.data?.updated || 0} updated`,
          position: 'top',
          visibilityTime: 4000,
        });

        // Visa detaljer om fel om det finns några
        if (result.data?.errors && result.data.errors.length > 0) {
          Alert.alert(
            'Sync Completed with Warnings',
            `Some subscriptions had errors: ${result.data.errors.length} failed`,
            [{ text: 'OK' }]
          );
        }

        onSyncComplete?.();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: error.message || 'Unable to sync subscriptions',
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  // New comprehensive sync method
  const handleComprehensiveSync = async () => {
    setIsSyncingAll(true);
    try {
      const result = await SubscriptionSyncService.syncAllSubscriptions();
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: '🎉 Comprehensive Sync Complete!',
          text2: result.message || 'All subscriptions synced successfully',
          position: 'top',
          visibilityTime: 4000,
        });

        refreshMembership();
        onSyncComplete?.();
      } else {
        throw new Error(result.error || 'Comprehensive sync failed');
      }
    } catch (error: any) {
      console.error('Comprehensive sync error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Comprehensive Sync Failed',
        text2: error.message || 'Unable to sync all subscriptions',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const checkIncompleteSubscriptions = async () => {
    try {
      const result = await SubscriptionSyncService.getIncompleteSubscriptions();
      if (result.success) {
        setIncompleteCount(result.data?.length || 0);
      }
    } catch (error) {
      console.error('Error checking incomplete subscriptions:', error);
    }
  };

  const handleCompleteAllPayments = async () => {
    setIsCompletingPayments(true);
    try {
      const incompleteResult = await SubscriptionSyncService.getIncompleteSubscriptions();
      
      if (incompleteResult.success && incompleteResult.data) {
        let completed = 0;
        let failed = 0;

        for (const sub of incompleteResult.data) {
          try {
            const result = await SubscriptionSyncService.completeSubscriptionPayment(
              sub.stripe_subscription_id
            );
            if (result.success) {
              completed++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }
        }

        Toast.show({
          type: completed > 0 ? 'success' : 'error',
          text1: `Payments Processed`,
          text2: `${completed} completed, ${failed} failed`,
          position: 'top',
          visibilityTime: 4000,
        });

        if (completed > 0) {
          refreshMembership();
          onSyncComplete?.();
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Payment Completion Failed',
        text2: error.message || 'Could not complete payments',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsCompletingPayments(false);
    }
  };

  // Check incomplete subscriptions on component mount
  React.useEffect(() => {
    checkIncompleteSubscriptions();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'trialing':
        return 'text-blue-500';
      case 'past_due':
        return 'text-yellow-500';
      case 'canceled':
      case 'unpaid':
        return 'text-red-500';
      default:
        return 'text-accentGray';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'trialing':
        return 'Prova på';
      case 'past_due':
        return 'Förfallen';
      case 'canceled':
        return 'Avbruten';
      case 'unpaid':
        return 'Obetald';
      default:
        return status || 'Okänd';
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <View className="bg-surface rounded-2xl p-6 mb-6">
        <Text className="text-textPrimary text-xl font-bold mb-4">
          Prenumerations Sync
        </Text>
        
        <Text className="text-textSecondary text-base mb-4">
          Synkronisera prenumerationer från Stripe till din lokala databas.
        </Text>

        <Button
          title={isSyncing ? "Synkar..." : "Synka Prenumerationer"}
          onPress={handleSync}
          disabled={isSyncing}
          loading={isSyncing}
        />

        {/* New comprehensive sync buttons */}
        <View className="flex-row space-x-3 mt-3">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${isSyncingAll ? 'bg-accentGray' : 'bg-purple-600'} flex-row items-center justify-center`}
            onPress={handleComprehensiveSync}
            disabled={isSyncingAll}
          >
            <Text className="text-textPrimary font-medium text-sm">
              {isSyncingAll ? 'Synkar Allt...' : '🎯 Comprehensive Sync'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${isCompletingPayments ? 'bg-accentGray' : 'bg-green-600'} flex-row items-center justify-center`}
            onPress={handleCompleteAllPayments}
            disabled={isCompletingPayments}
          >
            <Text className="text-textPrimary font-medium text-sm">
              {isCompletingPayments ? 'Processing...' : `💳 Complete Payments${incompleteCount > 0 ? ` (${incompleteCount})` : ''}`}
            </Text>
          </TouchableOpacity>
        </View>

        {syncError && (
          <View className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
            <Text className="text-red-400 text-sm">
              Fel vid synkning: {syncError.message}
            </Text>
          </View>
        )}
      </View>

      {/* Användarens nuvarande medlemskap */}
      <View className="bg-surface rounded-2xl p-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-textPrimary text-xl font-bold">
            Mitt Medlemskap
          </Text>
          
          <TouchableOpacity
            onPress={() => refreshMembership()}
            disabled={isLoadingMembership}
            className="px-3 py-1 bg-primary/20 rounded-md"
          >
            <Text className="text-primary text-sm">
              {isLoadingMembership ? 'Laddar...' : 'Uppdatera'}
            </Text>
          </TouchableOpacity>
        </View>

        {membershipError && (
          <View className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 mb-4">
            <Text className="text-red-400 text-sm">
              Fel vid hämtning: {membershipError.message}
            </Text>
          </View>
        )}

        {isLoadingMembership ? (
          <View className="py-8">
            <Text className="text-textSecondary text-center">Laddar medlemskap...</Text>
          </View>
        ) : !membership ? (
          <View className="py-8">
            <Text className="text-textSecondary text-center">
              Inget aktivt medlemskap hittades
            </Text>
            <Text className="text-textSecondary text-center text-sm mt-2">
              Prova att synka prenumerationer först
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {/* Plan info */}
            <View className="p-4 bg-background/50 rounded-lg">
              <Text className="text-textPrimary font-semibold text-lg mb-2">
                {membership.plan_type}
              </Text>
              {membership.membership_plan && (
                <Text className="text-textSecondary mb-2">
                  {membership.membership_plan.description}
                </Text>
              )}
              <Text className="text-primary font-medium">
                {membership.credits} krediter ({membership.credits - membership.credits_used} kvar)
              </Text>
            </View>

            {/* Status och datum */}
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-textSecondary text-sm mb-1">Status</Text>
                <Text className={`font-medium ${getStatusColor(membership.stripe_status)}`}>
                  {getStatusText(membership.stripe_status)}
                </Text>
              </View>
              
              <View className="flex-1 ml-2">
                <Text className="text-textSecondary text-sm mb-1">Aktiv till</Text>
                <Text className="text-textPrimary font-medium">
                  {formatDate(membership.end_date)}
                </Text>
              </View>
            </View>

            {/* Stripe info */}
            {membership.stripe_subscription_id && (
              <View className="pt-4 border-t border-border">
                <Text className="text-textSecondary text-xs mb-1">Stripe Subscription ID</Text>
                <Text className="text-textPrimary text-xs font-mono">
                  {membership.stripe_subscription_id}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SubscriptionSyncManager;
