import { NewsItem, NewsView } from "@/types";
import { supabase } from "../supabaseClient";

// ================================================
// NEWS MANAGEMENT
// ================================================

export async function getNews(
  filters: {
    club_id?: string;
    type?: string;
    limit?: number;
    target_audience?: string;
  } = {}
): Promise<NewsItem[]> {
  let query = supabase
    .from("news_with_stats")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });

  if (filters.club_id) {
    query = query.eq("club_id", filters.club_id);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.target_audience) {
    query = query.in("target_audience", ["all", filters.target_audience]);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("news_with_stats view failed, falling back to news table:", error);
    return getNewsFromTable(filters);
  }
  
  return data || [];
}

// Fallback function that queries news table directly with club info
export async function getNewsFromTable(
  filters: {
    club_id?: string;
    type?: string;
    limit?: number;
    target_audience?: string;
  } = {}
): Promise<NewsItem[]> {
  let query = supabase
    .from("news")
    .select(`
      *,
      clubs:club_id (
        id,
        name,
        image_url
      )
    `)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });

  if (filters.club_id) {
    query = query.eq("club_id", filters.club_id);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.target_audience) {
    query = query.in("target_audience", ["all", filters.target_audience]);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Transform the data to match NewsItem interface
  return (data || []).map(item => ({
    ...item,
    club_name: item.clubs?.name,
    club_logo: item.clubs?.image_url
  }));
}

export async function getNewsById(newsId: string): Promise<NewsItem> {
  const { data, error } = await supabase
    .from("news_with_stats")
    .select("*")
    .eq("id", newsId)
    .single();

  if (error) throw error;
  return data;
}

export async function createNews(newsData: Omit<NewsItem, 'id' | 'created_at' | 'updated_at' | 'views_count'>): Promise<NewsItem> {
  const { data, error } = await supabase
    .from("news")
    .insert({
      ...newsData,
      published_at: newsData.status === 'published' ? new Date().toISOString() : undefined
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNews(newsId: string, updates: Partial<NewsItem>): Promise<NewsItem> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // If publishing, set published_at
  if (updates.status === 'published' && !updates.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("news")
    .update(updateData)
    .eq("id", newsId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNews(newsId: string): Promise<void> {
  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", newsId);

  if (error) throw error;
}

// ================================================
// NEWS VIEWS TRACKING
// ================================================

export async function markNewsAsViewed(newsId: string, userId: string): Promise<NewsView> {
  // Use upsert to avoid duplicate view records
  const { data, error } = await supabase
    .from("news_view")
    .upsert({
      news_id: newsId,
      user_id: userId,
      viewed_at: new Date().toISOString()
    }, {
      onConflict: "news_id,user_id"
    })
    .select()
    .single();

  if (error) throw error;

  // Increment view count
  await supabase.rpc('increment_news_views', { news_id: newsId });

  return data;
}

export async function getUserNewsViews(userId: string): Promise<NewsView[]> {
  const { data, error } = await supabase
    .from("news_view")
    .select("*")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnreadNewsCount(userId: string): Promise<number> {
  // Get count of published news that user hasn't viewed
  const { count, error } = await supabase
    .from("news")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .not("id", "in", `(
      SELECT news_id 
      FROM news_view 
      WHERE user_id = '${userId}'
    )`);

  if (error) throw error;
  return count || 0;
}

// ================================================
// NEWS BY CATEGORY/TYPE
// ================================================

export async function getNewsByType(type: string, limit: number = 10): Promise<NewsItem[]> {
  return getNews({ type, limit });
}

export async function getNewsForClub(clubId: string, limit: number = 10): Promise<NewsItem[]> {
  return getNews({ club_id: clubId, limit });
}

export async function getRecentNews(limit: number = 20): Promise<NewsItem[]> {
  return getNews({ limit });
}

// ================================================
// NEWS SEARCH
// ================================================

export async function searchNews(query: string, limit: number = 20): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news_with_stats")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ================================================
// ADMIN FUNCTIONS
// ================================================

export async function getAllNews(includeArchived: boolean = false): Promise<NewsItem[]> {
  let query = supabase
    .from("news_with_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getNewsDrafts(authorId?: string): Promise<NewsItem[]> {
  let query = supabase
    .from("news_with_stats")
    .select("*")
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ================================================
// ANALYTICS
// ================================================

export async function getNewsAnalytics(newsId: string): Promise<{
  total_views: number;
  unique_viewers: number;
  view_history: Array<{ date: string; views: number }>;
}> {
  // Get total views
  const { data: newsData } = await supabase
    .from("news")
    .select("views_count")
    .eq("id", newsId)
    .single();

  // Get unique viewers
  const { count: uniqueViewers } = await supabase
    .from("news_view")
    .select("user_id", { count: "exact", head: true })
    .eq("news_id", newsId);

  // Get view history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: viewHistory } = await supabase
    .from("news_view")
    .select("viewed_at")
    .eq("news_id", newsId)
    .gte("viewed_at", thirtyDaysAgo.toISOString());

  // Group views by date
  const viewsByDate: Record<string, number> = {};
  viewHistory?.forEach(view => {
    const date = new Date(view.viewed_at).toISOString().split('T')[0];
    viewsByDate[date] = (viewsByDate[date] || 0) + 1;
  });

  const view_history = Object.entries(viewsByDate).map(([date, views]) => ({
    date,
    views
  }));

  return {
    total_views: newsData?.views_count || 0,
    unique_viewers: uniqueViewers || 0,
    view_history
  };
}
