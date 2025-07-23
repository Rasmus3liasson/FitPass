import { Calendar, CreditCard, MapPin, Zap } from "lucide-react-native";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ViewAllModal } from "./ViewAllModal";

interface RecentBooking {
  id: string;
  facility: string;
  facilityImage: string;
  date: string;
  time: string;
  credits: number;
  type: 'class' | 'visit';
  className?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

interface RecentBookingsModalProps {
  visible: boolean;
  onClose: () => void;
  bookings: RecentBooking[];
  title?: string;
}

export function RecentBookingsModal({
  visible,
  onClose,
  bookings,
  title = "Recent Bookings"
}: RecentBookingsModalProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'credits'>('newest');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const getSortedAndFilteredBookings = () => {
    let filtered = bookings;
    
    if (typeFilter) {
      filtered = bookings.filter(booking => booking.type === typeFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'credits':
          return b.credits - a.credits;
        default:
          return 0;
      }
    });
  };

  const sortedBookings = getSortedAndFilteredBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderBooking = (booking: RecentBooking) => (
    <TouchableOpacity className="bg-surface rounded-2xl p-4">
      <View className="flex-row">
        {/* Facility Image */}
        <Image
          source={{ uri: booking.facilityImage }}
          className="w-16 h-16 rounded-xl"
        />
        
        {/* Booking Info */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white font-semibold text-base" numberOfLines={1}>
                {booking.className || 'Direct Visit'}
              </Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#A0A0A0" />
                <Text className="text-gray-400 text-sm ml-2" numberOfLines={1}>
                  {booking.facility}
                </Text>
              </View>
            </View>
            
            <View 
              className="px-2 py-1 rounded-full ml-2"
              style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
            >
              <Text 
                className="text-xs font-medium"
                style={{ color: getStatusColor(booking.status) }}
              >
                {getStatusLabel(booking.status)}
              </Text>
            </View>
          </View>

          {/* Date & Time */}
          <View className="flex-row items-center mb-2">
            <Calendar size={14} color="#A0A0A0" />
            <Text className="text-gray-400 text-sm ml-2">
              {booking.date} • {booking.time}
            </Text>
          </View>

          {/* Credits & Type */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Zap size={14} color="#FFCA28" />
              <Text className="text-yellow-400 text-sm ml-2 font-medium">
                {booking.credits} credit{booking.credits !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <View className={`px-2 py-1 rounded-full ${
                booking.type === 'class' ? 'bg-blue-500/20' : 'bg-green-500/20'
              }`}>
                <Text className={`text-xs font-medium ${
                  booking.type === 'class' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {booking.type === 'class' ? 'Class' : 'Visit'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const totalCredits = bookings.reduce((sum, booking) => sum + booking.credits, 0);
  const classCount = bookings.filter(b => b.type === 'class').length;
  const visitCount = bookings.filter(b => b.type === 'visit').length;

  return (
    <ViewAllModal
      visible={visible}
      onClose={onClose}
      title={title}
      stats={{
        mainValue: bookings.length.toString(),
        mainLabel: 'bookings',
        subValue: `${totalCredits} credits used`,
        subLabel: '',
      }}
      filterOptions={[
        { key: 'newest', label: 'Newest First', icon: Calendar },
        { key: 'oldest', label: 'Oldest First', icon: Calendar },
        { key: 'credits', label: 'Most Credits', icon: CreditCard },
      ]}
      selectedFilter={sortBy}
      onFilterChange={(filter) => setSortBy(filter as any)}
      secondaryFilters={{
        options: [
          { key: null, label: `All (${bookings.length})` },
          { key: 'class', label: `Classes (${classCount})` },
          { key: 'visit', label: `Visits (${visitCount})` },
        ],
        selected: typeFilter,
        onSelectionChange: setTypeFilter
      }}
      data={sortedBookings}
      renderItem={renderBooking}
      emptyState={{
        icon: <Calendar size={24} color="#6366F1" />,
        title: "No bookings found",
        subtitle: "Your booking history will appear here"
      }}
    />
  );
}
