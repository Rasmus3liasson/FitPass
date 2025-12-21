import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { PageHeader } from "@shared/components/PageHeader";
import { SimpleSearchBar } from "@shared/components/search/SimpleSearchBar";
import { ROUTES } from "@shared/config/constants";
import colors from "@/src/constants/custom-colors";
import {
  useDeleteConversation,
  useUserConversations,
} from "@shared/hooks/useMessaging";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { router } from "expo-router";
import { MessageCircle, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
  } = useUserConversations();
  const deleteConversationMutation = useDeleteConversation();

  const filteredConversations = conversations.filter((conv) => {
    const friend = conv.participants[0]?.profile;
    const friendName = friend?.display_name || friend?.first_name || "";

    return friendName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: sv,
      });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversationMutation.mutate(conversationId);
  };

  const renderRightActions = (conversationId: string) => {
    return (
      <TouchableOpacity
        className="bg-accentRed justify-center items-center px-6 mb-3 rounded-2xl ml-3"
        onPress={() => handleDeleteConversation(conversationId)}
        activeOpacity={0.7}
      >
        <Trash2 size={24} color="#fff" />
        <Text className="text-textPrimary font-semibold mt-1">Ta bort</Text>
      </TouchableOpacity>
    );
  };

  const renderConversation = ({
    item,
  }: {
    item: (typeof conversations)[0];
  }) => {
    const friend = item.participants[0]?.profile;
    if (!friend) return null;

    const friendName = friend.display_name || friend.first_name || "Användare";
    const initials = getInitials(friendName);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <TouchableOpacity
          className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center"
          onPress={() => router.push(ROUTES.MESSAGES_ID(item.id) as any)}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          <View className="relative">
            {friend.avatar_url ? (
              <Image
                source={{ uri: friend.avatar_url }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
                <Text className="text-textPrimary text-lg font-bold">
                  {initials}
                </Text>
              </View>
            )}
          </View>

          {/* Message Info */}
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-textPrimary font-semibold text-base">
                {friendName}
              </Text>
              {item.last_message_at && (
                <Text className="text-textSecondary text-xs">
                  {getTimeAgo(item.last_message_at)}
                </Text>
              )}
            </View>
            <View className="flex-row items-center justify-between">
              <Text
                className={`flex-1 text-sm ${
                  item.unread_count > 0
                    ? "text-textPrimary font-medium"
                    : "text-textSecondary"
                }`}
                numberOfLines={1}
              >
                {item.last_message_text || "Inget meddelande än"}
              </Text>
              {item.unread_count > 0 && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center ml-2">
                  <Text className="text-textPrimary text-xs font-bold">
                    {item.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-24 h-24 rounded-full bg-surface items-center justify-center mb-6">
        <MessageCircle size={48} color={colors.textSecondary} />
      </View>
      <Text className="text-textPrimary text-xl font-bold mb-2 text-center">
        Inga meddelanden än
      </Text>
      <Text className="text-textSecondary text-center">
        Börja chatta med dina vänner för att se dina konversationer här
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-textSecondary mt-4">
            Laddar konversationer...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isError) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 bg-background items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-2">
            Fel vid laddning
          </Text>
          <Text className="text-textSecondary text-center">
            {error?.message || "Okänt fel"}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaWrapper>
        <View className="flex-1 bg-background">
          <PageHeader
            title="Meddelanden"
            subtitle="Dina meddelande konversationer"
          />

          <SimpleSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={() => {}}
            placeholder="Sök konversationer..."
          />

          {/* Conversations List */}
          <FlatList
            data={filteredConversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </SafeAreaWrapper>
    </GestureHandlerRootView>
  );
}
