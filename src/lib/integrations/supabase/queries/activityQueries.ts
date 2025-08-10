import { UserActivity } from "@/types";
import { supabase } from "../supabaseClient";

// ================================================
// USER ACTIVITY MANAGEMENT
// ================================================

export async function getUserActivities(
  userId: string,
  filters: {
    activity_type?: string;
    visibility?: string;
    limit?: number;
    include_friends?: boolean;
  } = {}
): Promise<UserActivity[]> {
  let query = supabase
    .from("user_activities")
    .select(`
      *,
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      ),
      club:club_id (
        id,
        name,
        image_url
      ),
      class:class_id (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  // If not including friends, only show user's own activities
  if (!filters.include_friends) {
    query = query.eq("user_id", userId);
  } else {
    // Include activities from friends
    query = query.or(`user_id.eq.${userId},and(visibility.neq.private,user_id.in.(
      SELECT CASE 
        WHEN user_id = '${userId}' THEN friend_id 
        ELSE user_id 
      END
      FROM friends 
      WHERE (user_id = '${userId}' OR friend_id = '${userId}')
      AND status = 'accepted'
    ))`);
  }

  if (filters.activity_type) {
    query = query.eq("activity_type", filters.activity_type);
  }

  if (filters.visibility) {
    query = query.eq("visibility", filters.visibility);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getFriendsActivities(userId: string, limit: number = 20): Promise<UserActivity[]> {
  return getUserActivities(userId, { include_friends: true, limit });
}

export async function createActivity(
  activityData: Omit<UserActivity, 'id' | 'created_at'>
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from("user_activities")
    .insert(activityData)
    .select(`
      *,
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      ),
      club:club_id (
        id,
        name,
        image_url
      ),
      class:class_id (
        id,
        name
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateActivityVisibility(
  activityId: string,
  visibility: 'public' | 'friends' | 'private'
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from("user_activities")
    .update({ visibility })
    .eq("id", activityId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("user_activities")
    .delete()
    .eq("id", activityId);

  if (error) throw error;
}

// ================================================
// ACTIVITY FEED
// ================================================

export async function getActivityFeed(userId: string, limit: number = 50): Promise<UserActivity[]> {
  // Get combined feed of user's activities and friends' public/friends activities
  const { data, error } = await supabase
    .from("user_activities")
    .select(`
      *,
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      ),
      club:club_id (
        id,
        name,
        image_url
      ),
      class:class_id (
        id,
        name
      )
    `)
    .or(`
      user_id.eq.${userId},
      and(
        visibility.in.(public,friends),
        user_id.in.(
          SELECT CASE 
            WHEN user_id = '${userId}' THEN friend_id 
            ELSE user_id 
          END
          FROM friends 
          WHERE (user_id = '${userId}' OR friend_id = '${userId}')
          AND status = 'accepted'
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getPublicActivities(limit: number = 20): Promise<UserActivity[]> {
  const { data, error } = await supabase
    .from("user_activities")
    .select(`
      *,
      user_profile:user_id (
        id,
        display_name,
        avatar_url,
        first_name,
        last_name
      ),
      club:club_id (
        id,
        name,
        image_url
      ),
      class:class_id (
        id,
        name
      )
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ================================================
// ACTIVITY STATISTICS
// ================================================

export async function getUserActivityStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' = 'week'
): Promise<{
  total_activities: number;
  workouts_completed: number;
  classes_attended: number;
  gym_visits: number;
  friends_added: number;
  most_active_day: string;
  activity_breakdown: Array<{ type: string; count: number }>;
}> {
  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { data, error } = await supabase
    .from("user_activities")
    .select("activity_type, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString());

  if (error) throw error;

  const activities = data || [];
  const total_activities = activities.length;

  // Count by type
  const typeCounts: Record<string, number> = {};
  const dayActivities: Record<string, number> = {};

  activities.forEach(activity => {
    // Count by type
    typeCounts[activity.activity_type] = (typeCounts[activity.activity_type] || 0) + 1;
    
    // Count by day
    const day = new Date(activity.created_at).toLocaleDateString('en-US', { weekday: 'long' });
    dayActivities[day] = (dayActivities[day] || 0) + 1;
  });

  // Find most active day
  const most_active_day = Object.entries(dayActivities).reduce((a, b) => 
    dayActivities[a[0]] > dayActivities[b[0]] ? a : b
  )?.[0] || 'Monday';

  return {
    total_activities,
    workouts_completed: (typeCounts['workout_completed'] || 0) + (typeCounts['class_completed'] || 0) + (typeCounts['gym_visit'] || 0),
    classes_attended: typeCounts['class_completed'] || 0,
    gym_visits: typeCounts['gym_visit'] || 0,
    friends_added: typeCounts['friend_added'] || 0,
    most_active_day,
    activity_breakdown: Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
  };
}

export async function getActivityStreak(userId: string): Promise<number> {
  // Get user's workout activities (classes + gym visits) ordered by date
  const { data, error } = await supabase
    .from("user_activities")
    .select("created_at")
    .eq("user_id", userId)
    .in("activity_type", ["class_completed", "gym_visit", "workout_completed"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  // Calculate consecutive days with activities
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDates = new Set(
    data.map(activity => {
      const date = new Date(activity.created_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  // Check each day going backwards from today
  while (activityDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// ================================================
// ACTIVITY TEMPLATES FOR COMMON ACTIONS
// ================================================

export async function createWorkoutActivity(
  userId: string,
  workoutData: {
    club_id?: string;
    class_id?: string;
    workout_type: string;
    duration?: number;
    notes?: string;
  },
  visibility: 'public' | 'friends' | 'private' = 'friends'
): Promise<UserActivity> {
  return createActivity({
    user_id: userId,
    activity_type: 'workout_completed',
    club_id: workoutData.club_id,
    class_id: workoutData.class_id,
    activity_data: {
      workout_type: workoutData.workout_type,
      duration: workoutData.duration,
      notes: workoutData.notes
    },
    visibility
  });
}

export async function createClassBookingActivity(
  userId: string,
  classId: string,
  clubId: string
): Promise<UserActivity> {
  return createActivity({
    user_id: userId,
    activity_type: 'class_booked',
    club_id: clubId,
    class_id: classId,
    visibility: 'friends'
  });
}

export async function createFriendActivity(
  userId: string,
  friendId: string
): Promise<UserActivity> {
  return createActivity({
    user_id: userId,
    activity_type: 'friend_added',
    activity_data: { friend_id: friendId },
    visibility: 'friends'
  });
}
