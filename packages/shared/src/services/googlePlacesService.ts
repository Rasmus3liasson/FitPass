// You'll need to add your Google Places API key to your environment variables
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
}

export interface AddressInfo {
  formatted_address: string;
  latitude: number;
  longitude: number;
  street_number?: string;
  street_name?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

class GooglePlacesService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get place details by place_id
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return data.result;
      }

      throw new Error(`Places API error: ${data.status}`);
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Convert place details to structured address info
   */
  extractAddressInfo(placeDetails: PlaceDetails): AddressInfo {
    const addressInfo: AddressInfo = {
      formatted_address: placeDetails.formatted_address,
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
    };

    // Extract address components
    placeDetails.address_components.forEach((component) => {
      if (component.types.includes('street_number')) {
        addressInfo.street_number = component.long_name;
      } else if (component.types.includes('route')) {
        addressInfo.street_name = component.long_name;
      } else if (
        component.types.includes('locality') ||
        component.types.includes('administrative_area_level_2')
      ) {
        addressInfo.city = component.long_name;
      } else if (component.types.includes('postal_code')) {
        addressInfo.postal_code = component.long_name;
      } else if (component.types.includes('country')) {
        addressInfo.country = component.long_name;
      }
    });

    return addressInfo;
  }

  /**
   * Get address info from coordinates (reverse geocoding)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<AddressInfo | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          formatted_address: result.formatted_address,
          latitude: latitude,
          longitude: longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Validate if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }
}

export const googlePlacesService = new GooglePlacesService(GOOGLE_PLACES_API_KEY);
