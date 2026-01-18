import { useQuery } from "@tanstack/react-query";
import {
  getAllClasses,
  getClassDetail,
  getClassesByClub,
} from "../lib/integrations/supabase/queries/classQueries";
import { Class, ClassDetailData } from "../types";

export const useClassDetail = (classId: string) => {
  return useQuery<ClassDetailData>({
    queryKey: ["classDetail", classId],
    queryFn: () => getClassDetail(classId),
    enabled: !!classId,
  });
};

export const useAllClasses = () => {
  return useQuery<Class[]>({
    queryKey: ["allClasses"],
    queryFn: getAllClasses,
  });
};

export const useClassesByClub = (clubId: string) => {
  return useQuery<Class[]>({
    queryKey: ["classesByClub", clubId],
    queryFn: () => getClassesByClub(clubId),
    enabled: !!clubId,
  });
};
