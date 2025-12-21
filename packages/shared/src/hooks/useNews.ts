import { notificationService } from "../services/notificationService";
import { NewsItem } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createNews,
    deleteNews,
    getAllNews,
    getNews,
    getNewsAnalytics,
    getNewsById,
    getNewsByType,
    getNewsDrafts,
    getNewsForClub,
    getNewsFromTable,
    getRecentNews,
    getUnreadNewsCount,
    getUserNewsViews,
    markNewsAsViewed,
    searchNews,
    updateNews
} from "../lib/integrations/supabase/queries/newsQueries";

// ================================================
// NEWS QUERY HOOKS
// ================================================

export const useNews = (filters?: {
  club_id?: string;
  type?: string;
  limit?: number;
  target_audience?: string;
}) => {
  return useQuery({
    queryKey: ["news", filters],
    queryFn: async () => {
      try {
        const result = await getNews(filters);
        return result;
      } catch (error) {
        console.error('❌ News query failed:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Alternative hook that queries news table directly (for debugging)
export const useNewsFromTable = (filters?: {
  club_id?: string;
  type?: string;
  limit?: number;
  target_audience?: string;
}) => {
  return useQuery({
    queryKey: ["newsFromTable", filters],
    queryFn: async () => {
      try {
        const result = await getNewsFromTable(filters);
        return result;
      } catch (error) {
        console.error('❌ News table query failed:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useNewsById = (newsId: string) => {
  return useQuery({
    queryKey: ["news", newsId],
    queryFn: () => getNewsById(newsId),
    enabled: !!newsId,
  });
};

export const useRecentNews = (limit: number = 20) => {
  return useQuery({
    queryKey: ["recentNews", limit],
    queryFn: () => getRecentNews(limit),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

export const useNewsByType = (type: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["newsByType", type, limit],
    queryFn: () => getNewsByType(type, limit),
    enabled: !!type,
  });
};

export const useNewsForClub = (clubId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["newsForClub", clubId, limit],
    queryFn: () => getNewsForClub(clubId, limit),
    enabled: !!clubId,
  });
};

export const useUnreadNewsCount = (userId: string) => {
  return useQuery({
    queryKey: ["unreadNewsCount", userId],
    queryFn: () => getUnreadNewsCount(userId),
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useUserNewsViews = (userId: string) => {
  return useQuery({
    queryKey: ["userNewsViews", userId],
    queryFn: () => getUserNewsViews(userId),
    enabled: !!userId,
  });
};

export const useSearchNews = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: ["searchNews", query, limit],
    queryFn: () => searchNews(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
};

// ================================================
// ADMIN HOOKS
// ================================================

export const useAllNews = (includeArchived: boolean = false) => {
  return useQuery({
    queryKey: ["allNews", includeArchived],
    queryFn: () => getAllNews(includeArchived),
  });
};

export const useNewsDrafts = (authorId?: string) => {
  return useQuery({
    queryKey: ["newsDrafts", authorId],
    queryFn: () => getNewsDrafts(authorId),
  });
};

export const useNewsAnalytics = (newsId: string) => {
  return useQuery({
    queryKey: ["newsAnalytics", newsId],
    queryFn: () => getNewsAnalytics(newsId),
    enabled: !!newsId,
  });
};

// ================================================
// NEWS MUTATION HOOKS
// ================================================

export const useCreateNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newsData: Omit<NewsItem, 'id' | 'created_at' | 'updated_at' | 'views_count'>) =>
      createNews(newsData),
    onSuccess: async (newNews) => {
      // Invalidate and update relevant queries
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["recentNews"] });
      queryClient.invalidateQueries({ queryKey: ["allNews"] });
      
      if (newNews.club_id) {
        queryClient.invalidateQueries({ queryKey: ["newsForClub", newNews.club_id] });
      }
      
      if (newNews.type) {
        queryClient.invalidateQueries({ queryKey: ["newsByType", newNews.type] });
      }

      // Send notification for published news
      if (newNews.status === 'published') {
        await notificationService.sendNewsPostNotification(
          newNews.title,
          newNews.author_name || 'FitPass',
          newNews.id
        );
      }
    },
  });
};

export const useUpdateNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ newsId, updates }: { newsId: string; updates: Partial<NewsItem> }) =>
      updateNews(newsId, updates),
    onSuccess: async (updatedNews, { updates }) => {
      // Update the specific news item in cache
      queryClient.setQueryData(["news", updatedNews.id], updatedNews);
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["recentNews"] });
      queryClient.invalidateQueries({ queryKey: ["allNews"] });
      
      if (updatedNews.club_id) {
        queryClient.invalidateQueries({ queryKey: ["newsForClub", updatedNews.club_id] });
      }

      // Send notification if news was just published
      if (updates.status === 'published' && updatedNews.status === 'published') {
        await notificationService.sendNewsPostNotification(
          updatedNews.title,
          updatedNews.author_name || 'FitPass',
          updatedNews.id
        );
      }
    },
  });
};

export const useDeleteNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newsId: string) => deleteNews(newsId),
    onSuccess: (_, newsId) => {
      // Remove from cache and invalidate queries
      queryClient.removeQueries({ queryKey: ["news", newsId] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["recentNews"] });
      queryClient.invalidateQueries({ queryKey: ["allNews"] });
    },
  });
};

export const useMarkNewsAsViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ newsId, userId }: { newsId: string; userId: string }) =>
      markNewsAsViewed(newsId, userId),
    onSuccess: (_, { userId }) => {
      // Update unread count and user views
      queryClient.invalidateQueries({ queryKey: ["unreadNewsCount", userId] });
      queryClient.invalidateQueries({ queryKey: ["userNewsViews", userId] });
    },
  });
};

// ================================================
// COMBINED HOOKS
// ================================================

export const useNewsWithViews = (userId: string, filters?: {
  club_id?: string;
  type?: string;
  limit?: number;
}) => {
  const news = useNews(filters);
  const userViews = useUserNewsViews(userId);
  const unreadCount = useUnreadNewsCount(userId);

  // Combine news with view status
  const newsWithViewStatus = (news.data || []).map(newsItem => ({
    ...newsItem,
    isViewed: (userViews.data || []).some(view => view.news_id === newsItem.id),
  }));

  return {
    news: newsWithViewStatus,
    unreadCount: unreadCount.data || 0,
    isLoading: news.isLoading || userViews.isLoading,
    error: news.error || userViews.error,
  };
};

export const useNewsForUser = (userId: string) => {
  const recentNews = useRecentNews(20);
  const unreadCount = useUnreadNewsCount(userId);
  const userViews = useUserNewsViews(userId);

  return {
    news: recentNews.data || [],
    unreadCount: unreadCount.data || 0,
    viewedNews: userViews.data || [],
    isLoading: recentNews.isLoading,
    error: recentNews.error,
  };
};
