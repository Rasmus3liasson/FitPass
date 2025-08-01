import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useCompleteBooking } from "@/src/hooks/useBookings";
import { getBooking } from "@/src/lib/integrations/supabase/queries/bookingQueries";

// ⚠️ FIXED IMPORTS
import { CameraView, useCameraPermissions } from "expo-camera";

import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const completeBooking = useCompleteBooking();

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    try {
      const qrData = JSON.parse(data);
      if (!qrData.bookingId)
        throw new Error("Invalid QR code: missing bookingId");

      // Fetch booking from backend
      const booking = await getBooking(qrData.bookingId);
      if (!booking) throw new Error("Booking not found.");
      if (booking.status !== "confirmed") {
        Alert.alert(
          "Invalid QR",
          "This booking has already been used or is not valid."
        );
        return;
      }

      await completeBooking.mutateAsync(qrData.bookingId);
      Alert.alert(
        "Check-in Success",
        `Booking ${qrData.bookingId} marked as checked in!`
      );
    } catch (err: any) {
      Alert.alert("QR Code Error", err.message || "Failed to process QR code.");
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background p-4">
          <Text className="text-white text-lg mb-4">Camera access needed</Text>
          <Text className="text-gray-400 text-sm mb-4">{debugInfo}</Text>
          <Text className="text-gray-300 text-center mb-6">
            FitPass needs camera access to scan QR codes for check-ins.
          </Text>
          <Button title="Grant Camera Permission" onPress={requestPermission} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background p-4">
        <Text className="text-white text-2xl font-bold mb-4 text-center">
          Scan QR Code
        </Text>

        {/* Debug info */}
        <Text className="text-gray-400 text-xs mb-2 text-center">
          {debugInfo}
        </Text>

        <View className="flex-1 rounded-2xl overflow-hidden mb-4 bg-black">
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            className="flex-1"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            facing="back"
          />
        </View>

        {scanned && (
          <View className="mb-4">
            <Button
              title="Tap to Scan Again"
              onPress={() => setScanned(false)}
            />
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
