import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { FacilityAmenities } from "./amenties";
import { FacilityActions } from "./facilityActions";
import { FacilityClasses } from "./facilityClasses";
import { FacilityDetails } from "./facilityDetails";
import { FacilityHeader } from "./facilityHeader";
import { PosterCarousel } from "./posterCarousel";
import { Reviews } from "./reviews";

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

  const facility = facilityData[id as string] || facilityData.powerfit;

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />

      <FacilityHeader
        isBookmarked={isBookmarked}
        onToggle={() => setIsBookmarked(!isBookmarked)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <PosterCarousel images={facility.images} />

        <View className="px-4 pt-5 pb-10">
          <FacilityDetails facility={facility} />
          <FacilityAmenities />
          <FacilityClasses
            classes={facility.classes}
            facilityName={facility.name}
            images={facility.images}
         
          />
          <Reviews reviews={facility.reviews} id={facility.id} />
          <FacilityActions id={facility.id} />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
