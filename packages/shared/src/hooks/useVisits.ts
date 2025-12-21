import { Visit } from "../types";
import { useQuery } from "@tanstack/react-query";
import {
    getRecentVisits,
    getUserVisits,
    getVisitQRCode,
    getVisitsChartData,
} from "../lib/integrations/supabase/queries/visitQueries";

export const useUserVisits = (userId: string) => {
  return useQuery({
    queryKey: ["userVisits", userId],
    queryFn: () => getUserVisits(userId),
    enabled: !!userId,
  });
};

export const useVisitsChartData = (userId: string) => {
  return useQuery({
    queryKey: ["visitsChartData", userId],
    queryFn: () => getVisitsChartData(userId),
    enabled: !!userId,
  });
};

export const useRecentVisits = (userId: string, limit: number = 5) => {
  return useQuery<Visit[]>({
    queryKey: ["recentVisits", userId, limit],
    queryFn: () => getRecentVisits(userId, limit),
    enabled: !!userId,
  });
};

export const useVisitQRCode = (visitId: string) => {
  return useQuery({
    queryKey: ["visitQRCode", visitId],
    queryFn: () => getVisitQRCode(visitId),
    enabled: !!visitId,
  });
}; 