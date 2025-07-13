import { supabase } from "../supabaseClient";
import { updateMembershipCredits } from "./membershipQueries";

// Bookings functions
export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      clubs:club_id (name, image_url),
      classes:class_id (
        name, 
        start_time, 
        end_time, 
        instructor:instructor_id (
          id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        ),
        clubs:club_id (name, image_url)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBooking(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      classes:class_id (
        name,
        start_time,
        end_time,
        clubs:club_id (name, image_url)
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (error) throw error;
  return data;
}

// Generate QR Code for booking
export async function getBookingQRCode(bookingId: string): Promise<string> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, classes:class_id(start_time, name, clubs:club_id(name))")
    .eq("id", bookingId)
    .single();

  if (error) throw error;

  // Generate QR code with booking information
  // For security, include booking ID, user ID, and expiration
  const bookingInfo = {
    id: bookingId,
    class_name: data.classes?.name || "Direct Visit",
    club_name: data.classes?.clubs?.name || "",
    timestamp: new Date().getTime(),
    valid_until: data.classes
      ? new Date(data.classes.start_time).getTime()
      : new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours for direct visits
  };

  // Use QR Server API to generate the QR code
  const qrData = encodeURIComponent(JSON.stringify(bookingInfo));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
}

// Function to book a direct visit
export async function bookDirectVisit(
  userId: string,
  clubId: string | null,
  creditsToUse: number = 1
) {
  // Insert a visit record
  const { data: visitData, error: visitError } = await supabase
    .from("visits")
    .insert({
      user_id: userId,
      club_id: clubId,
      credits_used: creditsToUse,
      visit_date: new Date().toISOString(),
    })
    .select();

  if (visitError) throw visitError;

  // Insert a booking record
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      club_id: clubId,
      class_id: null,
      created_at: new Date().toISOString(),
    })
    .select();

  if (bookingError) throw bookingError;

  // Update user's membership credits
  await updateMembershipCredits(userId, creditsToUse);

  return { visitData, bookingData };
}

export async function cancelBooking(bookingId: string) {
  // Fetch the authenticated user
  const { data: user, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unable to fetch authenticated user.");
  }

  const userId = user.user.id;

  if (!userId) {
    throw new Error("Invalid user ID.");
  }

  // Fetch the booking data
  const { data: bookingData, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("credits_used")
    .eq("id", bookingId)
    .single();

  if (bookingFetchError) throw bookingFetchError;

  const creditsToRefund = bookingData?.credits_used || 0;

  // Delete the booking
  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .select();

  if (error) throw error;

  // Refund credits if applicable
  if (creditsToRefund > 0) {
    await updateMembershipCredits(userId, -creditsToRefund);
  }

  return data;
}

export async function completeBooking(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
