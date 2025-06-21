import { useBooking, useBookingQRCode } from "@/src/hooks/useBookings";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";

export default function CheckinScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const { data: booking, isLoading: isLoadingBooking } = useBooking(bookingId as string);
  const {
    data: qrCodeUrl,
    isLoading: isLoadingQRCode,
    isError,
    error,
  } = useBookingQRCode(bookingId as string);

  const [remainingTime, setRemainingTime] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (booking && !booking.class_id) {
      const expirationTime = new Date(booking.created_at).getTime() + 24 * 60 * 60 * 1000;

      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationTime - now;

        if (distance < 0) {
          clearInterval(timer);
          setIsExpired(true);
          setRemainingTime("");
          return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [booking]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'white' }}>
      <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 60, left: 20, zIndex: 1 }}>
        <ArrowLeft size={24} color="black" />
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Check-in QR Code
      </Text>
      {(isLoadingBooking || isLoadingQRCode) && <ActivityIndicator size="large" />}
      {isError && (
        <Text style={{ color: "red" }}>
          Error generating QR code: {error?.message}
        </Text>
      )}
      {isExpired && (
        <View style={{ alignItems: 'center' }}>
          <RefreshCw size={48} color="orange" />
          <Text style={{ fontSize: 18, color: "orange", marginTop: 10 }}>This QR code has expired.</Text>
          <Text style={{ marginTop: 20, textAlign: 'center', paddingHorizontal: 40 }}>
            Direct visit QR codes are only valid for 24 hours.
          </Text>
        </View>
      )}
      {!isExpired && qrCodeUrl && (
        <>
          <Image
            source={{ uri: qrCodeUrl }}
            style={{ width: 250, height: 250 }}
          />
           {remainingTime && (
            <Text style={{ marginTop: 10, fontSize: 16, fontWeight: 'bold' }}>
              Expires in: {remainingTime}
            </Text>
          )}
          <Text style={{ marginTop: 20, textAlign: 'center', paddingHorizontal: 40 }}>
            Show this QR code at the reception to check in.
          </Text>
        </>
      )}
    </View>
  );
} 