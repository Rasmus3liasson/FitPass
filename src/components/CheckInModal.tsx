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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    ? format(new Date(booking.classes.start_time), "h:mm a")
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
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#1E1E2E", "#2A2A3E"]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <QrCode size={24} color="#6366F1" />
                <Text style={styles.headerTitle}>Check-In Code</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Class Info */}
            <View style={styles.classInfo}>
              <Text style={styles.className}>{className}</Text>
              <View style={styles.facilityRow}>
                <MapPin size={16} color="#A0A0A0" />
                <Text style={styles.facilityName}>{facilityName}</Text>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Animated.View
                style={[
                  styles.qrCodeWrapper,
                  {
                    transform: [{ scale: qrScaleAnim }],
                  },
                ]}
              >
                <View style={styles.qrCodeContainer}>
                  <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
                </View>
                <Text style={styles.qrInstructions}>
                  Show this QR code at the facility to check in
                </Text>
              </Animated.View>
            </View>

            {/* Booking Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Calendar size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {date} • {time}
                </Text>
              </View>

              {booking.classes?.instructor && (
                <View style={styles.detailRow}>
                  <User size={18} color="#6366F1" />
                  <Text style={styles.detailLabel}>Instructor</Text>
                  <Text style={styles.detailValue}>{instructorName}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <QrCode size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Credits</Text>
                <Text style={styles.detailValue}>
                  {booking.credits_used} credit
                  {booking.credits_used !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {countdown ?? "This QR code is valid for 24 hours"}
              </Text>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Share Code</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  classInfo: {
    marginBottom: 32,
  },
  className: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  facilityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  facilityName: {
    fontSize: 16,
    color: "#A0A0A0",
    marginLeft: 8,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrCodeWrapper: {
    alignItems: "center",
  },
  qrCodeContainer: {
    width: 200,
    height: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrCode: {
    width: "100%",
    height: "100%",
  },
  qrInstructions: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
    maxWidth: 250,
  },
  detailsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    color: "#A0A0A0",
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
