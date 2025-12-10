import { useCreateConversation } from "@/src/hooks/useMessaging";
import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import colors from "../constants/custom-colors";

interface StartChatButtonProps {
  friendId: string;
  size?: number;
}

export function StartChatButton({ friendId, size = 24 }: StartChatButtonProps) {
  const createConversationMutation = useCreateConversation();

  const handleStartChat = async () => {
    try {
      const conversationId = await createConversationMutation.mutateAsync(friendId);
      router.push(`/(user)/messages/${conversationId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleStartChat}
      disabled={createConversationMutation.isPending}
      className="w-10 h-10 rounded-full bg-primary items-center justify-center"
    >
      {createConversationMutation.isPending ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <MessageCircle size={size} color={colors.textPrimary} />
      )}
    </TouchableOpacity>
  );
}
