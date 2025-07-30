import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useCompleteBooking } from "@/src/hooks/useBookings";
import { getBooking } from "@/src/lib/integrations/supabase/queries/bookingQueries";

// ⚠️ FIXED IMPORTS
import { CameraView, useCameraPermissions } from 'expo-camera';

import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const completeBooking = useCompleteBooking();

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      const qrData = JSON.parse(data);
      if (!qrData.bookingId) throw new Error("Invalid QR code: missing bookingId");

      // Fetch booking from backend
      const booking = await getBooking(qrData.bookingId);
      if (!booking) throw new Error("Booking not found.");
      if (booking.status !== "confirmed") {
        Alert.alert("Invalid QR", "This booking has already been used or is not valid.");
        return;
      }

      await completeBooking.mutateAsync(qrData.bookingId);
      Alert.alert("Check-in Success", `Booking ${qrData.bookingId} marked as checked in!`);
    } catch (err: any) {
      Alert.alert("QR Code Error", err.message || "Failed to process QR code.");
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No access to camera</Text>
        <Button title="Allow Camera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background p-4">
        <Text className="text-white text-2xl font-bold mb-4 text-center">Scan QR Code</Text>

        <View className="flex-1 rounded-2xl overflow-hidden mb-4 bg-black">
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            className="flex-1"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
        </View>

        {scanned && (
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        )}
      </View>
    </SafeAreaWrapper>
  );
}
