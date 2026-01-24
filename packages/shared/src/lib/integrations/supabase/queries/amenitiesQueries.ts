import { supabase } from '../supabaseClient';

// Get all amenities
export async function getAllAmenities() {
  const { data, error } = await supabase.from('amenities').select('*').order('name');
  if (error) throw error;
  return data;
}

// Get amenities for a specific club
export async function getClubAmenities(clubId: string) {
  const { data, error } = await supabase
    .from('club_amenities')
    .select('amenity_id, amenities(*)')
    .eq('club_id', clubId);
  if (error) throw error;
  return data?.map((row: any) => row.amenities) || [];
}

// Add an amenity to a club
export async function addClubAmenity(clubId: string, amenityId: string) {
  const { error } = await supabase
    .from('club_amenities')
    .insert({ club_id: clubId, amenity_id: amenityId });
  if (error) throw error;
}

// Remove an amenity from a club
export async function removeClubAmenity(clubId: string, amenityId: string) {
  const { error } = await supabase
    .from('club_amenities')
    .delete()
    .eq('club_id', clubId)
    .eq('amenity_id', amenityId);
  if (error) throw error;
}
