import { supabase } from '@/src/lib/integrations/supabase/supabaseClient';
import { Booking } from '@/types';
import { useEffect } from 'react';

interface UseBookingRealtimeProps {
  booking: Booking | null;
  enabled: boolean;
  onStatusChange: (status: string) => void;
}

/**
 * Hook to listen for real-time updates to a booking
 * Used to detect when a club scans and completes a booking
 */
export const useBookingRealtime = ({
  booking,
  enabled,
  onStatusChange,
}: UseBookingRealtimeProps) => {
  useEffect(() => {
    if (!enabled || !booking || booking.status !== 'confirmed') return;

    const channel = supabase
      .channel(`booking:${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            onStatusChange(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, booking, onStatusChange]);
};
