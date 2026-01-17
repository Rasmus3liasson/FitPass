import { BookingStatus } from "@shared/index";
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
          profiles:user_id!left (
            display_name,
            avatar_url
          )
        ),
        clubs:club_id (name, image_url)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Add comprehensive null safety for nested data
  const safeData = data?.map((booking) => {
    // Handle missing classes data
    if (booking.classes) {
      // Handle missing instructor data
      if (booking.classes.instructor) {
        // Handle missing instructor profiles
        if (!booking.classes.instructor.profiles) {
          booking.classes.instructor.profiles = {
            display_name: "Unknown Instructor",
            avatar_url: null,
          };
        }
      }
    }
    return booking;
  });

  return safeData || [];
}

export async function getBookingByCode(code: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      classes:class_id (
        name,
        start_time,
        end_time,
        clubs:club_id (name, image_url),
        instructor:instructor_id (
          id,
          profiles:user_id!left (
            display_name,
            avatar_url
          )
        )
      ),
      clubs:club_id (name, image_url)
    `,
    )
    .eq("booking_code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(`Ingen bokning hittades med kod: ${code.toUpperCase()}`);
  }

  // Fetch user profile separately
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", data.user_id)
    .maybeSingle();

  return { ...data, profiles: profile };
}

export async function getBooking(bookingId: string) {
  console.log("[getBooking] Fetching booking with ID:", bookingId);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      classes:class_id (
        name,
        start_time,
        end_time,
        clubs:club_id (name, image_url),
        instructor:instructor_id (
          id,
          profiles:user_id!left (
            display_name,
            avatar_url
          )
        )
      ),
      clubs:club_id (name, image_url)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  console.log("[getBooking] Query result:", { data, error });

  if (error) {
    console.error("[getBooking] Database error:", error);
    throw error;
  }

  if (!data) {
    console.error("[getBooking] No booking found for ID:", bookingId);
    throw new Error(`Bokning hittades inte`);
  }

  console.log("[getBooking] Found booking:", data.id, "status:", data.status);

  // Fetch user profile separately
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", data.user_id)
    .maybeSingle();

  return { ...data, profiles: profile };
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
  creditsToUse: number = 1,
) {
  // Check if user has Daily Access membership and validate gym selection
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select(
      `
      *,
      membership_plans (
        id,
        title,
        max_daily_gyms
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (membershipError) throw new Error("Kunde inte hämta medlemskap");

  // Check if this is a Daily Access membership
  const maxDailyGyms = membership?.membership_plans?.max_daily_gyms || 0;
  const planTitle = membership?.membership_plans?.title?.toLowerCase() || "";
  const isDailyAccessPlan =
    planTitle.includes("premium") ||
    planTitle.includes("daily access") ||
    planTitle.includes("unlimited") ||
    maxDailyGyms >= 3;

  if (isDailyAccessPlan && clubId) {
    // Check user's selected gyms
    const { data: selectedGyms, error: gymsError } = await supabase
      .from("user_selected_gyms")
      .select("status, club_id")
      .eq("user_id", userId)
      .in("status", ["active", "pending"]);

    if (gymsError) throw new Error("Kunde inte hämta gym-val");

    const activeGyms = selectedGyms?.filter((g) => g.status === "active") || [];
    const pendingGyms =
      selectedGyms?.filter((g) => g.status === "pending") || [];

    // Block booking if user has pending gyms but no active gyms
    if (pendingGyms.length > 0 && activeGyms.length === 0) {
      throw new Error(
        "Du måste bekräfta dina Daily Access gym-val innan du kan boka. Gå till Medlemshantering för att aktivera dina val.",
      );
    }

    // Check if this gym is in their active selection
    const isGymSelected = activeGyms.some((g) => g.club_id === clubId);
    if (!isGymSelected) {
      throw new Error(
        "Detta gym är inte inkluderat i din Daily Access. Du kan endast boka på gym som du har valt i din fördelning.",
      );
    }
  }

  // Insert a booking record with 'pending' status
  // Visit record and credits will be deducted when the booking is scanned/confirmed by the club
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      club_id: clubId,
      class_id: null,
      credits_used: creditsToUse,
      status: BookingStatus.PENDING, // Set to pending - will be 'completed' when scanned
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (bookingError) throw bookingError;

  // Refetch the booking to get the generated booking_code from the trigger
  const { data: updatedBooking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingData.id)
    .single();

  if (fetchError) throw fetchError;

  // NOTE: Credits are NOT deducted here - they will be deducted when booking is completed/scanned
  // Visit record is also created at scan time, not at booking time
  // This ensures users only pay for visits they actually use

  return { bookingData: updatedBooking };
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

  // Fetch the booking data - use maybeSingle() to handle case where booking doesn't exist
  const { data: bookingData, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("credits_used, status")
    .eq("id", bookingId)
    .maybeSingle();

  // If booking doesn't exist, it might already be deleted - return success
  if (bookingFetchError) throw bookingFetchError;

  if (!bookingData) {
    console.log("Booking not found, might already be deleted:", bookingId);
    return null;
  }

  const creditsToRefund = bookingData?.credits_used || 0;
  const wasConfirmed = bookingData?.status === BookingStatus.CONFIRMED;

  // Delete the booking
  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .select();

  if (error) throw error;

  // Only refund credits if the booking was confirmed (meaning credits were already deducted)
  // If booking was still 'pending', no credits were deducted yet, so no refund needed
  if (wasConfirmed && creditsToRefund > 0) {
    await updateMembershipCredits(userId, -creditsToRefund);
  }

  return data;
}

export async function completeBooking(bookingId: string) {
  // First fetch the booking to get all data
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      classes:class_id (
        name,
        start_time,
        end_time,
        clubs:club_id (name, image_url)
      ),
      clubs:club_id (name, image_url)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existingBooking) {
    throw new Error("Bokning hittades inte");
  }

  // Only process if the booking was pending (not already scanned)
  if (existingBooking.status !== BookingStatus.PENDING) {
    throw new Error("Bokning har redan använts");
  }

  // DELETE THE BOOKING FIRST - this acts as an atomic lock
  // Only one call can successfully delete it, preventing duplicate visits
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (deleteError) throw deleteError;

  // Now create visit record (source of truth)
  // If we get here, we're the only call that deleted the booking
  const { error: visitError } = await supabase.from("visits").insert({
    user_id: existingBooking.user_id,
    club_id: existingBooking.club_id,
    credits_used: existingBooking.credits_used,
    visit_date: new Date().toISOString(),
  });

  if (visitError) throw visitError;

  // Deduct credits
  if (existingBooking.credits_used > 0) {
    await updateMembershipCredits(
      existingBooking.user_id,
      existingBooking.credits_used,
    );
  }

  // Fetch user profile for the response
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("id", existingBooking.user_id)
    .maybeSingle();

  console.log("[completeBooking] Booking deleted successfully:", bookingId);

  return { ...existingBooking, profiles: profile };
}
