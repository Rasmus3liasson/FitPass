import { Class, ClassDetailData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getAllClasses, getClassDetail } from "../lib/integrations/supabase/queries/classQueries";

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