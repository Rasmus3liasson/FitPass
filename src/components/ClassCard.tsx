import { Activity, Clock } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ClassCardProps {
  name: string;
  facility: string;
  image: string;
  time: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  spots: number;
  onPress: () => void;
  compact?: boolean;
}

export function ClassCard({
  name,
  facility,
  image,
  time,
  duration,
  intensity,
  spots,
  onPress,
  compact = false,
}: ClassCardProps) {
  const getIntensityColor = () => {
    switch (intensity) {
      case 'Low':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'High':
        return '#F44336';
      default:
        return '#A0A0A0';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.compactContainer]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {!compact && <Text style={styles.facility}>{facility}</Text>}
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Clock size={12} color="#A0A0A0" />
            <Text style={styles.detailText}>{time}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Activity size={12} color={getIntensityColor()} />
            <Text style={[styles.detailText, { color: getIntensityColor() }]}>{intensity}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.spotsContainer}>
            <Text style={styles.spotsText}>{spots} spots left</Text>
          </View>
          
          {!compact && (
            <TouchableOpacity style={styles.bookButton} onPress={onPress}>
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  compactContainer: {
    width: 180,
  },
  image: {
    width: '100%',
    height: 100,
    opacity: 0.8,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  facility: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
  spotsText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  bookButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366F1',
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});