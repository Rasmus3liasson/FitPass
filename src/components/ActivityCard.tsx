import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock, Calendar } from 'lucide-react-native';

interface ActivityCardProps {
  facilityName: string;
  activityType: string;
  date: string;
  time: string;
  duration: string;
  credits: number;
}

export function ActivityCard({
  facilityName,
  activityType,
  date,
  time,
  duration,
  credits,
}: ActivityCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftBorder} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.activityType}>{activityType}</Text>
            <Text style={styles.facilityName}>{facilityName}</Text>
          </View>
          
          <View style={styles.creditContainer}>
            <Text style={styles.creditText}>{credits} credit{credits !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#A0A0A0" />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Clock size={14} color="#A0A0A0" />
            <Text style={styles.detailText}>{time}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={14} color="#A0A0A0" />
            <Text style={styles.detailText}>{duration}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  leftBorder: {
    width: 4,
    backgroundColor: '#6366F1',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  facilityName: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  creditContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
  },
  creditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#A0A0A0',
  },
});