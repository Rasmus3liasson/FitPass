import { useCallback, useEffect, useMemo, useState } from "react";
import { getClassesRelatedToClub } from "../lib/integrations/supabase/queries/clubQueries";
import { useClubs } from "./useClubs";

interface SearchFilters {
  categories: string[];
  amenities: string[];
  distance: number;
  rating: number;
  priceRange: [number, number];
  openNow: boolean;
  hasClasses: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export const useAdvancedSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    amenities: [],
    distance: 25,
    rating: 0,
    priceRange: [1, 5],
    openNow: false,
    hasClasses: false,
  });

  const [clubsWithClasses, setClubsWithClasses] = useState<Set<string>>(
    new Set()
  );
  const [isCheckingClasses, setIsCheckingClasses] = useState(false);

  const { data: searchResults = [], isLoading } = useClubs({
    search: searchQuery,
    latitude: filters.location?.latitude,
    longitude: filters.location?.longitude,
    radius: filters.distance,
  });

  const searchResultsKey = useMemo(() => {
    return searchResults
      .map((club) => club.id)
      .sort()
      .join(",");
  }, [searchResults]);

  // Fetch class data when hasClasses filter is active
  useEffect(() => {
    if (filters.hasClasses && searchResults.length > 0) {
      const checkClubsForClasses = async () => {
        setIsCheckingClasses(true);
        const clubsWithClassesSet = new Set<string>();

        try {
          const classChecks = searchResults.map(async (club) => {
            try {
              const classes = await getClassesRelatedToClub(club.id);
              if (classes && classes.length > 0) {
                clubsWithClassesSet.add(club.id);
              }
            } catch (error) {
              console.warn(
                `Failed to fetch classes for club ${club.id}:`,
                error
              );
            }
          });

          await Promise.all(classChecks);
          setClubsWithClasses(clubsWithClassesSet);
        } catch (error) {
          console.error("Error checking clubs for classes:", error);
        } finally {
          setIsCheckingClasses(false);
        }
      };

      checkClubsForClasses();
    } else if (!filters.hasClasses) {
      setClubsWithClasses(new Set());
      setIsCheckingClasses(false);
    }
  }, [filters.hasClasses, searchResultsKey]);

  const filteredResults = useMemo(() => {
    let results = searchResults.filter((club) => {
      if (
        filters.categories.length > 0 &&
        club.type &&
        !filters.categories.includes(club.type)
      ) {
        return false;
      }

      if (filters.amenities.length > 0 && club.amenities) {
        const clubAmenities = Array.isArray(club.amenities)
          ? club.amenities
          : [];
        const hasMatchingAmenity = filters.amenities.some((amenity) =>
          clubAmenities.includes(amenity)
        );
        if (!hasMatchingAmenity) {
          return false;
        }
      }

      if (
        filters.rating > 0 &&
        club.avg_rating &&
        club.avg_rating < filters.rating
      ) {
        return false;
      }

      if (
        club.credits &&
        (club.credits < filters.priceRange[0] ||
          club.credits > filters.priceRange[1])
      ) {
        return false;
      }

      /* Should be implemented later on  */
      if (filters.openNow && club.open_hours) {
      }

      if (filters.hasClasses && !clubsWithClasses.has(club.id)) {
        return false;
      }

      return true;
    });

    return results;
  }, [searchResults, filters, clubsWithClasses]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      amenities: [],
      distance: 25,
      rating: 0,
      priceRange: [1, 5],
      openNow: false,
      hasClasses: false,
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.amenities.length > 0 ||
      filters.distance !== 25 ||
      filters.rating > 0 ||
      filters.priceRange[0] !== 1 ||
      filters.priceRange[1] !== 5 ||
      filters.openNow ||
      filters.hasClasses
    );
  }, [filters]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    searchResults: filteredResults,
    isLoading: isLoading || isCheckingClasses,
  };
};
