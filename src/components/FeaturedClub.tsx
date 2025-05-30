import { TouchableOpacity, Text, StyleSheet, Image, View } from 'react-native';
import { Star } from 'lucide-react-native';

interface FeaturedClubProps {
  name: string;
  type: string;
  image: string;
  rating: number;
  distance: string;
  onPress: () => void;
}

export function FeaturedClub({
  name,
  type,
  image,
  rating,
  distance,
  onPress,
}: FeaturedClubProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.typeContainer}>
          <Text style={styles.type}>{type}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.ratingContainer}>
              <Star size={14} color="#FFCA28" fill="#FFCA28" />
              <Text style={styles.rating}>{rating}</Text>
            </View>
            <Text style={styles.distance}>{distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    marginLeft: 16,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 12,
  },
  typeContainer: {
    position: 'absolute',
    top: -32,
    left: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  type: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distance: {
    fontSize: 12,
    color: '#A0A0A0',
  },
});