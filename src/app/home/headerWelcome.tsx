import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-elements';

export const HeaderWelcome = () => {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center px-4 py-4">
      <View>
        <Text className="text-base text-textSecondary">Welcome back,</Text>
        <Text className="text-2xl font-bold text-textPrimary">Rasmus</Text>
      </View>
      <TouchableOpacity
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary"
        onPress={() => router.push('./profile')}
      >
        <Avatar
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
          size={50}
          rounded
        />
      </TouchableOpacity>
    </View>
  );
};
