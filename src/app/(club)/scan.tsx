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
          "Ogiltig QR",
          "Denna bokning har redan använts eller är inte giltig."
        );
        return;
      }

      await completeBooking.mutateAsync(qrData.bookingId);
      Alert.alert(
        "Incheckning Framgångsrik",
        `Bokning ${qrData.bookingId} markerad som incheckad!`
      );
    } catch (err: any) {
      Alert.alert("QR-kod Fel", err.message || "Misslyckades att bearbeta QR-kod.");
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background p-4">
          <Text className="text-textPrimary text-lg mb-4">Kameraåtkomst krävs</Text>
          <Text className="text-textSecondary text-sm mb-4">{debugInfo}</Text>
          <Text className="text-textSecondary text-center mb-6">
            {process.env.APP_NAME} behöver kameraåtkomst för att skanna QR-koder för incheckningar.
          </Text>
          <Button title="Ge Kameratillstånd" onPress={requestPermission} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background p-4">
        <Text className="text-textPrimary text-2xl font-bold mb-4 text-center">
          Skanna QR-kod
        </Text>

        {/* Debug info */}
        <Text className="text-textSecondary text-xs mb-2 text-center">
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
              title="Tryck för att Skanna Igen"
              onPress={() => setScanned(false)}
            />
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
