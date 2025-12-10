import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import colors from "@/src/constants/custom-colors";
import { useAuth } from "@/src/hooks/useAuth";
import {
  useConversationParticipant,
  useMarkConversationAsRead,
  useMessages,
  useSendMessage,
  useSubscribeToMessages,
} from "@/src/hooks/useMessaging";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Smile } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const { friendId: conversationId } = useLocalSearchParams<{
    friendId: string;
  }>();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useMessages(conversationId);
  const { data: participant } = useConversationParticipant(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkConversationAsRead();

  useEffect(() => {
    if (!conversationId) return;

    // Mark as read when opening conversation
    markAsReadMutation.mutate(conversationId);

    // Subscribe to real-time messages
    const channel = useSubscribeToMessages(conversationId, (newMessage) => {
      queryClient.setQueryData(["messages", conversationId], (old: any[]) => [
        ...(old || []),
        newMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessageMutation.mutate({
        conversationId,
        text: inputText.trim(),
      });
      setInputText("");
    }
  };

  const renderMessage = ({ item }: { item: (typeof messages)[0] }) => {
    const isMe = item.sender_id === user?.id;
    const timestamp = format(new Date(item.created_at), "HH:mm");

    return (
      <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isMe ? "bg-primary rounded-br-md" : "bg-surface rounded-bl-md"
          }`}
        >
          <Text className="text-base text-textPrimary">{item.text}</Text>
        </View>
        <Text className="text-textSecondary text-xs mt-1 px-2">
          {timestamp}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  const renderDateSeparator = () => (
    <View className="items-center my-4">
      <View className="bg-surface rounded-full px-4 py-2">
        <Text className="text-textSecondary text-xs font-medium">
          {format(new Date(), "d MMM yyyy")}
        </Text>
      </View>
    </View>
  );

  const renderEmptyMessages = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-textSecondary text-center">
        Inga meddelanden än\nSkicka ett meddelande för att starta
        konversationen!
      </Text>
    </View>
  );

  if (isError) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <View className="flex-1 bg-background items-center justify-center px-6">
          <Text className="text-accentRed text-center mb-2">
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
    <SafeAreaWrapper edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View className="bg-surface px-4 py-3 flex-row items-center border-b border-background">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="relative mr-3">
            <Image
              source={{ uri: participant?.profile?.avatar_url || undefined }}
              className="w-10 h-10 rounded-full bg-primary"
            />
          </View>

          <View className="flex-1">
            <Text className="text-textPrimary font-semibold text-base">
              {participant?.profile?.display_name ||
                participant?.profile?.first_name ||
                "Konversation"}
            </Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderDateSeparator}
          ListEmptyComponent={renderEmptyMessages}
        />

        {/* Input Bar */}
        <View className="bg-surface px-4 py-3 border-t border-background">
          <View className="flex-row items-center">
            <View className="flex-1 bg-background rounded-full px-4 py-3 flex-row items-center mr-3">
              <TextInput
                className="flex-1 text-textPrimary text-base"
                placeholder="Skriv ett meddelande..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity className="ml-2">
                <Smile size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() ? "bg-primary" : "bg-surface"
              }`}
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={{
                shadowColor: inputText.trim() ? colors.primary : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: inputText.trim() ? 4 : 0,
              }}
            >
              <Send
                size={20}
                color={
                  inputText.trim() ? colors.textPrimary : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}
