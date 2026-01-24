import { useCallback, useEffect, useMemo, useState } from 'react';
import { getClassesRelatedToClub } from '../lib/integrations/supabase/queries/clubQueries';
import { useClubs } from './useClubs';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    amenities: [],
    distance: 999999, // No distance limit by default - show all clubs
    rating: 0,
    priceRange: [1, 5],
    openNow: false,
    hasClasses: false,
  });

  const [clubsWithClasses, setClubsWithClasses] = useState<Set<string>>(new Set());
  const [isCheckingClasses, setIsCheckingClasses] = useState(false);

  // Get clubs with search and conditional location filtering
  // Only apply location filtering if location is set AND distance is not the default (999999km = no limit)
  const shouldApplyLocationFilter = filters.location && filters.distance !== 999999;

  const { data: searchResults = [], isLoading } = useClubs({
    search: searchQuery,
    latitude: shouldApplyLocationFilter ? filters.location?.latitude : undefined,
    longitude: shouldApplyLocationFilter ? filters.location?.longitude : undefined,
    radius: shouldApplyLocationFilter ? filters.distance : undefined,
  });

  const searchResultsKey = useMemo(() => {
    return searchResults
      .map((club) => club.id)
      .sort()
      .join(',');
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
              console.warn(`Failed to fetch classes for club ${club.id}:`, error);
            }
          });

          await Promise.all(classChecks);
          setClubsWithClasses(clubsWithClassesSet);
        } catch (error) {
          console.error('Error checking clubs for classes:', error);
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
      if (filters.categories.length > 0 && club.type && !filters.categories.includes(club.type)) {
        return false;
      }

      if (filters.amenities.length > 0 && club.amenities) {
        const clubAmenities = Array.isArray(club.amenities) ? club.amenities : [];
        const hasMatchingAmenity = filters.amenities.some((amenity) =>
          clubAmenities.includes(amenity)
        );
        if (!hasMatchingAmenity) {
          return false;
        }
      }

      if (filters.rating > 0 && club.avg_rating && club.avg_rating < filters.rating) {
        return false;
      }

      if (
        club.credits &&
        (club.credits < filters.priceRange[0] || club.credits > filters.priceRange[1])
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
    setFilters((prev) => {
      const updatedFilters = { ...prev, ...newFilters };

      // If distance is set to "All" (999999), remove location to ensure no location filtering
      if (updatedFilters.distance === 999999) {
        delete updatedFilters.location;
      }

      return updatedFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      amenities: [],
      distance: 999999, // No distance limit by default
      rating: 0,
      priceRange: [1, 5],
      openNow: false,
      hasClasses: false,
      // No location by default - user must explicitly choose to use location
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.amenities.length > 0 ||
      filters.distance !== 999999 ||
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
