import { useAuth } from "@/src/hooks/useAuth";
import { useBookClass } from "@/src/hooks/useClubs";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Modal } from "./Modal";

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
    <Modal visible={visible} onClose={handleClose} title="Book Class">
      <View style={styles.content}>
        {!showConfirmation ? (
          <>
            <Text style={styles.className}>{className}</Text>
            <View style={styles.details}>
              <Text style={styles.detail}>Time: {startTime}</Text>
              <Text style={styles.detail}>Duration: {duration} minutes</Text>
              <Text style={styles.detail}>Available spots: {spots}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookButton}
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
          </>
        ) : (
          <View style={styles.confirmationContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#6366F1" style={styles.confirmationIcon} />
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  className: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  details: {
    marginBottom: 30,
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
    color: "#666",
  },
  bookButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
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
  confirmationIcon: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  confirmButton: {
    backgroundColor: "#6366F1",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 