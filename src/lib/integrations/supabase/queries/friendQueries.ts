import { Friend, FriendSuggestion, SocialStats } from "@/types";
import { supabase } from "../supabaseClient";

// ================================================
// PROFILES AND USER DISCOVERY
// ================================================

export async function getMemberProfiles(currentUserId: string, searchQuery?: string): Promise<any[]> {
  let query = supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      avatar_url,
      first_name,
      last_name,
      role,
      bio,
      created_at
    `)
    .eq("role", "member")
    .neq("id", currentUserId); // Exclude current user

  // Add search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.or(`display_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50); // Limit to 50 results for performance

  if (error) throw error;
  return data || [];
}

export async function getFilteredMemberProfiles(currentUserId: string, searchQuery?: string): Promise<any[]> {
  // Get all member profiles
  const profiles = await getMemberProfiles(currentUserId, searchQuery);
  
  // Get current user's friends and pending requests to filter them out
  const { data: friendships } = await supabase
    .from("friends")
    .select("user_id, friend_id, status")
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  // Create sets of user IDs that are already friends or have pending requests
  const existingConnections = new Set<string>();
  
  friendships?.forEach(friendship => {
    if (friendship.user_id === currentUserId) {
      existingConnections.add(friendship.friend_id);
    } else {
      existingConnections.add(friendship.user_id);
    }
  });

  // Filter out existing connections
  const filteredProfiles = profiles.filter(profile => 
    !existingConnections.has(profile.id)
  );

  return filteredProfiles;
}

// ================================================
// FRIENDS IN CLASSES
// ================================================

export async function getFriendsInClass(userId: string, classId: string): Promise<any[]> {
  // Get user's friends first
  const friends = await getFriends(userId);
  const friendIds = friends.map(friendship => {
    // Get the friend's ID (not the current user's ID)
    return friendship.friend_id === userId ? friendship.user_id : friendship.friend_id;
  });

  if (friendIds.length === 0) return [];

  // Get bookings for this class by the user's friends
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      user_id,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      )
    `)
    .eq("class_id", classId)
    .in("user_id", friendIds)
    .eq("status", "confirmed");

  if (error) throw error;
  return data || [];
}

export async function getFriendsInClub(userId: string, clubId: string): Promise<any[]> {
  // Get user's friends first
  const friends = await getFriends(userId);
  const friendIds = friends.map(friendship => {
    // Get the friend's ID (not the current user's ID)
    return friendship.friend_id === userId ? friendship.user_id : friendship.friend_id;
  });

  if (friendIds.length === 0) return [];

  // Get recent bookings at this club by the user's friends
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      user_id,
      created_at,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      )
    `)
    .eq("club_id", clubId)
    .in("user_id", friendIds)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Remove duplicates by user_id
  const uniqueFriends = data?.reduce((acc: any[], booking) => {
    if (!acc.find(item => item.user_id === booking.user_id)) {
      acc.push(booking);
    }
    return acc;
  }, []);

  return uniqueFriends || [];
}

// ================================================
// FRIENDS MANAGEMENT
// ================================================

export async function getFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      friend_profile:friend_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      ),
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      )
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPendingFriendRequests(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      )
    `)
    .eq("friend_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSentFriendRequests(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      friend_profile:friend_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      )
    `)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
  // Check if friendship already exists
  const { data: existing } = await supabase
    .from("friends")
    .select("*")
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single();

  if (existing) {
    throw new Error("Friend request already exists");
  }

  // BYPASS: For now, immediately create an accepted friendship instead of pending
  const { data, error } = await supabase
    .from("friends")
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "accepted" // Changed from "pending" to "accepted" to bypass notification flow
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Alternative function for when you want to implement proper pending requests later
export async function sendPendingFriendRequest(userId: string, friendId: string): Promise<Friend> {
  // Check if friendship already exists
  const { data: existing } = await supabase
    .from("friends")
    .select("*")
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single();

  if (existing) {
    throw new Error("Friend request already exists");
  }

  const { data, error } = await supabase
    .from("friends")
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptFriendRequest(friendshipId: string): Promise<Friend> {
  const { data, error } = await supabase
    .from("friends")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendshipId);

  if (error) throw error;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendshipId);

  if (error) throw error;
}

