import { Section } from "@/src/components/Section";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserBookings } from "@/src/hooks/useBookings";
import { format } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react-native";
import { Text, View } from "react-native";

export const UpcomingBooking = () => {
  const { userProfile } = useAuth();
  const { data: bookings, isLoading } = useUserBookings(userProfile?.id || "");

  // Get the next upcoming booking
  const nextBooking = bookings?.find(
    (booking) => new Date(booking.classes?.start_time || "") > new Date()
  );

  if (isLoading) {
    return (
      <View className="bg-surface rounded-xl mt-4 p-4">
        <Text className="text-textSecondary">Loading bookings...</Text>
      </View>
    );
  }

  if (!nextBooking) {
    return null;
  }

  const startTime = new Date(nextBooking.classes?.start_time || "");
  const endTime = new Date(nextBooking.classes?.end_time || "");
  const isToday =
    format(startTime, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <Section
      title="Nearby Facilities"
      description="Check out these locations close to you"
      actionText="View Map"
    >
      <View className="bg-surface rounded-xl mt-4 flex-row overflow-hidden">
        <View className="w-1 bg-primary" />
        <View className="p-4 flex-1">
          <Text className="text-base font-bold text-textPrimary mb-3">
            {nextBooking.classes?.name || "Direct Visit"}
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center space-x-2">
              <MapPin size={16} color="#A0A0A0" />
              <Text className="text-sm text-textSecondary">
                {nextBooking.classes?.clubs?.name || "Direct Visit"}
              </Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <Calendar size={16} color="#A0A0A0" />
              <Text className="text-sm text-textSecondary">
                {isToday ? "Today" : format(startTime, "MMM d, yyyy")}
              </Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <Clock size={16} color="#A0A0A0" />
              <Text className="text-sm text-textSecondary">
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Section>
  );
};
