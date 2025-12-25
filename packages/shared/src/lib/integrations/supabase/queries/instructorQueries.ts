import { Instructor } from "../../../../types";
import { supabase } from "../supabaseClient";

// Instructor functions
export async function getInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from("instructors")
    .select("*, profiles:user_id (*)");

  if (error) throw error;
  return data || [];
}

export async function getInstructorById(id: string): Promise<Instructor> {
  const { data, error } = await supabase
    .from("instructors")
    .select("*, profiles:user_id (*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Function to create an instructor
export async function createInstructor(
  userId: string,
  clubName?: string
): Promise<Instructor> {
  const { data, error } = await supabase
    .from("instructors")
    .insert({
      user_id: userId,
      club_name: clubName,
      classes: [],
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
