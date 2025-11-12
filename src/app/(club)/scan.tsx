import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { openAppSettings } from "@/src/constants/routes";
import { useCompleteBooking } from "@/src/hooks/useBookings";
import { getBooking } from "@/src/lib/integrations/supabase/queries/bookingQueries";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const completeBooking = useCompleteBooking();

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isLoading) return;
    
    setScanned(true);
    setIsLoading(true);
    
    try {
      const qrData = JSON.parse(data);
      if (!qrData.bookingId)
        throw new Error("Ogiltig QR-kod: saknar boknings-ID");

      const booking = await getBooking(qrData.bookingId);
      if (!booking) throw new Error("Bokning hittades inte.");
      if (booking.status !== "confirmed") {
        Alert.alert(
          "Ogiltig QR-kod",
          "Denna bokning har redan använts eller är inte giltig."
        );
        return;
      }

      await completeBooking.mutateAsync(qrData.bookingId);
      Alert.alert(
        "Incheckning Genomförd!",
        `Bokning ${qrData.bookingId} har markerats som incheckad.`
      );
    } catch (err: any) {
      Alert.alert(
        "QR-kod Fel", 
        err.message || "Kunde inte bearbeta QR-koden. Försök igen."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        "Kameratillstånd Krävs",
        "För att skanna QR-koder behöver appen åtkomst till kameran. Gå till inställningar för att aktivera kameratillstånd.",
        [
          { text: "Avbryt", style: "cancel" },
          { text: "Öppna Inställningar", onPress: handleOpenSettings }
        ]
      );
    }
  };

  const handleOpenSettings = async () => {
    const opened = await openAppSettings();
    if (!opened) {
      Alert.alert(
        "Kunde inte öppna inställningar",
        "Gå till Inställningar > FitPass > Kamera för att aktivera kameratillstånd."
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background p-4">
          <Text className="text-textPrimary text-lg mb-4">Laddar kamera...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background p-4">
          <Text className="text-textPrimary text-2xl font-bold mb-4 text-center">
            Kameratillstånd Krävs
          </Text>
          <Text className="text-textSecondary text-center mb-6 px-4">
            För att skanna QR-koder behöver FitPass åtkomst till din kamera.
          </Text>
          <TouchableOpacity 
            className="bg-primary px-8 py-4 rounded-lg mb-4"
            onPress={handleRequestPermission}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Ge Kameratillstånd
            </Text>
          </TouchableOpacity>
          {!permission.canAskAgain && (
            <TouchableOpacity 
              className="bg-gray-600 px-8 py-3 rounded-lg mb-4"
              onPress={handleOpenSettings}
            >
              <Text className="text-white text-center font-medium">
                Öppna Inställningar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background p-4">
        <Text className="text-textPrimary text-2xl font-bold mb-6 text-center">
          Skanna QR-kod
        </Text>

        <View className="flex-1 rounded-2xl overflow-hidden mb-6 bg-black relative">
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={{ flex: 1 }}
            barcodeScannerSettings={{ 
              barcodeTypes: ["qr"],
            }}
            facing="back"
          />
          
          {/* Scanning overlay */}
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <View className="w-64 h-64 border-2 border-white border-dashed rounded-2xl" />
            <Text className="text-white mt-6 text-center font-medium">
              Rikta kameran mot QR-koden
            </Text>
          </View>

          {isLoading && (
            <View className="absolute inset-0 bg-black bg-opacity-70 items-center justify-center">
              <Text className="text-white text-lg font-medium">Bearbetar...</Text>
            </View>
          )}
        </View>

        {scanned && (
          <TouchableOpacity 
            className="bg-primary px-8 py-4 rounded-lg"
            onPress={() => {
              setScanned(false);
              setIsLoading(false);
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Skanna Igen
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
