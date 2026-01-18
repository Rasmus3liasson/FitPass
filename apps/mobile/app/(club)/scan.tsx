import { colors, openAppSettings } from "@shared";
import { FeedbackComponent } from "@shared/components/FeedbackComponent";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { useCompleteBooking } from "@shared/hooks/useBookings";
import { useFeedback } from "@shared/hooks/useFeedback";
import {
  getBooking,
  getBookingByCode,
} from "@shared/lib/integrations/supabase/queries/bookingQueries";
import { BookingStatus } from "@shared/types";

import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { GearIcon } from "phosphor-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const completeBooking = useCompleteBooking();
  const { showSuccess, showError, feedback, hideFeedback } = useFeedback();
  const { showError: showGlobalError } = useGlobalFeedback();

  const processBooking = async (code: string, bookingId?: string) => {
    setIsLoading(true);
    try {
      let booking;

      // If we have a booking ID from QR, use it directly
      if (bookingId) {
        booking = await getBooking(bookingId);
      } else {
        // Otherwise, find booking by code
        booking = await getBookingByCode(code);
      }

      if (!booking) {
        throw new Error("Bokningskod hittades inte");
      }

      // Accept both 'pending' and 'confirmed' bookings
      if (
        booking.status !== BookingStatus.CONFIRMED &&
        booking.status !== BookingStatus.PENDING
      ) {
        showError(
          "Ogiltig bokning",
          "Denna bokning har redan använts eller är inte giltig",
        );
        setScanned(false);
        setIsLoading(false);
        return;
      }

      // Complete the booking using the mutation
      const completedBooking = await completeBooking.mutateAsync(booking.id);

      const className = `för ${
        completedBooking.classes?.name || "för träningspass"
      }`;
      const userName =
        completedBooking.profiles?.display_name ||
        completedBooking.profiles?.first_name ||
        "Medlem";

      showSuccess(
        "Incheckning Godkänd!",
        `${userName} är incheckad ${className}. Välkommen!`,
      );

      // Reset state after successful check-in
      setBookingCode("");
      setScanned(false);
      setManualMode(false);
    } catch (err: any) {
      showError(
        "Incheckningsfel",
        err.message || "Kunde inte genomföra incheckning. Försök igen.",
      );
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isLoading) return;
    setScanned(true);

    try {
      const qrData = JSON.parse(data);

      // Check if it's our FitPass QR code format
      if (qrData.type !== "fitpass-checkin") {
        throw new Error("Ogiltig QR-kod format");
      }

      await processBooking(qrData.code, qrData.bookingId);
    } catch (err: any) {
      showError(
        "QR-kod Fel",
        err.message || "Kunde inte läsa QR-koden. Försök igen.",
      );
      setScanned(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!bookingCode || bookingCode.length !== 6) {
      showError("Ogiltig kod", "Bokningskoden måste vara 6 tecken");
      return;
    }
    await processBooking(bookingCode);
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      // Note: Consider implementing CustomAlert for confirmation dialogs
      // Show error and prompt to open settings
      showGlobalError(
        "Kameratillstånd Krävs",
        "För att skanna QR-koder behöver appen åtkomst till kameran. Gå till inställningar för att aktivera kameratillstånd.",
      );
      // Optionally open settings automatically
      // handleOpenSettings();
    }
  };

  const handleOpenSettings = async () => {
    const opened = await openAppSettings();
    if (!opened) {
      showGlobalError(
        "Kunde inte öppna inställningar",
        "Gå till Inställningar > FitPass > Kamera för att aktivera kameratillstånd.",
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background p-4">
          <Text className="text-textPrimary text-lg mb-4">
            Laddar kamera...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 justify-center items-center bg-background px-6">
          <Text className="text-textPrimary text-2xl font-bold mb-3 text-center">
            Kameratillstånd Krävs
          </Text>

          <Text className="text-textSecondary text-center mb-8 px-4 leading-6">
            För att skanna QR-koder behöver FitPass åtkomst till din kamera.
          </Text>

          <TouchableOpacity
            className="bg-primary w-full rounded-xl py-4 mb-3"
            onPress={handleRequestPermission}
            style={{
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-textPrimary text-center font-semibold text-base">
              Ge Kameratillstånd
            </Text>
          </TouchableOpacity>

          {!permission.canAskAgain && (
            <TouchableOpacity
              className="bg-surface w-full rounded-xl py-4 flex-row items-center justify-center"
              onPress={handleOpenSettings}
            >
              <GearIcon size={18} color={colors.textSecondary} />
              <Text className="text-textSecondary font-medium ml-2">
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
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 p-4">
          <Text className="text-textPrimary text-2xl font-bold mb-2 text-center">
            Skanna Incheckningskod
          </Text>
          <Text className="text-textSecondary text-center mb-6">
            {manualMode ? "Ange 6-siffrig kod" : "Rikta kameran mot QR-koden"}
          </Text>

          {!manualMode ? (
            <>
              <View className="flex-1 rounded-2xl overflow-hidden mb-4 bg-black relative">
                <CameraView
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={{ flex: 1 }}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  facing="back"
                  autofocus="on"
                />

                {/* Scanning overlay */}
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  <View className="w-64 h-64 border-2 border-white border-dashed rounded-2xl" />
                  <Text className="text-white mt-6 text-center font-medium">
                    Positionera QR-koden i rutan
                  </Text>
                </View>

                {scanned && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <Text className="text-white text-lg font-bold">
                      Bearbetar...
                    </Text>
                  </View>
                )}
              </View>

              {/* Switch to Manual Mode */}
              <TouchableOpacity
                className="bg-surface rounded-2xl py-4 mb-4 flex-row items-center justify-center"
                onPress={() => setManualMode(true)}
                disabled={isLoading}
              >
                <Text className="text-textPrimary font-semibold ml-2">
                  Ange kod manuellt
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Manual Code Entry */}
              <View className="flex-1 justify-center">
                <View className="bg-surface rounded-2xl p-6 mb-4">
                  <Text className="text-textSecondary text-sm mb-2 text-center">
                    Bokningskod
                  </Text>
                  <TextInput
                    className="text-textPrimary text-4xl font-bold text-center tracking-widest py-4"
                    value={bookingCode}
                    onChangeText={(text) => setBookingCode(text.toUpperCase())}
                    placeholder="ABC123"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    editable={!isLoading}
                  />
                  <Text className="text-textSecondary text-xs text-center mt-2">
                    6 tecken (bokstäver och siffror)
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  className={`rounded-2xl py-4 mb-4 ${
                    bookingCode.length === 6 && !isLoading
                      ? "bg-primary"
                      : "bg-surface"
                  }`}
                  onPress={handleManualSubmit}
                  disabled={bookingCode.length !== 6 || isLoading}
                  style={{
                    shadowColor:
                      bookingCode.length === 6 ? colors.primary : "transparent",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: bookingCode.length === 6 ? 6 : 0,
                  }}
                >
                  <Text
                    className={`text-center font-bold text-lg ${
                      bookingCode.length === 6
                        ? "text-white"
                        : "text-textSecondary"
                    }`}
                  >
                    {isLoading ? "Bearbetar..." : "Bekräfta Incheckning"}
                  </Text>
                </TouchableOpacity>

                {/* Switch to Camera Mode */}
                <TouchableOpacity
                  className="bg-surface rounded-2xl py-4 flex-row items-center justify-center"
                  onPress={() => {
                    setManualMode(false);
                    setBookingCode("");
                    setScanned(false);
                  }}
                  disabled={isLoading}
                >
                  <Text className="text-textSecondary font-semibold">
                    Tillbaka till kamera
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {!manualMode && scanned && (
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 mb-4"
              onPress={() => setScanned(false)}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Skanna Igen
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      <FeedbackComponent
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        buttonText={feedback.buttonText}
        onClose={hideFeedback}
        onButtonPress={feedback.onButtonPress}
        autoClose={feedback.autoClose}
        autoCloseDelay={feedback.autoCloseDelay}
      />
    </SafeAreaWrapper>
  );
}
