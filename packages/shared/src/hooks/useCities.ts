import { useClubs } from "../hooks/useClubs";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  clubCount: number;
  clubs: Array<{ id: string; name: string }>;
}

// Cache for city names to reduce API calls
const cityNameCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Function to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Function to reverse geocode coordinates to city name using Google Geocoding API
const getCityName = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Create cache key (rounded to 3 decimal places to group nearby locations)
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

    // Check cache first
    const cached = cityNameCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.name;
    }

    const { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } =
      Constants.expoConfig?.extra ?? {};

    if (!EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn(
        "Google Maps API key not found, falling back to hardcoded cities"
      );
      return getCityNameFallback(latitude, longitude);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&language=sv&result_type=locality|administrative_area_level_1`
    );

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      let cityName = "Unknown";

      // Look for city name in the results
      for (const result of data.results) {
        for (const component of result.address_components) {
          if (component.types.includes("locality")) {
            cityName = component.long_name;
            break;
          }
          if (component.types.includes("administrative_area_level_1")) {
            cityName = component.long_name;
            break;
          }
        }
        if (cityName !== "Unknown") break;
      }

      // If no locality found, use the first result's formatted address
      if (cityName === "Unknown") {
        const address = data.results[0].formatted_address;
        const cityMatch = address.split(",")[0].trim();
        cityName = cityMatch || "Unknown";
      }

      // Cache the result
      cityNameCache.set(cacheKey, { name: cityName, timestamp: Date.now() });

      return cityName;
    }

    // If Google API fails, fall back to hardcoded cities
    const fallbackName = getCityNameFallback(latitude, longitude);
    cityNameCache.set(cacheKey, { name: fallbackName, timestamp: Date.now() });
    return fallbackName;
  } catch (error) {
    console.error("Error getting city name from Google:", error);
    const fallbackName = getCityNameFallback(latitude, longitude);
    return fallbackName;
  }
};

// Fallback function with hardcoded Swedish cities (as backup)
const getCityNameFallback = (latitude: number, longitude: number): string => {
  try {
    const swedishCities = [
      { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
      { name: "Göteborg", lat: 57.7089, lng: 11.9746 },
      { name: "Malmö", lat: 55.605, lng: 13.0038 },
      { name: "Uppsala", lat: 59.8586, lng: 17.6389 },
      { name: "Västerås", lat: 59.6162, lng: 16.5528 },
      { name: "Örebro", lat: 59.2741, lng: 15.2066 },
      { name: "Linköping", lat: 58.4108, lng: 15.6214 },
      { name: "Helsingborg", lat: 56.0465, lng: 12.6945 },
      { name: "Jönköping", lat: 57.7826, lng: 14.1618 },
      { name: "Norrköping", lat: 58.5877, lng: 16.1924 },
      { name: "Lund", lat: 55.7047, lng: 13.191 },
      { name: "Umeå", lat: 63.8258, lng: 20.263 },
      { name: "Gävle", lat: 60.6749, lng: 17.1413 },
      { name: "Borås", lat: 57.721, lng: 12.9401 },
      { name: "Eskilstuna", lat: 59.3661, lng: 16.5077 },
    ];

    let closestCity = "Unknown";
    let minDistance = Infinity;

    for (const city of swedishCities) {
      const distance = calculateDistance(
        latitude,
        longitude,
        city.lat,
        city.lng
      );
      if (distance < minDistance && distance < 50) {
        minDistance = distance;
        closestCity = city.name;
      }
    }

    return closestCity;
  } catch (error) {
    console.error("Error in fallback city detection:", error);
    return "Unknown";
  }
};

export const useCitiesFromClubs = () => {
  // Get all clubs without location filtering
  const { data: allClubs = [], isLoading: clubsLoading } = useClubs({
    radius: 1000, // Large radius to get all clubs
  });

  return useQuery({
    queryKey: ["cities-from-clubs", allClubs.length],
    queryFn: async (): Promise<City[]> => {
      if (!allClubs.length) return [];

      // Filter clubs that have coordinates
      const clubsWithCoords = allClubs.filter(
        (club) => club.latitude && club.longitude
      );

      if (!clubsWithCoords.length) return [];

      // Group clubs by approximate location (within ~10km radius)
      const cityGroups: { [key: string]: typeof clubsWithCoords } = {};

      for (const club of clubsWithCoords) {
        let addedToGroup = false;

        // Check if this club is close to any existing group
        for (const [groupKey, groupClubs] of Object.entries(cityGroups)) {
          const [firstClub] = groupClubs;
          const distance = calculateDistance(
            club.latitude!,
            club.longitude!,
            firstClub.latitude!,
            firstClub.longitude!
          );

          // If within 10km, add to this group
          if (distance < 10) {
            cityGroups[groupKey].push(club);
            addedToGroup = true;
            break;
          }
        }

        // If not added to any group, create a new group
        if (!addedToGroup) {
          const groupKey = `${club.latitude!.toFixed(
            3
          )}_${club.longitude!.toFixed(3)}`;
          cityGroups[groupKey] = [club];
        }
      }

      // Convert groups to cities
      const cities: City[] = [];

      for (const [groupKey, clubs] of Object.entries(cityGroups)) {
        // Calculate average coordinates for the city
        const avgLat =
          clubs.reduce((sum, club) => sum + club.latitude!, 0) / clubs.length;
        const avgLng =
          clubs.reduce((sum, club) => sum + club.longitude!, 0) / clubs.length;

        // Get city name
        const cityName = await getCityName(avgLat, avgLng);

        cities.push({
          id: groupKey,
          name: cityName,
          latitude: avgLat,
          longitude: avgLng,
          clubCount: clubs.length,
          clubs: clubs.map((club) => ({ id: club.id, name: club.name })),
        });
      }

      // Sort by club count (cities with more clubs first)
      return cities.sort((a, b) => b.clubCount - a.clubCount);
    },
    enabled: !clubsLoading && allClubs.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - clubs don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};
