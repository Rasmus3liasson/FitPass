import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react-native";
import HeadingLeft from "@/src/components/HeadingLeft";
import { CheckInModal } from "@/src/components/CheckInModal";

export default function CheckInScreen() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Sample bookings data
  const upcomingBookings = [
    {
      id: "1",
      className: "Power Yoga",
      facilityName: "Zen Studio",
      date: "Today",
      time: "7:00 PM - 8:00 PM",
      instructor: "Sarah Johnson",
      image: "https://images.pexels.com/photos/1812964/pexels-photo-1812964.jpeg",
      credits: 1,
      status: "confirmed",
    },
    {
      id: "2",
      className: "HIIT Training",
      facilityName: "PowerFit Gym",
      date: "Tomorrow",
      time: "6:30 AM - 7:15 AM",
      instructor: "Mike Chen",
      image: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
      credits: 1,
      status: "confirmed",
    },
    {
      id: "3",
      className: "Swimming Session",
      facilityName: "AquaLife Center",
      date: "Dec 12",
      time: "8:00 AM - 9:00 AM",
      instructor: "Emma Wilson",
      image: "https://images.pexels.com/photos/261185/pexels-photo-261185.jpeg",
      credits: 1,
      status: "confirmed",
    },
  ];

  const pastBookings = [
    {
      id: "4",
      className: "CrossFit Fundamentals",
      facilityName: "CrossFit Central",
      date: "Yesterday",
      time: "6:30 PM - 7:30 PM",
      instructor: "Alex Rodriguez",
      image: "https://images.pexels.com/photos/28080/pexels-photo.jpg",
      credits: 2,
      status: "completed",
    },
    {
      id: "5",
      className: "Pilates",
      facilityName: "Zen Studio",
      date: "Dec 8",
      time: "10:00 AM - 11:00 AM",
      instructor: "Lisa Park",
      image: "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg",
      credits: 1,
      status: "completed",
    },
  ];

  const handleBookingPress = (booking: any) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const renderBookingCard = (booking: any, isUpcoming: boolean = true) => (
    <TouchableOpacity
      key={booking.id}
      className="bg-surface rounded-2xl p-4 mb-4 shadow-lg"
      onPress={() => handleBookingPress(booking)}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg mb-1">
            {booking.className}
          </Text>
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {booking.facilityName}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-2">
          {isUpcoming && (
            <View className="bg-primary rounded-full p-2">
              <QrCode size={20} color="#FFFFFF" />
            </View>
          )}
          <View
            className={`px-3 py-1 rounded-full ${
              booking.status === "confirmed"
                ? "bg-green-500/20"
                : "bg-gray-500/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                booking.status === "confirmed"
                  ? "text-green-400"
                  : "text-gray-400"
              }`}
            >
              {booking.status}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Calendar size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {booking.date}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {booking.time}
            </Text>
          </View>
        </View>
        <View className="bg-primary/10 px-3 py-1 rounded-full">
          <Text className="text-primary text-xs font-semibold">
            {booking.credits} credit{booking.credits !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {booking.instructor && (
        <View className="mt-3 pt-3 border-t border-borderGray">
          <Text className="text-textSecondary text-sm">
            Instructor: {booking.instructor}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <HeadingLeft title="Check In" subtitle="Your bookings and classes" />

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Upcoming Bookings */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-xl">
                Upcoming Classes
              </Text>
              <Text className="text-primary text-sm font-semibold">
                {upcomingBookings.length} booked
              </Text>
            </View>

            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => renderBookingCard(booking, true))
            ) : (
              <View className="bg-surface rounded-2xl p-6 items-center">
                <QrCode size={48} color="#A0A0A0" />
                <Text className="text-textSecondary text-center mt-4">
                  No upcoming bookings
                </Text>
                <Text className="text-textSecondary text-center text-sm mt-1">
                  Book a class to see it here
                </Text>
              </View>
            )}
          </View>

          {/* Past Bookings */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-xl">Recent Classes</Text>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-semibold">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {pastBookings.map((booking) => renderBookingCard(booking, false))}
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="text-white font-bold text-xl mb-4">
              Quick Actions
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity className="flex-1 bg-primary rounded-2xl p-4 items-center">
                <QrCode size={24} color="#FFFFFF" />
                <Text className="text-white font-semibold mt-2">
                  Direct Check-in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-surface rounded-2xl p-4 items-center">
                <Calendar size={24} color="#6366F1" />
                <Text className="text-white font-semibold mt-2">
                  Book Class
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Check-in Modal */}
        <CheckInModal
          visible={modalVisible}
          booking={selectedBooking}
          onClose={() => {
            setModalVisible(false);
            setSelectedBooking(null);
          }}
        />
      </View>
    </SafeAreaWrapper>
  );
}