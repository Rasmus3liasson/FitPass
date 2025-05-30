import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bookmark,
  Calendar,
  Car,
  Clock,
  Dumbbell,
  MapPin,
  Share,
  ShowerHead as Shower,
  Star,
  Wifi,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BackButton, Button } from "@/components/Button";
import { ClassCard } from "@/components/ClassCard";
import { ReviewCard } from "@/components/ReviewCard";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";

// Mock data for a facility - in real app, fetch based on ID
const facilityData = {
  powerfit: {
    id: "powerfit",
    name: "PowerFit Gym",
    type: "Gym",
    rating: 4.8,
    reviewCount: 124,
    address: "123 Fitness Blvd, San Francisco, CA",
    distance: "0.8 miles away",
    credits: 1,
    openNow: true,
    hours: "Open until 10:00 PM",
    description:
      "A premium gym facility with state-of-the-art equipment for weight training, cardio, and functional fitness. PowerFit offers a spacious workout area with designated zones for different training styles.",
    amenities: ["Parking", "Showers", "Lockers", "WiFi", "Towel Service"],
    images: [
      "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
      "https://images.pexels.com/photos/260352/pexels-photo-260352.jpeg",
      "https://images.pexels.com/photos/4164512/pexels-photo-4164512.jpeg",
    ],
    classes: [
      {
        id: "hiit-class",
        name: "HIIT Training",
        time: "6:30 PM",
        duration: "45 min",
        intensity: "High",
        spots: 5,
      },
      {
        id: "strength-class",
        name: "Strength Basics",
        time: "7:30 PM",
        duration: "60 min",
        intensity: "Medium",
        spots: 8,
      },
    ],
    reviews: [
      {
        id: "review1",
        user: "Mike T.",
        avatar:
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        rating: 5,
        date: "2 days ago",
        text: "Great equipment and never too crowded. The staff is very helpful and keeps the place clean.",
      },
      {
        id: "review2",
        user: "Sarah L.",
        avatar:
          "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
        rating: 4,
        date: "1 week ago",
        text: "Love this gym! Only downside is limited parking during peak hours.",
      },
    ],
  },
};

export default function FacilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Default to powerfit if id doesn't match any facility
  const facility = facilityData[id as string] || facilityData.powerfit;

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark
                size={24}
                color="#FFFFFF"
                fill={isBookmarked ? "#FFFFFF" : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
          >
            {facility.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.facilityImage}
              />
            ))}
          </ScrollView>

          <View style={styles.content}>
            <View style={styles.facilityMeta}>
              <Text style={styles.facilityType}>{facility.type}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FFCA28" fill="#FFCA28" />
                <Text style={styles.ratingText}>
                  {facility.rating} ({facility.reviewCount})
                </Text>
              </View>
            </View>

            <Text style={styles.facilityName}>{facility.name}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MapPin size={16} color="#A0A0A0" />
                <Text style={styles.infoText}>{facility.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Clock size={16} color="#A0A0A0" />
                <Text style={styles.infoText}>{facility.hours}</Text>
              </View>
            </View>

            <View style={styles.creditInfo}>
              <Text style={styles.creditLabel}>Credits Per Visit</Text>
              <View style={styles.creditBadge}>
                <Text style={styles.creditValue}>{facility.credits}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{facility.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                <View style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Dumbbell size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.amenityText}>Equipment</Text>
                </View>
                <View style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Shower size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.amenityText}>Showers</Text>
                </View>
                <View style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Car size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.amenityText}>Parking</Text>
                </View>
                <View style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Wifi size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.amenityText}>Wi-Fi</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Classes</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/facility/${id}/classes`)}
                >
                  <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.classesScroll}
                contentContainerStyle={styles.classesScrollContent}
              >
                {facility.classes.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    name={classItem.name}
                    facility={facility.name}
                    image={facility.images[0]}
                    time={classItem.time}
                    duration={classItem.duration}
                    intensity={classItem.intensity}
                    spots={classItem.spots}
                    onPress={() => router.push(`/class/${classItem.id}`)}
                    compact
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/facility/${id}/reviews`)}
                >
                  <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
              </View>
              {facility.reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  userName={review.user}
                  userAvatar={review.avatar}
                  rating={review.rating}
                  date={review.date}
                  text={review.text}
                />
              ))}
            </View>

            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleTitle}>Schedule Your Visit</Text>
              <View style={styles.scheduleDateSelector}>
                <TouchableOpacity style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateDay}>Mon</Text>
                  <Text style={styles.scheduleDateNumber}>12</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scheduleDate, styles.scheduleDateSelected]}
                >
                  <Text style={styles.scheduleDateDay}>Tue</Text>
                  <Text
                    style={[
                      styles.scheduleDateNumber,
                      styles.scheduleDateTextSelected,
                    ]}
                  >
                    13
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateDay}>Wed</Text>
                  <Text style={styles.scheduleDateNumber}>14</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateDay}>Thu</Text>
                  <Text style={styles.scheduleDateNumber}>15</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateDay}>Fri</Text>
                  <Text style={styles.scheduleDateNumber}>16</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkInActions}>
              <Button
                title="Check In Now"
                icon={<Calendar size={18} color="#FFFFFF" />}
                onPress={() => router.push(`/facility/${id}/checkin`)}
                style={styles.checkInButton}
              />
              <Button
                title="Book Class"
                onPress={() => router.push(`/facility/${id}/classes`)}
                style={styles.bookClassButton}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageGallery: {
    height: 300,
  },
  facilityImage: {
    width: 390, // Adjust this to the screen width in a real app
    height: 300,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  facilityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  facilityType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  facilityName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  creditInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  creditLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  creditBadge: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creditValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  seeAllButton: {
    fontSize: 14,
    color: "#6366F1",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#E5E5E5",
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  amenityItem: {
    alignItems: "center",
    width: 70,
  },
  amenityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
  classesScroll: {
    marginTop: 8,
  },
  classesScrollContent: {
    paddingRight: 16,
    gap: 16,
  },
  scheduleSection: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  scheduleDateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleDate: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scheduleDateSelected: {
    backgroundColor: "#6366F1",
  },
  scheduleDateDay: {
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 4,
  },
  scheduleDateNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scheduleDateTextSelected: {
    color: "#FFFFFF",
  },
  checkInActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  checkInButton: {
    flex: 1,
  },
  bookClassButton: {
    flex: 1,
  },
});
