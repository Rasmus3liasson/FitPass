import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteMessage,
    editMessage,
    getMessages,
    getOrCreateConversation,
    getUserConversations,
    markConversationAsRead,
    Message,
    sendMessage,
    subscribeToMessages,
} from "../lib/integrations/supabase/queries/messagingQueries";

export const useUserConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getUserConversations,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: false,
    staleTime: 2000, // Consider data fresh for 2 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => getOrCreateConversation(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMessage(conversationId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => markConversationAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, newText }: { messageId: string; newText: string }) =>
      editMessage(messageId, newText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSubscribeToMessages = (
  conversationId: string,
  onNewMessage: (message: Message) => void
) => {
  return subscribeToMessages(conversationId, onNewMessage);
};
