import { ArrowRight } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export const PromoBanner = () => (
  <TouchableOpacity className="bg-surface rounded-2xl overflow-hidden mx-4 mt-6 mb-8 flex-row">
    <View className="flex-3 p-4">
      <Text className="text-xs text-primary font-bold mb-2">BEGRÄNSAD TID</Text>
      <Text className="text-lg font-bold text-textPrimary mb-2">Sommarerbjudande: 20% rabatt på uppgraderingar</Text>
      <Text className="text-sm text-textSecondary mb-4">Uppgradera ditt abonnemang och få 4 extra krediter denna månad</Text>
      <View className="flex-row items-center space-x-2">
        <Text className="text-sm font-semibold text-textPrimary">Läs mer</Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </View>
    </View>
    <Image
      source={{ uri: 'https://images.pexels.com/photos/136404/pexels-photo-136404.jpeg' }}
      className="flex-2"
    />
  </TouchableOpacity>
);
