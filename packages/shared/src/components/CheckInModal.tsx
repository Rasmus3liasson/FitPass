import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";
import { Clock, Copy, QrCode, Share } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Share as RNShare,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import colors from "../constants/custom-colors";
import { useBookingRealtime } from "../hooks/useBookingRealtime";
import { useCompleteBooking } from "../hooks/useBookings";
import { useFeedback } from "../hooks/useFeedback";
import { Booking } from "../types";
import { calculateCountdown, getCountdownStatus } from "../utils/countdown";
import { formatSwedishTime } from "../utils/time";
import { FeedbackComponent } from "./FeedbackComponent";
import { SwipeableModal } from "./SwipeableModal";

const { width, height } = Dimensions.get("window");

interface CheckInModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export function CheckInModal({ visible, booking, onClose }: CheckInModalProps) {
  const completeBooking = useCompleteBooking();
  const { showSuccess, showError, feedback, hideFeedback } = useFeedback();
  const [countdown, setCountdown] = useState<string>("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Handle booking status changes from real-time updates
  const handleStatusChange = (status: string) => {
    if (status === "completed") {
      const gname =
        booking?.classes?.clubs?.name || booking?.clubs?.name || "gymmet";

      setIsCheckingIn(true);

      showSuccess("Du är incheckad!", `Ha en bra träning på ${gname}!`, {
        onButtonPress: () => {
          setIsCheckingIn(false);
          hideFeedback();
          onClose();
        },
      });
    }
  };

  // Listen for real-time booking updates
  useBookingRealtime({
    booking,
    enabled: visible,
    onStatusChange: handleStatusChange,
  });

  // Countdown effect
  useEffect(() => {
    if (!visible || !booking) return;

    const bookingEndTime = booking?.end_time || booking?.classes?.end_time;
    if (!bookingEndTime) return;

    const updateCountdown = () => {
      const result = calculateCountdown(bookingEndTime);
      setCountdown(result.timeLeft);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [visible, booking]);

  const className = booking?.classes?.name || "Direktbesök";
  const facilityName = booking?.classes?.clubs?.name || booking?.clubs?.name;

  const date = booking ? format(
    new Date(booking.classes?.start_time || booking.created_at),
    "MMM d, yyyy"
  ) : "";
  const time = booking?.classes
    ? formatSwedishTime(booking.classes.start_time)
    : "När som helst";

  // Use real booking code
  const bookingCode = booking
    ? (booking.booking_code || booking.id.slice(0, 6).toUpperCase())
    : "";

  // Data encoded in QR
  const qrData = JSON.stringify({
    code: bookingCode,
    bookingId: booking?.id,
    type: "fitpass-checkin",
    timestamp: new Date().getTime(),
  });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(bookingCode);
    showSuccess(
      "Kopierad!",
      `Bokningskod ${bookingCode} kopierad till urklipp`
    );
  };

  const bookingEndTime = booking?.end_time || booking?.classes?.end_time;
  const countdownStatus = bookingEndTime
    ? getCountdownStatus(bookingEndTime)
    : null;

  if (!booking) return null;

  return (
    <>
      <SwipeableModal
        visible={visible && !isCheckingIn}
        onClose={onClose}
        snapPoint={0.9}
        backdropOpacity={0.5}
      >
        {/* Class Info Card */}
        <View className="px-6 mb-4">
          <View className="bg-surface rounded-2xl p-4">
            <Text className="text-textPrimary text-xl font-bold mb-2">
              {className}
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-textSecondary">
                  {date} • {time}
                </Text>
              </View>

              {countdownStatus && (
                <View
                  className={`px-3 py-1 rounded-full ${
                    countdownStatus.color === "green"
                      ? "bg-accentGreen/20"
                      : countdownStatus.color === "yellow"
                      ? "bg-accentYellow/20"
                      : "bg-accentRed/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      countdownStatus.color === "green"
                        ? "text-accentGreen"
                        : countdownStatus.color === "yellow"
                        ? "text-accentYellow"
                        : "text-accentRed"
                    }`}
                  >
                    {countdown}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View className="px-6 py-6">
          <View className="items-center">
            {/* QR */}
            <View
              className="rounded-2xl p-6 bg-white mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <QRCode
                value={qrData}
                size={220}
                backgroundColor="white"
                color="black"
              />
            </View>

            {/* Booking Code */}
            <TouchableOpacity
              onPress={handleCopyCode}
              className="bg-surface rounded-2xl px-6 py-4 mb-4 flex-row items-center justify-between mt-5"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-1">
                <Text className="text-textSecondary text-xs mb-1">
                  Bokningskod
                </Text>
                <Text className="text-textPrimary text-3xl font-bold tracking-widest">
                  {bookingCode}
                </Text>
              </View>
              <Copy size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Status */}
            {/* <View
            className={`rounded-full px-4 py-2 mb-4 ${
              countdownStatus?.color === "green"
                ? "bg-accentGreen/20"
                : countdownStatus?.color === "yellow"
                ? "bg-accentYellow/20"
                : "bg-accentRed/20"
            }`}
          >
            <Text
              className={`font-bold text-sm ${
                countdownStatus?.color === "green"
                  ? "text-accentGreen"
                  : countdownStatus?.color === "yellow"
                  ? "text-accentYellow"
                  : "text-accentRed"
              }`}
            >
              ✓ {countdownStatus?.message || "Aktiv kod"}
            </Text>
          </View> */}

            {countdownStatus?.color === "green" && (
              <Text className="text-center text-textSecondary text-base leading-relaxed">
                Skanna QR-koden eller visa koden{" "}
                <Text className="font-bold">{bookingCode}</Text> vid receptionen
              </Text>
            )}
          </View>
        </View>

        {/* Details Card */}
        <View className="px-6 pb-4">
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <QrCode size={18} color={colors.primary} />
                <Text className="ml-3 text-textSecondary font-medium">
                  Krediter
                </Text>
              </View>
              <Text className="text-textPrimary font-bold">
                {booking.credits_used} credit
                {booking.credits_used !== 1 ? "s" : ""}
              </Text>
            </View>

            {bookingEndTime && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Clock size={18} color={colors.primary} />
                  <Text className="ml-3 text-textSecondary font-medium">
                    Tid kvar
                  </Text>
                </View>
                <Text className="text-textPrimary font-bold">{countdown}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-6">
          {/* Status Warning */}
          {booking.status !== "confirmed" && (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <Text className="text-red-800 text-center font-bold">
                Denna QR-kod är inte längre giltig
              </Text>
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity
            className="rounded-2xl py-4 items-center bg-primary mb-4"
            onPress={async () => {
              try {
                await RNShare.share({
                  title: "FitPass Incheckning",
                  message: `Min bokningskod: ${bookingCode}\n\n${className} på ${facilityName}\n${date} kl ${time}`,
                });
              } catch (err) {
                showError("Delningsfel", "Kunde inte dela bokningskoden.");
              }
            }}
          >
            <View className="flex-row items-center">
              <Share size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Dela incheckning-kod
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SwipeableModal>

      <FeedbackComponent
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        buttonText={feedback.buttonText}
        onClose={hideFeedback}
        onButtonPress={feedback.onButtonPress}
        autoClose={false}
        autoCloseDelay={feedback.autoCloseDelay}
      />
    </>
  );
}
