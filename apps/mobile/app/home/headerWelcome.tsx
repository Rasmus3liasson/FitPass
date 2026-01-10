import { ROUTES } from "@shared/config/constants";
import colors from "@shared/constants/custom-colors";
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
        <Text className="text-base text-textSecondary">Välkommen tillbaka,</Text>
        <Text className="text-2xl font-bold text-textPrimary">{firstName} {lastName}</Text>
      </View>
      <TouchableOpacity
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary"
        onPress={() => router.push(ROUTES.PROFILE as any)}
      >
        {avatarUrl ? (
          <Avatar
            source={{ uri: avatarUrl }}
            size={50}
            rounded
          />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
              {`${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default HeaderWelcome;
