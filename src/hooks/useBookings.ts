import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookDirectVisit,
  cancelBooking,
  getBooking,
  getBookingQRCode,
  getUserBookings,
} from "../lib/integrations/supabase/queries/bookingQueries";
import type { Booking } from "../types";

export const useUserBookings = (userId: string) => {
  return useQuery({
    queryKey: ["userBookings", userId],
    queryFn: () => getUserBookings(userId),
    enabled: !!userId,
  });
};

export const useBooking = (bookingId: string) => {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
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
    // Optimistic update
    onMutate: async (variables) => {
      const { userId, clubId } = variables;
      await queryClient.cancelQueries({ queryKey: ["userBookings", userId] });
      const previousBookings = queryClient.getQueryData<Booking[]>(["userBookings", userId]);

      // Create a fake booking object for optimistic update
      const optimisticBooking: Booking = {
        id: `optimistic-${Date.now()}`,
        user_id: userId,
        class_id: "",
        credits_used: variables.creditsToUse || 1,
        status: "confirmed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clubs: clubId ? { name: "Direct Visit", image_url: undefined } : undefined,
        classes: undefined,
      };

      queryClient.setQueryData<Booking[]>(["userBookings", userId], (old) =>
        old ? [optimisticBooking, ...old] : [optimisticBooking]
      );

      return { previousBookings, userId };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousBookings && context.userId) {
        queryClient.setQueryData(["userBookings", context.userId], context.previousBookings);
      }
    },
    // Always refetch after success or error
    onSettled: (_, __, variables) => {
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