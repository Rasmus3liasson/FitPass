import { useCompleteBooking } from "@/src/hooks/useBookings";
import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, MapPin, QrCode, User, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Share,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import colors from "../constants/custom-colors";

const { width, height } = Dimensions.get("window");

interface CheckInModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export function CheckInModal({ visible, booking, onClose }: CheckInModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const qrScaleAnim = useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const completeBooking = useCompleteBooking();
  const { showSuccess, showError } = useGlobalFeedback();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proper close handler that cleans up state
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowSuccessScreen(false);
    onClose();
  };

  // Cleanup timeout on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Reset success screen when modal closes
  useEffect(() => {
    if (!visible) {
      setShowSuccessScreen(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate QR code after modal is shown
        Animated.spring(qrScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
    } else {
      qrScaleAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    const bookingEndTime = booking?.end_time || booking?.classes?.end_time;
    if (!visible || !bookingEndTime) {
      setCountdown(null);
      return;
    }

    const endTime = new Date(bookingEndTime);
    const intervalId = setInterval(() => {
      const now = new Date();
      const diffSeconds = Math.floor(
        (endTime.getTime() - now.getTime()) / 1000
      );

      if (diffSeconds <= 0) {
        setCountdown("Code expired");
        clearInterval(intervalId);
        return;
      }

      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);

      setCountdown(
        `Code expires in ${String(hours).padStart(2, "0")}h ${String(
          minutes
        ).padStart(2, "0")}m`
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [visible, booking]);

  if (!booking) return null;

  const className = booking.classes?.name || "Direct Visit";
  const facilityName = booking.classes?.clubs?.name || booking.clubs?.name;
  const instructorName =
    booking.classes?.instructor?.profiles?.display_name || "N/A";
  const date = format(
    new Date(booking.classes?.start_time || booking.created_at),
    "MMM d, yyyy"
  );
  const time = booking.classes
    ? formatSwedishTime(booking.classes.start_time)
    : "Anytime";

  // Generate QR code data
  const qrData = {
    bookingId: booking.id,
    className: className,
    facilityName: facilityName,
    date: date,
    time: time,
    timestamp: new Date().getTime(),
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify(qrData)
  )}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        className="flex-1 justify-end bg-black/70"
        style={{ opacity: fadeAnim }}
      >
                <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          className="overflow-hidden rounded-t-3xl"
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <LinearGradient
            colors={[colors.background, colors.accentGray]}
            className="flex-1"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6 px-6 pt-6">
              <View className="flex-row items-center">
                <QrCode size={24} color={colors.primary} />
                <Text className="text-lg font-bold text-textPrimary ml-3">
                  Incheckning-kod
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
                onPress={handleClose}
              >
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Main Content - QR Code or Success Screen */}
            {!showSuccessScreen && (
              <>
                {/* Class Info */}
                <View className="mb-8 px-6">
                  <Text className="text-2xl font-bold text-textPrimary mb-2">
                    {className}
                  </Text>
                  <View className="flex-row items-center">
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text className="text-base text-textSecondary ml-2">
                      {facilityName}
                    </Text>
                  </View>
                </View>
            {/* QR Code */}
            <View className="items-center mb-8">
              <Animated.View
                style={{
                  alignItems: "center",
                  transform: [{ scale: qrScaleAnim }],
                }}
              >
                <View
                  style={{
                    width: 200,
                    height: 200,
                    backgroundColor: colors.textPrimary,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>
                <Text className="text-sm text-textSecondary text-center max-w-xs">
                  Show this QR code at the facility to check in
                </Text>
              </Animated.View>
            </View>
            {/* Booking Details */}
            <View className="bg-white/5 rounded-2xl p-5 mb-6 mx-6">
              <View className="flex-row items-center mb-4">
                <Calendar size={18} color={colors.primary} />
                <Text className="ml-3 flex-1 text-base text-textSecondary">
                  Date & Time
                </Text>
                <Text className="text-base font-semibold text-textPrimary">
                  {date} • {time}
                </Text>
              </View>
              {booking.classes?.instructor && (
                <View className="flex-row items-center mb-4">
                  <User size={18} color={colors.primary} />
                  <Text className="ml-3 flex-1 text-base text-textSecondary">
                    Instruktör
                  </Text>
                  <Text className="text-base font-semibold text-textPrimary">
                    {instructorName}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center mb-4">
                <QrCode size={18} color={colors.primary} />
                <Text className="ml-3 flex-1 text-base text-textSecondary">
                  Krediter
                </Text>
                <Text className="text-base font-semibold text-textPrimary">
                  {booking.credits_used} credit
                  {booking.credits_used !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            {/* Footer */}
            <View className="px-6 pb-6">
              <Text className="text-textSecondary text-center mb-4">
                {countdown ?? "Denna QR-kod är giltig i 24 timmar"}
              </Text>
              {booking.status !== "confirmed" && (
                <Text
                  style={{ color: "red", textAlign: "center", marginBottom: 8 }}
                >
                  Denna QR-kod är inte längre giltig.
                </Text>
              )}
              {/* Dev scan button */}
              {__DEV__ && (
                <TouchableOpacity
                  className="rounded-xl py-3 items-center bg-green-500 mb-2"
                  onPress={async () => {
                    if (!booking) return;
                    try {
                      await completeBooking.mutateAsync(booking.id);
                      
                      // Show success feedback with detailed information
                      const facilityName = booking.clubs?.name || booking.classes?.clubs?.name || 'gymmet';
                      const className = booking.classes?.name || 'Direktbesök';
                      showSuccess(
                        "✅ Incheckning lyckades!", 
                        `Välkommen till ${facilityName}! Din ${className} är nu registrerad. Ha en bra träning!`
                      );
                      
                      // Close modal immediately so feedback can be seen
                      handleClose();
                    } catch (err: any) {
                      const errorMessage = err.message || "Något gick fel vid incheckning. Kontrollera din internetanslutning och försök igen.";
                      console.error("Check-in error:", err);
                      showError("❌ Incheckning misslyckades", `${errorMessage} Om problemet kvarstår, kontakta support.`);
                    }
                  }}
                  disabled={completeBooking.isPending}
                >
                  <Text className="text-textPrimary font-semibold">
                    {completeBooking.isPending
                      ? "Checkar in..."
                      : "Simulera QR-skanning (Dev)"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="rounded-xl py-3 items-center bg-indigo-500"
                onPress={async () => {
                  try {
                    const shareContent = {
                      title: "FitPass Incheckning-kod",
                      message: `Min incheckning-kod för ${className} på ${facilityName} den ${date} kl ${time}`,
                      url: qrCodeUrl,
                    };

                    await Share.share(shareContent);
                  } catch (error) {
                    console.error("Error sharing:", error);
                    showError("Delningsfel", "Kunde inte dela incheckning koden.");
                  }
                }}
              >
                <Text className="text-textPrimary font-semibold">Dela kod</Text>
              </TouchableOpacity>
            </View>
          </>
          )}

          {/* Success Screen */}
          {showSuccessScreen && (
            <View className="flex-1 justify-center items-center p-6">
              <View className="bg-green-500/20 rounded-full p-6 mb-6">
                <Text className="text-6xl">✅</Text>
              </View>
              
              <Text className="text-textPrimary font-bold text-2xl text-center mb-2">
                Check-in Successful!
              </Text>
              
              <Text className="text-textSecondary text-center text-lg mb-8">
                Great workout at {facilityName}!
              </Text>

              <View className="w-full space-y-3">
                <TouchableOpacity
                  className="bg-primary rounded-xl py-4 items-center"
                  onPress={handleClose}
                >
                  <Text className="text-textPrimary font-semibold">
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
    </Modal>
  );
}
