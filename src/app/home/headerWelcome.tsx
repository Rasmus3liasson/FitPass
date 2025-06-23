import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "react-native-elements";

interface HeaderWelcomeProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export const HeaderWelcome = ({ firstName, lastName, avatarUrl }: HeaderWelcomeProps) => {
  const router = useRouter();
  
  return (
    <View className="flex-row justify-between items-center px-4 py-4">
      <View>
        <Text className="text-base text-textSecondary">Welcome back,</Text>
        <Text className="text-2xl font-bold text-textPrimary">{firstName} {lastName}</Text>
      </View>
      <TouchableOpacity
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary"
        onPress={() => router.push("./profile")}
      >
        {avatarUrl ? (
          <Avatar
            source={{ uri: avatarUrl }}
            size={50}
            rounded
          />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {`${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