export async function blockUser(userId: string, friendId: string): Promise<Friend> {
  // First remove any existing friendship
  await supabase
    .from("friends")
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  // Then create block entry
  const { data, error } = await supabase
    .from("friends")
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "blocked"
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ================================================
// FRIEND SUGGESTIONS
// ================================================

export async function getFriendSuggestions(userId: string, limit: number = 10): Promise<FriendSuggestion[]> {
  // Get users who are not already friends or blocked
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      first_name,
      last_name,
      avatar_url,
      bio,
      created_at
    `)
    .neq("id", userId)
    .not("id", "in", `(
      SELECT CASE 
        WHEN user_id = '${userId}' THEN friend_id 
        ELSE user_id 
      END
      FROM friends 
      WHERE (user_id = '${userId}' OR friend_id = '${userId}')
    )`)
    .limit(limit * 2); // Get more to allow for filtering

  if (error) throw error;

  // Transform to FriendSuggestion format with mock data for now
  // TODO: Calculate real mutual friends and common gyms
  const suggestions: FriendSuggestion[] = (data || []).slice(0, limit).map(profile => ({
    id: profile.id,
    name: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || "User",
    avatar_url: profile.avatar_url,
    mutual_friends: Math.floor(Math.random() * 5), // TODO: Calculate real mutual friends
    common_gym: undefined, // TODO: Find common gym memberships
    is_online: Math.random() > 0.5, // TODO: Implement online status
    bio: profile.bio,
    friend_count: Math.floor(Math.random() * 50) + 5, // TODO: Get real friend count
    recent_activity: "Active this week" // TODO: Get real activity
  }));

  return suggestions;
}

export async function searchUsers(query: string, currentUserId: string, limit: number = 20): Promise<FriendSuggestion[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      first_name,
      last_name,
      avatar_url,
      bio
    `)
    .neq("id", currentUserId)
    .or(`display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;

  return (data || []).map(profile => ({
    id: profile.id,
    name: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || "User",
    avatar_url: profile.avatar_url,
    mutual_friends: 0, // TODO: Calculate
    is_online: false, // TODO: Implement
    bio: profile.bio || "FitPass member"
  }));
}

// ================================================
// SOCIAL STATS
// ================================================

export async function getSocialStats(userId: string): Promise<SocialStats> {
  // Get friend count
  const { data: friendsData } = await supabase
    .from("friends")
    .select("id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");

  // Get pending requests
  const { data: pendingData } = await supabase
    .from("friends")
    .select("id")
    .eq("friend_id", userId)
    .eq("status", "pending");

  // Get activities this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: activitiesData } = await supabase
    .from("user_activities")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", weekAgo.toISOString());

  // TODO: Calculate streak days from consecutive workout days
  const streakDays = 0;

  return {
    friend_count: friendsData?.length || 0,
    pending_requests: pendingData?.length || 0,
    activities_this_week: activitiesData?.length || 0,
    streak_days: streakDays
  };
}

// ================================================
// FRIENDSHIP STATUS CHECKS
// ================================================

export async function getFriendshipStatus(userId: string, otherUserId: string): Promise<string> {
  const { data, error } = await supabase
    .from("friends")
    .select("status, user_id, friend_id")
    .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
    .single();

  if (error || !data) return "none";

  if (data.status === "accepted") return "friends";
  if (data.status === "blocked") return "blocked";
  if (data.status === "pending") {
    // Check who sent the request
    if (data.user_id === userId) return "sent";
    return "received";
  }

  return "none";
}
