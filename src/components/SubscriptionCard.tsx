import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CreditCard, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { SubscriptionWithDetails } from '@/types/stripe';

interface SubscriptionCardProps {
  subscription: SubscriptionWithDetails | null;
  onManage?: () => void;
  onUpgrade?: () => void;
  formatPrice: (amount: number, currency: string) => string;
  formatDate: (timestamp: number) => string;
}

export function SubscriptionCard({
  subscription,
  onManage,
  onUpgrade,
  formatPrice,
  formatDate,
}: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <View style={styles.container}>
        <View style={styles.noSubscriptionCard}>
          <AlertCircle size={48} color="#6366F1" />
          <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionText}>
            Subscribe to a plan to access premium features
          </Text>
          {onUpgrade && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>View Plans</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const price = subscription.items[0]?.price;
  const isActive = subscription.status === 'active';
  const willCancel = subscription.cancel_at_period_end;

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return willCancel ? '#F59E0B' : '#10B981';
      case 'past_due':
        return '#F59E0B';
      case 'canceled':
      case 'incomplete':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    if (willCancel) return 'Canceling at period end';
    switch (subscription.status) {
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'incomplete':
        return 'Incomplete';
      default:
        return subscription.status;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={onManage}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isActive ? ['#6366F1', '#8B5CF6'] : ['#6B7280', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CreditCard size={20} color="#FFFFFF" />
              <Text style={styles.planName}>
                {price?.product?.name || 'Subscription'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>
              {price ? formatPrice(price.unit_amount, price.currency) : 'N/A'}
            </Text>
            <Text style={styles.interval}>
              {price?.recurring?.interval === 'month' ? 'per month' : 'per year'}
            </Text>
          </View>

          {/* Billing Info */}
          <View style={styles.billingInfo}>
            <View style={styles.billingRow}>
              <Calendar size={16} color="#FFFFFF" />
              <Text style={styles.billingText}>
                Current period ends {formatDate(subscription.current_period_end)}
              </Text>
            </View>
            
            {willCancel && (
              <View style={styles.warningRow}>
                <AlertCircle size={16} color="#FCD34D" />
                <Text style={styles.warningText}>
                  Subscription will not renew
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onManage && (
              <TouchableOpacity style={styles.manageButton} onPress={onManage}>
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceSection: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  interval: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  billingInfo: {
    marginBottom: 16,
  },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#FCD34D',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noSubscriptionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});