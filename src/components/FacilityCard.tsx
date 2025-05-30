import { TouchableOpacity, Text, StyleSheet, Image, View } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';

interface FacilityCardProps {
  name: string;
  type: string;
  image: string;
  rating: number;
  distance: string;
  openNow: boolean;
  credits?: number;
  onPress: () => void;
  layout?: 'horizontal' | 'grid' | 'list';
}

export function FacilityCard({
  name,
  type,
  image,
  rating,
  distance,
  openNow,
  credits,
  onPress,
  layout = 'horizontal',
}: FacilityCardProps) {
  const getContainerStyle = () => {
    switch (layout) {
      case 'grid':
        return styles.gridContainer;
      case 'list':
        return styles.listContainer;
      default:
        return styles.horizontalContainer;
    }
  };

  const getImageStyle = () => {
    switch (layout) {
      case 'grid':
        return styles.gridImage;
      case 'list':
        return styles.listImage;
      default:
        return styles.horizontalImage;
    }
  };

  const getContentStyle = () => {
    switch (layout) {
      case 'list':
        return styles.listContent;
      default:
        return styles.content;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, getContainerStyle()]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} style={getImageStyle()} />
      
      <View style={getContentStyle()}>
        <View style={styles.header}>
          <Text style={styles.type}>{type}</Text>
          <View style={styles.ratingContainer}>
            <Star size={12} color="#FFCA28" fill="#FFCA28" />
            <Text style={styles.rating}>{rating}</Text>
          </View>
        </View>
        
        <Text style={styles.name}>{name}</Text>
        
        <View style={styles.details}>
          <View style={styles.locationContainer}>
            <MapPin size={12} color="#A0A0A0" />
            <Text style={styles.distance}>{distance}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, openNow ? styles.openDot : styles.closedDot]} />
            <Text style={styles.statusText}>{openNow ? 'Open' : 'Closed'}</Text>
          </View>
        </View>

        {credits !== undefined && (
          <View style={styles.creditContainer}>
            <Text style={styles.creditText}>{credits} credit{credits !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
  },
  horizontalContainer: {
    width: 220,
    marginLeft: 16,
  },
  gridContainer: {
    width: '48%',
  },
  listContainer: {
    flexDirection: 'row',
  },
  horizontalImage: {
    width: '100%',
    height: 120,
  },
  gridImage: {
    width: '100%',
    height: 100,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 12,
  },
  content: {
    padding: 12,
  },
  listContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openDot: {
    backgroundColor: '#4CAF50',
  },
  closedDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  creditContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});