/**
 * Booking Hooks
 *
 * Provides hooks for managing bookings with real-time updates.
 *
 * @example
 * // Basic usage
 * const { data: bookings } = useUserBookings(userId);
 *
 * @example
 * // With realtime updates (replaces old useBookingRealtime)
 * const { data: booking } = useBooking(bookingId, {
 *   enableRealtime: true,
 *   onStatusChange: (status, booking) => {
 *     console.log('Status changed to:', status);
 *   }
 * });
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  bookDirectVisit,
  cancelBooking,
  completeBooking,
  getBooking,
  getBookingQRCode,
  getUserBookings,
} from "../lib/integrations/supabase/queries/bookingQueries";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { Booking, BookingStatus } from "../types";

/**
 * Validate if user can book at a gym with Daily Access membership
 */
export async function validateDailyAccessBooking(
  userId: string,
  clubId: string,
): Promise<{ valid: boolean; error?: string }> {
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

  if (membershipError) {
    return { valid: false, error: "Kunde inte hämta medlemskap" };
  }

  // Check if this is a Daily Access membership
  const maxDailyGyms = membership?.membership_plans?.max_daily_gyms || 0;
  const planTitle = membership?.membership_plans?.title?.toLowerCase() || "";
  const isDailyAccessPlan =
    planTitle.includes("premium") ||
    planTitle.includes("daily access") ||
    planTitle.includes("unlimited") ||
    maxDailyGyms >= 3;

  // If not a Daily Access plan, no validation needed
  if (!isDailyAccessPlan) {
    return { valid: true };
  }

  // Check user's selected gyms
  const { data: selectedGyms, error: gymsError } = await supabase
    .from("user_selected_gyms")
    .select("status, club_id")
    .eq("user_id", userId)
    .in("status", ["active", "pending"]);

  if (gymsError) {
    return { valid: false, error: "Kunde inte hämta gym-val" };
  }

  const activeGyms = selectedGyms?.filter((g) => g.status === "active") || [];
  const pendingGyms = selectedGyms?.filter((g) => g.status === "pending") || [];

  // Block booking if user has pending gyms but no active gyms
  if (pendingGyms.length > 0 && activeGyms.length === 0) {
    return {
      valid: false,
      error: "Du måste bekräfta dina Daily Access gym-val innan du kan boka.",
    };
  }

  // Check if this gym is in their active selection
  const isGymSelected = activeGyms.some((g) => g.club_id === clubId);
  if (!isGymSelected) {
    return {
      valid: false,
      error: "Detta gym är inte inkluderat i din Daily Access.",
    };
  }

  return { valid: true };
}

export const useUserBookings = (userId: string) => {
  return useQuery({
    queryKey: ["userBookings", userId],
    queryFn: () => getUserBookings(userId),
    enabled: !!userId,
  });
};

export const useBooking = (
  bookingId: string,
  options?: {
    enableRealtime?: boolean;
    onStatusChange?: (status: string, booking: Booking) => void;
  },
) => {
  const queryClient = useQueryClient();
  const { enableRealtime = false, onStatusChange } = options || {};

  const query = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
  });

  // Realtime subscription for booking changes (updates and deletes)
  useEffect(() => {
    if (!enableRealtime || !bookingId || !query.data) return;

    const booking = query.data;

    // Only listen for updates on active bookings (pending or confirmed)
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      return;
    }

    const channel = supabase
      .channel(`booking:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload: any) => {
          if (payload.new) {
            // Update the query cache with new data
            queryClient.setQueryData(["booking", bookingId], payload.new);

            // Call the status change callback if provided
            if (onStatusChange && payload.new.status) {
              onStatusChange(payload.new.status, payload.new);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload: any) => {
          console.log("[useBooking] Booking deleted (scanned):", bookingId);
          // Set query data to null to indicate booking was deleted
          queryClient.setQueryData(["booking", bookingId], null);

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ["userBookings"] });
          queryClient.invalidateQueries({ queryKey: ["membership"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, bookingId, query.data, queryClient, onStatusChange]);

  return query;
};

export const useBookingQRCode = (bookingId: string) => {
  return useQuery({
    queryKey: ["bookingQRCode", bookingId],
    queryFn: () => getBookingQRCode(bookingId),
    enabled: !!bookingId,
  });
};

export const useBookDirectVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      clubId,
      creditsToUse,
    }: {
      userId: string;
      clubId: string | null;
      creditsToUse?: number;
    }) => {
      // Validate Daily Access before booking if clubId exists
      if (clubId) {
        const validation = await validateDailyAccessBooking(userId, clubId);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return bookDirectVisit(userId, clubId, creditsToUse);
    },
    // Optimistic update
    onMutate: async (variables) => {
      const { userId, clubId } = variables;
      await queryClient.cancelQueries({ queryKey: ["userBookings", userId] });
      const previousBookings = queryClient.getQueryData<Booking[]>([
        "userBookings",
        userId,
      ]);

      // Create a fake booking object for optimistic update
      // Status is 'pending' until scanned by club
      const optimisticBooking: Booking = {
        id: `optimistic-${Date.now()}`,
        user_id: userId,
        class_id: "",
        credits_used: variables.creditsToUse || 1,
        status: BookingStatus.PENDING, // Changed from 'confirmed' to 'pending'
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clubs: clubId
          ? { name: "Direct Visit", image_url: undefined }
          : undefined,
        classes: undefined,
      };

      queryClient.setQueryData<Booking[]>(["userBookings", userId], (old) =>
        old ? [optimisticBooking, ...old] : [optimisticBooking],
      );

      return { previousBookings, userId };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousBookings && context.userId) {
        queryClient.setQueryData(
          ["userBookings", context.userId],
          context.previousBookings,
        );
      }
      // Don't log validation errors to console - they're handled in the UI
      const isValidationError =
        err instanceof Error &&
        (err.message.includes("bekräfta dina Daily Access") ||
          err.message.includes("inte inkluderat i din Daily Access"));
      if (!isValidationError) {
        console.error("Booking error:", err);
      }
    },
    // Always refetch after success or error
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userBookings", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      await queryClient.invalidateQueries({ queryKey: ["membership"] });
      await queryClient.invalidateQueries({ queryKey: ["allClasses"] });
      await queryClient.invalidateQueries({ queryKey: ["classesByClub"] });
    },
  });
};

export const useCompleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => completeBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      await queryClient.invalidateQueries({ queryKey: ["membership"] });
      await queryClient.invalidateQueries({ queryKey: ["visits"] });
      await queryClient.invalidateQueries({ queryKey: ["allClasses"] });
      await queryClient.invalidateQueries({ queryKey: ["classesByClub"] });
    },
  });
};
