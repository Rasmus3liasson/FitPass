import { BaseModal } from "@/components/BaseModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookClass } from "@/src/hooks/useClubs";
import { formatSwedishTime } from "@/src/utils/time";
import { useRouter } from "expo-router";
import { Calendar, Clock, Users } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

interface ClassBookingModalProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  startTime: string; // ISO string
  duration: number;
  spots: number;
  description?: string;
  instructor?: string;
  capacity?: number;
  bookedSpots?: number;
  clubId: string;
}

export const ClassBookingModal: React.FC<ClassBookingModalProps> = ({
  visible,
  onClose,
  classId,
  className,
  startTime,
  duration,
  spots,
  description,
  instructor,
  capacity,
  bookedSpots,
  clubId,
}) => {
  const router = useRouter();
  const auth = useAuth();
  const bookClass = useBookClass();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Format startTime to Swedish locale
  let formattedDate = startTime;
  try {
    formattedDate = formatSwedishTime(startTime, true);
  } catch {}

  const handleBookClass = async () => {
    if (!auth.user?.id) {
      router.push("/login/");
      return;
    }

    try {
      await bookClass.mutateAsync({
        userId: auth.user.id,
        classId,
        clubId,
      });
      Toast.show({
        type: 'success',
        text1: 'Class Booked',
        text2: 'Your class has been successfully booked.',
      });
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error booking class:", error);
      Toast.show({
        type: 'error',
        text1: 'Booking Failed',
        text2: 'Could not book the class. Please try again.',
      });
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="Boka klass"
    >
      {!showConfirmation ? (
        <View style={styles.content}>
          <Text style={styles.className}>{className}</Text>
          {description && (
            <Text style={{ color: "#A0A0A0", marginBottom: 12 }}>{description}</Text>
          )}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Calendar size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Datum & tid</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Längd</Text>
              <Text style={styles.detailValue}>{duration} minuter</Text>
            </View>
            {instructor && (
              <View style={styles.detailRow}>
                <Users size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Instruktör</Text>
                <Text style={styles.detailValue}>{instructor}</Text>
              </View>
            )}
            {typeof capacity === "number" && (
              <View style={styles.detailRow}>
                <Users size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Kapacitet</Text>
                <Text style={styles.detailValue}>{capacity}</Text>
              </View>
            )}
            {typeof bookedSpots === "number" && (
              <View style={styles.detailRow}>
                <Users size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Bokade platser</Text>
                <Text style={styles.detailValue}>{bookedSpots}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Users size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Lediga platser</Text>
              <Text style={styles.detailValue}>{spots}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, spots <= 0 && styles.bookButtonDisabled]}
            onPress={() => setShowConfirmation(true)}
            disabled={bookClass.isPending || spots <= 0}
          >
            <Text style={styles.bookButtonText}>
              {bookClass.isPending
                ? "Bokar..."
                : spots <= 0
                ? "Inga platser kvar"
                : "Boka klass"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationIconContainer}>
            <Calendar size={48} color="#6366F1" />
          </View>
          <Text style={styles.confirmationTitle}>Confirm Booking</Text>
          <Text style={styles.confirmationText}>
            Are you sure you want to book {className} at {formattedDate}?
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={() => setShowConfirmation(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={handleBookClass}
              disabled={bookClass.isPending}
            >
              <Text style={styles.confirmButtonText}>
                {bookClass.isPending ? "Booking..." : "Confirm"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  className: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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
  bookButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "#6366F180",
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationContainer: {
    alignItems: "center",
    padding: 20,
  },
  confirmationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginBottom: 32,
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmationButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  confirmButton: {
    backgroundColor: "#6366F1",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 