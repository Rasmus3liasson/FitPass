import { AddressInfo } from './googlePlacesService';

/**
 * Unified geocoding service with automatic fallback
 * - Development: Uses LocationIQ (free)
 * - Production: Uses Google Maps API (paid)
 * - Automatic fallback if primary service fails
 */

interface AutocompleteResult {
  description: string;
  place_id: string;
  latitude?: number;
  longitude?: number;
}

interface GeocodingProvider {
  name: 'google' | 'locationiq';
  autocomplete: (query: string) => Promise<AutocompleteResult[]>;
  reverseGeocode: (lat: number, lon: number) => Promise<AddressInfo | null>;
}

class GeocodingService {
  private googleApiKey: string | undefined;
  private locationIqApiKey: string | undefined;
  private isDevelopment: boolean;

  constructor() {
    this.googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.locationIqApiKey = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;
    this.isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production';
  }

  /**
   * Get primary provider based on environment
   */
  private getPrimaryProvider(): 'google' | 'locationiq' | null {
    if (this.isDevelopment && this.locationIqApiKey) {
      return 'locationiq';
    }
    if (this.googleApiKey) {
      return 'google';
    }
    if (this.locationIqApiKey) {
      return 'locationiq';
    }
    return null;
  }

  /**
   * Get fallback provider
   */
  private getFallbackProvider(primary: 'google' | 'locationiq'): 'google' | 'locationiq' | null {
    if (primary === 'google' && this.locationIqApiKey) {
      return 'locationiq';
    }
    if (primary === 'locationiq' && this.googleApiKey) {
      return 'google';
    }
    return null;
  }

  /**
   * Autocomplete address search with automatic fallback
   */
  async autocomplete(query: string, countryCode: string = 'se'): Promise<AutocompleteResult[]> {
    const primary = this.getPrimaryProvider();

    if (!primary) {
      console.warn('No geocoding API keys configured');
      return [];
    }

    try {
      const results = await this.autocompleteWithProvider(query, countryCode, primary);
      if (results.length > 0) {
        return results;
      }

      // Try fallback if primary returns empty
      const fallback = this.getFallbackProvider(primary);
      if (fallback) {
        return await this.autocompleteWithProvider(query, countryCode, fallback);
      }

      return [];
    } catch (error) {
      console.error(`Autocomplete error with ${primary}:`, error);

      // Try fallback on error
      const fallback = this.getFallbackProvider(primary);
      if (fallback) {
        try {
          return await this.autocompleteWithProvider(query, countryCode, fallback);
        } catch (fallbackError) {
          console.error(`Fallback autocomplete error with ${fallback}:`, fallbackError);
          return [];
        }
      }

      return [];
    }
  }

  /**
   * Reverse geocode coordinates to address with automatic fallback
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<AddressInfo | null> {
    const primary = this.getPrimaryProvider();
    if (!primary) {
      console.warn('No geocoding API keys configured');
      return null;
    }

    try {
      const result = await this.reverseGeocodeWithProvider(latitude, longitude, primary);
      if (result) {
        return result;
      }

      // Try fallback if primary returns null
      const fallback = this.getFallbackProvider(primary);
      if (fallback) {
        return await this.reverseGeocodeWithProvider(latitude, longitude, fallback);
      }

      return null;
    } catch (error) {
      console.error(`Reverse geocode error with ${primary}:`, error);

      // Try fallback on error
      const fallback = this.getFallbackProvider(primary);
      if (fallback) {
        try {
          return await this.reverseGeocodeWithProvider(latitude, longitude, fallback);
        } catch (fallbackError) {
          console.error(`Fallback reverse geocode error with ${fallback}:`, fallbackError);
          return null;
        }
      }

      return null;
    }
  }

  async getProviderName(): Promise<string> {
    const primary = this.getPrimaryProvider();
    if (!primary) {
      return 'none';
    }
    return primary;
  }

  /**
   * Autocomplete with specific provider
   */
  private async autocompleteWithProvider(
    query: string,
    countryCode: string,
    provider: 'google' | 'locationiq'
  ): Promise<AutocompleteResult[]> {
    if (provider === 'google') {
      return await this.googleAutocomplete(query, countryCode);
    } else {
      return await this.locationIqAutocomplete(query, countryCode);
    }
  }

  /**
   * Reverse geocode with specific provider
   */
  private async reverseGeocodeWithProvider(
    latitude: number,
    longitude: number,
    provider: 'google' | 'locationiq'
  ): Promise<AddressInfo | null> {
    if (provider === 'google') {
      return await this.googleReverseGeocode(latitude, longitude);
    } else {
      return await this.locationIqReverseGeocode(latitude, longitude);
    }
  }

  // ========== LOCATIONIQ IMPLEMENTATION ==========

  private async locationIqAutocomplete(
    query: string,
    countryCode: string
  ): Promise<AutocompleteResult[]> {
    const url = `https://api.locationiq.com/v1/autocomplete?key=${this.locationIqApiKey}&q=${encodeURIComponent(
      query
    )}&limit=5&dedupe=1&normalizecity=1&countrycodes=${countryCode}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => ({
      description: item.display_name,
      place_id: item.place_id,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  }

  private async locationIqReverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<AddressInfo | null> {
    const url = `https://us1.locationiq.com/v1/reverse?key=${this.locationIqApiKey}&lat=${latitude}&lon=${longitude}&format=json&accept-language=sv`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.address) {
      return null;
    }

    const addr = data.address;
    return {
      formatted_address: data.display_name,
      latitude,
      longitude,
      street_number: addr.house_number,
      street_name: addr.road,
      city: addr.city || addr.town || addr.village || addr.municipality,
      postal_code: addr.postcode,
      country: addr.country,
    };
  }

  // ========== GOOGLE IMPLEMENTATION ==========

  private async googleAutocomplete(
    query: string,
    countryCode: string
  ): Promise<AutocompleteResult[]> {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&key=${this.googleApiKey}&components=country:${countryCode}&language=sv`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.predictions) {
      return [];
    }

    // For Google, we need to fetch place details to get coordinates
    const results = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction: any) => {
        const coords = await this.getGooglePlaceCoordinates(prediction.place_id);
        return {
          description: prediction.description,
          place_id: prediction.place_id,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        };
      })
    );

    return results;
  }

  private async getGooglePlaceCoordinates(
    placeId: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${this.googleApiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      }
    } catch (error) {
      console.error('Error fetching place coordinates:', error);
    }

    return null;
  }

  private async googleReverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<AddressInfo | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleApiKey}&language=sv`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return null;
    }

    const result = data.results[0];
    const components = result.address_components || [];

    const getComponent = (type: string) => {
      const comp = components.find((c: any) => c.types.includes(type));
      return comp?.long_name;
    };

    return {
      formatted_address: result.formatted_address,
      latitude,
      longitude,
      street_number: getComponent('street_number'),
      street_name: getComponent('route'),
      city: getComponent('locality') || getComponent('postal_town'),
      postal_code: getComponent('postal_code'),
      country: getComponent('country'),
    };
  }

  /**
   * Check if any provider is configured
   */
  isConfigured(): boolean {
    return !!(this.googleApiKey || this.locationIqApiKey);
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
