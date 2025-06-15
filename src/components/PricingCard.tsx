import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CircleCheck as CheckCircle, Star } from 'lucide-react-native';

interface PriceWithProduct {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
  product: {
    id: string;
    name: string;
    description?: string;
    metadata: Record<string, string>;
  };
}

interface PricingCardProps {
  price: PriceWithProduct;
  onSelect: (priceId: string) => void;
  isSelected?: boolean;
  isLoading?: boolean;
  formatPrice: (amount: number, currency: string) => string;
  getIntervalText: (interval: string) => string;
}

export function PricingCard({
  price,
  onSelect,
  isSelected = false,
  isLoading = false,
  formatPrice,
  getIntervalText,
}: PricingCardProps) {
  const isPopular = price.product.metadata.popular === 'true';
  const features = price.product.metadata.features 
    ? price.product.metadata.features.split(',').map(f => f.trim())
    : [];

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}

      <View style={[styles.card, isPopular && styles.popularCard]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.planName}>{price.product.name}</Text>
          {price.product.description && (
            <Text style={styles.description}>{price.product.description}</Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>
            {formatPrice(price.unit_amount, price.currency)}
          </Text>
          <Text style={styles.interval}>
            {getIntervalText(price.recurring.interval)}
          </Text>
        </View>

        {/* Features */}
        {features.length > 0 && (
          <View style={styles.featuresSection}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.selectButton,
            isPopular && styles.popularButton,
            isSelected && styles.selectedButton,
          ]}
          onPress={() => onSelect(price.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.selectButtonText, isPopular && styles.popularButtonText]}>
              {isSelected ? 'Selected' : 'Select Plan'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  selectedContainer: {
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularCard: {
    borderColor: '#6366F1',
    backgroundColor: '#1A1A2E',
  },
  header: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
  },
  priceSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  interval: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  popularButton: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  selectedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popularButtonText: {
    color: '#FFFFFF',
  },
});