import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CreditCard, Calendar, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MembershipCardProps {
  type: string;
  startDate: string;
  credits: number;
  creditsUsed: number;
  onPress: () => void;
}

export function MembershipCard({
  type,
  startDate,
  credits,
  creditsUsed,
  onPress,
}: MembershipCardProps) {
  const width = Dimensions.get('window').width - 32; // Card width minus margins
  const progressWidth = (creditsUsed / credits) * (width - 32); // Progress width minus padding
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#6366F1', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTypeContainer}>
              <CreditCard size={16} color="#FFFFFF" />
              <Text style={styles.cardType}>{type} Membership</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.memberSince}>Member since {startDate}</Text>
            <Text style={styles.creditsTitle}>Monthly Credits</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Used: {creditsUsed}</Text>
                <Text style={styles.progressLabel}>Total: {credits}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.renewalInfo}>
              <Calendar size={14} color="#FFFFFF" />
              <Text style={styles.renewalText}>Renews July 10, 2025</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  gradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardInfo: {
    marginBottom: 24,
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renewalText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});