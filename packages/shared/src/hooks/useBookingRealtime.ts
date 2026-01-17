import { useEffect } from "react";
import { supabase } from "../lib/integrations/supabase/supabaseClient";
import { Booking, BookingStatus } from "../types";

interface UseBookingRealtimeProps {
  booking: Booking | null;
  enabled: boolean;
  onStatusChange: (status: string) => void;
}

/**
 * Hook to listen for real-time updates to a booking
 * Used to detect when a club scans and completes a booking (status: pending -> completed)
 */
export const useBookingRealtime = ({
  booking,
  enabled,
  onStatusChange,
}: UseBookingRealtimeProps) => {
  useEffect(() => {
    if (!enabled || !booking) return;

    // Listen for updates on bookings with 'pending' or 'confirmed' status
    // (both can transition to 'completed' when scanned)
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    )
      return;

    const channel = supabase
      .channel(`booking:${booking.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${booking.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            onStatusChange(payload.new.status);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, booking, onStatusChange]);
};
