import { useCompleteBooking } from "@/src/hooks/useBookings";
import { useFeedback } from "@/src/hooks/useFeedback";
import { calculateCountdown, getCountdownStatus } from "@/src/utils/countdown";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format } from "date-fns";
import { Calendar, Clock, QrCode, Share } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Share as RNShare,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import colors from "../constants/custom-colors";

const { width, height } = Dimensions.get("window");

interface CheckInModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export function CheckInModal({ visible, booking, onClose }: CheckInModalProps) {
  const completeBooking = useCompleteBooking();
  const { showSuccess, showError } = useFeedback();
  const [countdown, setCountdown] = useState<string>("");

  // Gesture handler values
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleClose = () => {
    console.log("CheckInModal: handleClose called");
    onClose();
  };

  // Gesture handler for drag to dismiss
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting Y position (context is handled internally now)
    })
    .onUpdate((event) => {
      const newTranslateY = event.translationY;
      // Only allow downward movement (positive translateY)
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
        // Reduce opacity as user drags down
        opacity.value = Math.max(0.3, 1 - newTranslateY / 300);
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 150 || event.velocityY > 1000;

      if (shouldClose) {
        // Animate out and close
        translateY.value = withSpring(
          400,
          {
            damping: 20,
            stiffness: 200,
            overshootClamping: true,
          },
          () => {
            runOnJS(handleClose)();
          }
        );
        opacity.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
      } else {
        // Animate back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
        opacity.value = withSpring(1, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
      }
    });

  // Reset animation values when modal opens
  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
      opacity.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
    }
  }, [visible]);

  // Animated style for the modal
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
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

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [visible, booking]);

  if (!booking || !visible) {
    return null;
  }

  const className = booking.classes?.name || "Direktbesök";
  const facilityName = booking.classes?.clubs?.name || booking.clubs?.name;
  const date = format(
    new Date(booking.classes?.start_time || booking.created_at),
    "MMM d, yyyy"
  );
  const time = booking.classes
    ? formatSwedishTime(booking.classes.start_time)
    : "När som helst";

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

  // Get countdown status for styling
  const bookingEndTime = booking?.end_time || booking?.classes?.end_time;
  const countdownStatus = bookingEndTime
    ? getCountdownStatus(bookingEndTime)
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <Animated.View
                className="bg-background rounded-t-3xl max-h-[85%]"
                style={animatedStyle}
              >
                <GestureDetector gesture={panGesture}>
                  <Animated.View className="items-center pt-3 pb-2">
                    <View className="w-12 h-1 bg-accentGray rounded-full"></View>
                    <View className="w-16 h-6 -mt-3 items-center justify-center"></View>
                  </Animated.View>
                </GestureDetector>
                <></>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                  style={{ backgroundColor: colors.background }}
                >
                  {/* Class Info Card */}
                  <View className="px-6 mb-4">
                    <View className="bg-surface rounded-2xl p-4">
                      <Text className="text-textPrimary text-xl font-bold mb-2">
                        {className}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Calendar size={16} color={colors.textSecondary} />
                          <Text className="text-textSecondary ml-2">
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
                    {/* QR Code */}
                    <View className="items-center mb-6">
                      <View className="rounded-2xl p-4 mb-4">
                        <View
                          style={{
                            width: 200,
                            height: 200,
                            backgroundColor: "white",
                            borderRadius: 12,
                            padding: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                          }}
                        >
                          <Image
                            source={{ uri: qrCodeUrl }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 8,
                            }}
                          />
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
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
                      </View>

                      {/* Instructions */}
                      {countdownStatus?.color === "green" && (
                        <Text className="text-center text-textSecondary text-base leading-relaxed">
                          Visa denna kod vid receptionen{"\n"}
                          eller skanna vid entrén
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
                          <Text className="text-textPrimary font-bold">
                            {countdown}
                          </Text>
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

                    {/* Dev Button */}
                    {__DEV__ && (
                      <TouchableOpacity
                        className="rounded-2xl py-4 items-center bg-green-500 mb-3"
                        style={{
                          shadowColor: "#22c55e",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 6,
                        }}
                        onPress={async () => {
                          if (!booking) return;
                          try {
                            await completeBooking.mutateAsync(booking.id);
                            const facilityName =
                              booking.clubs?.name ||
                              booking.classes?.clubs?.name ||
                              "gymmet";
                            const className =
                              booking.classes?.name || "Direktbesök";
                            showSuccess(
                              "Incheckning lyckades!",
                              `Välkommen till ${facilityName}! Din ${className} är nu registrerad. Ha en bra träning!`
                            );
                            handleClose();
                          } catch (err: any) {
                            const errorMessage =
                              err.message || "Något gick fel vid incheckning.";
                            showError(
                              "Incheckning misslyckades",
                              errorMessage
                            );
                          }
                        }}
                        disabled={completeBooking.isPending}
                      >
                        <Text className="text-white font-bold text-base">
                          {completeBooking.isPending
                            ? "Checkar in..."
                            : "Simulera QR-skanning"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Share Button */}
                    <TouchableOpacity
                      className="rounded-2xl py-4 items-center bg-primary"
                      style={{
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                      }}
                      onPress={async () => {
                        try {
                          const shareContent = {
                            title: "FitPass Incheckning-kod",
                            message: `Min incheckning-kod för ${className} på ${facilityName} den ${date} kl ${time}`,
                            url: qrCodeUrl,
                          };
                          await RNShare.share(shareContent);
                        } catch (error) {
                          showError(
                            "Delningsfel",
                            "Kunde inte dela incheckning koden."
                          );
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
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </GestureHandlerRootView>
    </Modal>
  );
}
