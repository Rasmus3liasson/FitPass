import { BaseModal } from "@/components/BaseModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useBookClass } from "@/src/hooks/useClubs";
import { useRouter } from "expo-router";
import { Calendar, Clock, Users } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ClassBookingModalProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  startTime: string;
  duration: number;
  spots: number;
}

export const ClassBookingModal: React.FC<ClassBookingModalProps> = ({
  visible,
  onClose,
  classId,
  className,
  startTime,
  duration,
  spots,
}) => {
  const router = useRouter();
  const auth = useAuth();
  const bookClass = useBookClass();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBookClass = async () => {
    if (!auth.user?.id) {
      router.push("/login/");
      return;
    }

    try {
      await bookClass.mutateAsync({
        userId: auth.user.id,
        classId,
      });
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error booking class:", error);
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
      title="Book Class"
    >
      {!showConfirmation ? (
        <View style={styles.content}>
          <Text style={styles.className}>{className}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Clock size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{startTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Calendar size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{duration} minutes</Text>
            </View>

            <View style={styles.detailRow}>
              <Users size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Available Spots</Text>
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
                ? "Booking..."
                : spots <= 0
                ? "No spots available"
                : "Book Class"}
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
            Are you sure you want to book {className} at {startTime}?
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