import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import MapView from "react-native-maps";
import { useAuth } from "../hooks/useAuth";
import { City, useCitiesFromClubs } from "../hooks/useCities";
import { useClubs } from "../hooks/useClubs";
import { useUserProfile } from "../hooks/useUserProfile";
import { useLocationService } from "../services/locationService";
import { Club } from "../types";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const useMapLogic = () => {
  const auth = useAuth();
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isUsingCustomLocation, setIsUsingCustomLocation] = useState(false);

  // Facility card state
  const [facilityVisible, setFacilityVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Club | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Map reference for smooth animations
  const mapRef = useRef<MapView>(null);

  // Map region state
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 59.3293, // Stockholm fallback
    longitude: 18.0686,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Get user profile for location preferences
  const { data: userProfile } = useUserProfile(auth.user?.id || "");
  
  // Get cities from clubs data
  const { data: cities = [], isLoading: citiesLoading } = useCitiesFromClubs();
  
  // Use location service
  const { location, isLoading: isLoadingLocation, initializeLocation, calculateDistance } = useLocationService();

  // Get clubs data for the map - first try nearby, then fallback to all
  const { data: nearbyClubs = [], isLoading: isLoadingNearby } = useClubs({
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: 50, // 50km radius for map view
  });

  // Fallback query for all clubs when no nearby clubs are found
  const { data: allClubs = [], isLoading: isLoadingAll } = useClubs({
    // No location filters - get all clubs
  });

  // Use nearby clubs if available, otherwise show all clubs
  const clubs = nearbyClubs.length > 0 ? nearbyClubs : allClubs;
  const clubsLoading = isLoadingNearby || (nearbyClubs.length === 0 && isLoadingAll);

  // Initialize location when user profile is available
  useEffect(() => {
    const setupLocation = async () => {
      // Only run if userProfile is loaded and we haven't initialized yet
      if (userProfile && !hasInitializedLocation) {
        try {
          const userLocation = await initializeLocation(userProfile);
          // Update map region to user's location
          setMapRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setHasInitializedLocation(true);
        } catch (error) {
          console.error('Failed to initialize location:', error);
          setHasInitializedLocation(true); // Set to true to prevent infinite retries
        }
      }
    };

    setupLocation();
  }, [userProfile?.id, hasInitializedLocation]);

  // Facility card functions
  const openFacilityCard = useCallback((club: Club) => {
    // Calculate distance if location is available
    let clubWithDistance = club;
    if (location && club.latitude && club.longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        club.latitude,
        club.longitude
      );
      clubWithDistance = { ...club, distance };
    }
    
    setSelectedFacility(clubWithDistance);
    setFacilityVisible(true);
    
    // Animate map to club location with closer zoom
    if (club.latitude && club.longitude && mapRef.current) {
      const clubRegion = {
        latitude: club.latitude,
        longitude: club.longitude,
        latitudeDelta: 0.02, // Closer zoom than default 0.05
        longitudeDelta: 0.02,
      };
      mapRef.current.animateToRegion(clubRegion, 800);
      setMapRegion(clubRegion);
    }
    
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [location, calculateDistance, slideAnim]);

  const closeFacilityCard = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setFacilityVisible(false);
      setSelectedFacility(null);
    });
  }, [slideAnim]);

  // Location functions
  const handleCitySelection = useCallback((city: City) => {
    const newRegion = {
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    
    // Animate to new region smoothly
    mapRef.current?.animateToRegion(newRegion, 1000);
    setMapRegion(newRegion);
    setSelectedCity(city);
    setIsUsingCustomLocation(true);
    setIsLocationModalVisible(false);
  }, []);

  const useCurrentLocation = useCallback(async () => {
    try {
      if (userProfile) {
        const userLocation = await initializeLocation(userProfile);
        const newRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        // Animate to user location smoothly
        mapRef.current?.animateToRegion(newRegion, 1000);
        setMapRegion(newRegion);
        setSelectedCity(null);
        setIsUsingCustomLocation(false);
        setIsLocationModalVisible(false);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      // Note: Cannot use useGlobalFeedback in a hook - caller should handle error display
    }
  }, [userProfile, initializeLocation]);

  const updateMapRegion = useCallback((newRegion: Partial<MapRegion>) => {
    setMapRegion(prev => ({ ...prev, ...newRegion }));
  }, []);

  return {
    // State
    selectedClub,
    isLocationModalVisible,
    selectedCity,
    isUsingCustomLocation,
    facilityVisible,
    selectedFacility,
    slideAnim,
    mapRegion,
    mapRef,

    // Data
    cities,
    citiesLoading,
    location,
    isLoadingLocation,
    clubs,
    clubsLoading,
    allClubs,
    nearbyClubs,

    // Functions
    openFacilityCard,
    closeFacilityCard,
    handleCitySelection,
    useCurrentLocation,
    updateMapRegion,
    calculateDistance,

    // Setters
    setIsLocationModalVisible,
    setSelectedClub,
  };
};
