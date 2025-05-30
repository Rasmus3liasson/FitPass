import { Class, ClassDetailData } from "@/types";
import { supabase } from "../browser";

// Class detail functions
export async function getClassDetail(
  classId: string
): Promise<ClassDetailData> {
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      clubs:club_id (*),
      instructor:instructor_id (
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("id", classId)
    .single();

  if (error) throw error;

  // Fix for the type error: properly type the data before returning
  return data as ClassDetailData;
}

// Function to get all classes for admin purposes
export async function getAllClasses(): Promise<Class[]> {
  const { data, error } = await supabase.from("classes").select(
    `*, 
      clubs:club_id (name),
      instructor:instructor_id (
        id,
        profiles:user_id (
          display_name,
          avatar_url
        )
      )
      `
  );

  if (error) throw error;
  return data as Class[];
}
