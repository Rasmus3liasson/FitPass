import { useLocationService } from "@/src/services/locationService";
import { getOpenState } from "@/src/utils/openingHours";
import { useState } from "react";

interface UseAdvancedFiltersProps {
  searchResults: any[];
  categories: any[];
  amenities: any[];
  updateFilters: (filters: any) => void;
}

export const useAdvancedFilters = ({
  searchResults,
  categories,
  amenities,
  updateFilters,
}: UseAdvancedFiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { location, calculateDistance } = useLocationService();

  const handleApplyFilters = (appliedFilters: any) => {
    // If distance is not "All" (999999) and location is available, include location
    if (appliedFilters.distance !== 999999 && location) {
      const filtersWithLocation = {
        ...appliedFilters,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || "Nuvarande plats",
        },
      };

      updateFilters(filtersWithLocation);
    } else {
      updateFilters(appliedFilters);
    }
  };

  const calculateFilterResultCount = (tempFilters: any) => {
    // This function calculates how many clubs would match the temporary filters
    // without actually applying them yet

    const filteredResults = searchResults.filter((club) => {
      // Category filter - map categories to club types
      if (tempFilters.categories.length > 0) {
        const hasMatchingCategory = tempFilters.categories.some(
          (categoryId: string) => {
            // Safety check for undefined categoryId
            if (!categoryId) return false;

            // Find the category object by ID
            const category = categories.find(
              (cat) =>
                (cat.id && cat.id === categoryId) ||
                (cat.name && cat.name === categoryId)
            );

            if (!category) {
              return false;
            }

            const categoryName = category.name?.toLowerCase() || "";
            const clubType = club.type?.toLowerCase() || "";

            // Create a more flexible mapping between category names and club types
            const isMatch =
              categoryName === clubType ||
              clubType.includes(categoryName) ||
              categoryName.includes(clubType) ||
              // Additional mappings for common mismatches
              (categoryName === "fitness" && clubType === "gym") ||
              (categoryName === "gym" && clubType === "fitness") ||
              (categoryName === "health" &&
                (clubType === "gym" || clubType === "fitness")) ||
              (categoryName === "wellness" &&
                (clubType === "spa" || clubType === "fitness"));

            return isMatch;
          }
        );

        if (!hasMatchingCategory) return false;
      }

      // Amenity filter - check if club has any of the selected amenities
      if (tempFilters.amenities.length > 0) {
        const clubAmenities = club.amenities || [];
        const hasMatchingAmenity = tempFilters.amenities.some(
          (amenityId: string) => {
            // Check if amenityId matches directly (if it's already the amenity name)
            if (clubAmenities.includes(amenityId)) return true;

            // Find the amenity object by ID and check by name
            const amenity = amenities.find(
              (a) =>
                (a.id && a.id === amenityId) ||
                (a.name && a.name === amenityId)
            );

            if (
              amenity &&
              amenity.name &&
              clubAmenities.includes(amenity.name)
            ) {
              return true;
            }

            return false;
          }
        );

        if (!hasMatchingAmenity) return false;
      }

      // Rating filter
      if (tempFilters.rating > 0) {
        const clubRating = club.avg_rating || 0;
        if (clubRating < tempFilters.rating) return false;
      }

      // Distance filter - use current location if distance is not "All" and location is available
      if (
        tempFilters.distance !== 999999 &&
        location &&
        club.latitude &&
        club.longitude
      ) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          club.latitude,
          club.longitude
        );
        if (distance > tempFilters.distance) return false;
      }

      // Open now filter
      if (tempFilters.openNow) {
        const openState = getOpenState(club.open_hours);
        if (openState !== "open") return false;
      }

      // Has classes filter - check if club offers classes
      if (tempFilters.hasClasses) {
        // You might want to add a proper field to the Club interface
        // For now, exclude certain types that typically don't have classes
        const hasClasses =
          club.type !== "restaurant" && club.type !== "spa";

        if (!hasClasses) return false;
      }

      return true;
    });

    return filteredResults.length;
  };

  return {
    showAdvancedFilters,
    setShowAdvancedFilters,
    handleApplyFilters,
    calculateFilterResultCount,
  };
};