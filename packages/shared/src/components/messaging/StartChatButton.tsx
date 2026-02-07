import { ChatCircle } from 'phosphor-react-native';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { ROUTES } from '../../config/constants';
import colors from '../../constants/custom-colors';
import { useCreateConversation } from '../../hooks/useMessaging';
import { useNavigation } from '../../services/navigationService';

interface StartChatButtonProps {
  friendId: string;
  size?: number;
}

export function StartChatButton({ friendId, size = 24 }: StartChatButtonProps) {
  const createConversationMutation = useCreateConversation();
  const navigation = useNavigation();

  const handleStartChat = async () => {
    try {
      const conversationId = await createConversationMutation.mutateAsync(friendId);
      navigation.push(ROUTES.MESSAGES_ID(conversationId));
    } catch (error) {
      console.error('Error starting chat:', error);
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
        <ChatCircle size={size} color={colors.textPrimary} />
      )}
    </TouchableOpacity>
  );
}
