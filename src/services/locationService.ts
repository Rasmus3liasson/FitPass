import * as Location from 'expo-location';
import React from 'react';
import { UserProfile } from '../types';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

export interface LocationServiceState {
  location: LocationCoordinates | null;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
}

// Default fallback location (Stockholm, Sweden)
const FALLBACK_LOCATION: LocationCoordinates = {
  latitude: 59.3293,
  longitude: 18.0686,
  address: "Stockholm, Sweden",
};

export class LocationService {
  private static instance: LocationService;
  private state: LocationServiceState = {
    location: null,
    isLoading: false,
    hasPermission: false,
    error: null,
  };
  private listeners: ((state: LocationServiceState) => void)[] = [];

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Subscribe to location state changes
  subscribe(listener: (state: LocationServiceState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all subscribers of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update state and notify listeners
  private updateState(updates: Partial<LocationServiceState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // Get current location state
  getState(): LocationServiceState {
    return { ...this.state };
  }

  // Initialize location with user profile preferences
  async initializeLocation(userProfile?: UserProfile): Promise<LocationCoordinates> {
    this.updateState({ isLoading: true, error: null });

    try {
      // Check if user has disabled location services in their profile
      if (userProfile?.enable_location_services === false) {
        console.info('User has disabled location services, using profile default location');
        const location = this.getUserDefaultLocation(userProfile);
        this.updateState({
          location,
          isLoading: false,
          hasPermission: false,
        });
        return location;
      }

      // User allows location services, try to get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.info('Location permission not granted, using profile default location');
        const location = this.getUserDefaultLocation(userProfile);
        this.updateState({
          location,
          isLoading: false,
          hasPermission: false,
        });
        return location;
      }

      console.info('Location permission granted, getting current location...');
      this.updateState({ hasPermission: true });

      // Get current location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = locationResult.coords;
      console.info(`Got user location: ${latitude}, ${longitude}`);
      
      const location: LocationCoordinates = {
        latitude,
        longitude,
        address: "Current Location",
      };

      this.updateState({
        location,
        isLoading: false,
        hasPermission: true,
      });

      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn("Failed to get user location, using profile default:", errorMessage);
      
      const location = this.getUserDefaultLocation(userProfile);
      this.updateState({
        location,
        isLoading: false,
        hasPermission: false,
        error: errorMessage,
      });
      
      return location;
    }
  }

  // Get user's default location from profile or fallback
  private getUserDefaultLocation(userProfile?: UserProfile): LocationCoordinates {
    if (userProfile?.latitude && userProfile?.longitude) {
      return {
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        address: userProfile.default_location || "Saved Location",
      };
    }
    
    return FALLBACK_LOCATION;
  }

  // Request location permission
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      this.updateState({ hasPermission });
      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ error: errorMessage, hasPermission: false });
      return false;
    }
  }

  // Get current location without updating global state
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: "Current Location",
      };
    } catch (error) {
      console.warn("Failed to get current location:", error);
      return null;
    }
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Format distance for display
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  // Check if location services are available
  async isLocationServicesEnabled(): Promise<boolean> {
    return await Location.hasServicesEnabledAsync();
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean);
        return parts.join(', ');
      }

      return null;
    } catch (error) {
      console.warn("Failed to get address from coordinates:", error);
      return null;
    }
  }

  // Get coordinates from address (geocoding)
  async getCoordinatesFromAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      const locations = await Location.geocodeAsync(address);
      
      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address,
        };
      }

      return null;
    } catch (error) {
      console.warn("Failed to get coordinates from address:", error);
      return null;
    }
  }

  // Reset location state
  reset() {
    this.updateState({
      location: null,
      isLoading: false,
      hasPermission: false,
      error: null,
    });
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();

// Hook for React components
export function useLocationService() {
  const [state, setState] = React.useState<LocationServiceState>(
    locationService.getState()
  );

  React.useEffect(() => {
    const unsubscribe = locationService.subscribe(setState);
    return unsubscribe;
  }, []);

  // Memoize the service methods to prevent unnecessary re-renders
  const methods = React.useMemo(() => ({
    initializeLocation: locationService.initializeLocation.bind(locationService),
    requestPermission: locationService.requestPermission.bind(locationService),
    getCurrentLocation: locationService.getCurrentLocation.bind(locationService),
    calculateDistance: locationService.calculateDistance.bind(locationService),
    formatDistance: locationService.formatDistance.bind(locationService),
    getAddressFromCoordinates: locationService.getAddressFromCoordinates.bind(locationService),
    getCoordinatesFromAddress: locationService.getCoordinatesFromAddress.bind(locationService),
    reset: locationService.reset.bind(locationService),
  }), []);

  return {
    ...state,
    ...methods,
  };
}
