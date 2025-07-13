import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, Filter, MapPin, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { BackButton } from "@/src/components/Button";
import { ROUTES } from "@/src/config/constants";
import MapView, { Marker } from "react-native-maps";

interface Facility {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance: string;
  openNow: boolean;
  image: string;
}

export default function MapScreen() {
  const router = useRouter();
  const windowHeight = Dimensions.get("window").height;

  // Sample initial region centered around a lat/lon
  const initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Sample facility data array
  const facilities = [
    {
      id: "powerfit",
      name: "PowerFit Gym",
      type: "Gym",
      latitude: 37.78825,
      longitude: -122.4324,
      rating: 4.8,
      distance: "0.8 miles",
      openNow: true,
      image:
        "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
    },
    {
      id: "powerfit",
      name: "PowerFit Gym",
      type: "Gym",
      latitude: 37.78825,
      longitude: -122.4324,
      rating: 4.8,
      distance: "0.8 miles",
      openNow: true,
      image:
        "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
    },
    {
      id: "powerfit",
      name: "PowerFit Gym",
      type: "Gym",
      latitude: 27.78825,
      longitude: -122.4324,
      rating: 4.8,
      distance: "0.8 miles",
      openNow: true,
      image:
        "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
    },
    // add more facilities as needed
  ];

  // State to track visibility and selected facility
  const [facilityVisible, setFacilityVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );

  // Animated value for sliding card
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openFacilityCard = (facility:Facility) => {
    setSelectedFacility(facility);
    setFacilityVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeFacilityCard = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setFacilityVisible(false);
      setSelectedFacility(null);
    });
  };

  // Interpolated card height from animation value
  const cardHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, windowHeight * 0.25],
  });

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <BackButton/>
          <View className="flex-row items-center bg-surface rounded-full px-3 py-2 space-x-2">
            <MapPin size={16} color="#6366F1" />
            <Text className="text-textPrimary text-sm font-medium">
              Current Location
            </Text>
            <ChevronDown size={16} color="#FFFFFF" />
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl w-10 h-10 items-center justify-center"
            onPress={() => {
              /* Toggle filter modal */
            }}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <MapView
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          provider="google"
        >
          {facilities.map((facility) => (
            <Marker
              key={facility.id}
              coordinate={{
                latitude: facility.latitude,
                longitude: facility.longitude,
              }}
              title={facility.name}
              description={facility.type}
              onPress={() => openFacilityCard(facility)}
              pinColor={facility.openNow ? "#4CAF50" : "#FF5252"}
            />
          ))}
        </MapView>

        {/* Facility card UI */}
        {facilityVisible && selectedFacility && (
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: cardHeight,
              backgroundColor: "#1E1E1E",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingVertical: 20,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
              onPress={closeFacilityCard}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="flex-row space-x-4">
              <Image
                source={{ uri: selectedFacility.image }}
                className="w-[110px] h-[140px] rounded-xl"
              />
              <View className="flex-1 justify-between">
                <View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-primary text-sm font-semibold">
                      {selectedFacility.type}
                    </Text>
                  </View>
                  <Text className="text-textPrimary text-xl font-bold mb-2">
                    {selectedFacility.name}
                  </Text>
                  <View className="flex-row items-center space-x-1.5 mb-2">
                    <MapPin size={14} color="#A0A0A0" />
                    <Text className="text-textSecondary text-sm">
                      {selectedFacility.distance} away
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-4">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        selectedFacility.openNow
                          ? "bg-[#4CAF50]"
                          : "bg-[#FF5252]"
                      } mr-1.5`}
                    />
                    <Text className="text-textPrimary text-sm font-medium">
                      {selectedFacility.openNow ? "Open now" : "Closed"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="bg-primary rounded-xl py-2.5 items-center"
                  onPress={() =>
                    router.push(ROUTES.FACILITY(selectedFacility.id))
                  }
                >
                  <Text className="text-textPrimary text-sm font-semibold">
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
