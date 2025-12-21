import { Instructor } from "../types";
import { useQuery } from "@tanstack/react-query";
import { getInstructors } from "../lib/integrations/supabase/queries/instructorQueries";

export const useInstructors = () => {
  return useQuery<Instructor[]>({
    queryKey: ["instructors"],
    queryFn: getInstructors,
  });
}; 