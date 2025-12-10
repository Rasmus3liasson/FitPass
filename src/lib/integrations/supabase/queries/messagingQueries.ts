import { supabase } from "../supabaseClient";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_text?: string;
  last_message_at?: string;
  last_message_sender_id?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  unread_count: number;
  is_muted: boolean;
}

export interface ConversationWithDetails extends Conversation {
  participants: {
    user_id: string;
    profile: {
      id: string;
      display_name: string;
      first_name: string;
      avatar_url?: string;
    };
  }[];
  unread_count: number;
}

export async function getUserConversations(): Promise<ConversationWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      unread_count,
      last_read_at,
      conversations (
        id,
        created_at,
        updated_at,
        last_message_text,
        last_message_at,
        last_message_sender_id
      )
    `)
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false });

  if (error) throw error;

  console.log("Raw data from conversation_participants:", data);

  const conversationsWithDetails = await Promise.all(
    (data || []).map(async (item: any) => {
      const conversation = item.conversations;
      
      console.log("Fetching participants for conversation:", conversation?.id);
      
      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(`
          user_id,
          profile:profiles (
            id,
            display_name,
            first_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversation.id)
        .neq("user_id", user.id);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
      }
      
      console.log("Participants for conversation", conversation?.id, ":", participants);

      return {
        ...conversation,
        participants: participants || [],
        unread_count: item.unread_count,
      };
    })
  );

  console.log("Final conversations with details:", conversationsWithDetails);
  
  // Sort by most recent activity (last_message_at or created_at)
  return conversationsWithDetails.sort((a, b) => {
    const dateA = new Date(a.last_message_at || a.created_at).getTime();
    const dateB = new Date(b.last_message_at || b.created_at).getTime();
    return dateB - dateA; // Most recent first
  });
}

export async function getOrCreateConversation(friendId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    user1_id: user.id,
    user2_id: friendId,
  });

  if (error) throw error;
  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  console.log("Fetching messages for conversation:", conversationId);
  
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
  
  console.log("Fetched messages:", data);
  return data || [];
}

export async function getConversationWithParticipant(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(`
      user_id,
      profiles!inner (
        id,
        display_name,
        first_name,
        avatar_url
      )
    `)
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .single();

  if (error) throw error;
  
  // Return the profile directly since we're using inner join
  return data ? {
    user_id: data.user_id,
    profile: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  } : null;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: text.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("conversation_participants")
    .update({
      last_read_at: new Date().toISOString(),
      unread_count: 0,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) throw error;
}

export async function editMessage(messageId: string, newText: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("messages")
    .update({
      text: newText.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) throw error;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete the conversation (CASCADE will delete participants and messages)
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) throw error;
}
