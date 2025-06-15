import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bookDirectVisit,
    cancelBooking,
    getBookingQRCode,
    getUserBookings,
} from "../lib/integrations/supabase/queries/bookingQueries";

export const useUserBookings = (userId: string) => {
  return useQuery({
    queryKey: ["userBookings", userId],
    queryFn: () => getUserBookings(userId),
    enabled: !!userId,
  });
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
    mutationFn: ({
      userId,
      clubId,
      creditsToUse,
    }: {
      userId: string;
      clubId: string | null;
      creditsToUse?: number;
    }) => bookDirectVisit(userId, clubId, creditsToUse),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userBookings", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: (_, bookingId) => {
      // Invalidate all bookings queries since we don't know the userId
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
}; 