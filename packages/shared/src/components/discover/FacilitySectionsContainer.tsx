import colors from '@shared/constants/custom-colors';
import { Funnel } from "phosphor-react-native";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { mapClubToFacilityCardProps } from "../../utils/mapClubToFacilityProps";
import { FacilitiesSections } from "./FacilitiesSections";

interface FacilitySectionsContainerProps {
  loading: boolean;
  searchQuery: string;
  hasActiveFilters: boolean;
  sortedClubs: any[];
  visibleGyms: any[];
  visibleGymsCount: number;
  topRated: any[];
  mostPopularClubs: any[];
  gyms: any[];
  onFacilityClick: (club: any) => void;
  isGymSelectedForDailyAccess: (gymId: string) => boolean;
  isDailyAccessMode: boolean;
  onAddToDailyAccess: (club: any) => void;
}

export const FacilitySectionsContainer: React.FC<FacilitySectionsContainerProps> = ({
  loading,
  searchQuery,
  hasActiveFilters,
  sortedClubs,
  visibleGyms,
  visibleGymsCount,
  topRated,
  mostPopularClubs,
  gyms,
  onFacilityClick,
  isGymSelectedForDailyAccess,
  isDailyAccessMode,
  onAddToDailyAccess,
}) => {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <View className="bg-surface/50 backdrop-blur-sm rounded-3xl p-8 items-center mx-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-textSecondary mt-4 font-medium">
            Söker faciliteter nära dig...
          </Text>
        </View>
      </View>
    );
  }

  // Show search results when user has searched or applied filters
  if (searchQuery.trim() || hasActiveFilters) {
    if (sortedClubs.length > 0) {
      return (
        <FacilitiesSections
          title="Sökresultat"
          description={`Hittade ${sortedClubs.length} faciliteter`}
          facilities={sortedClubs.map((club) =>
            mapClubToFacilityCardProps(
              club,
              () => onFacilityClick(club),
              "grid",
              isGymSelectedForDailyAccess(club.id),
              isDailyAccessMode,
              () => onAddToDailyAccess(club)
            )
          )}
        />
      );
    } else {
      return (
        <View className="flex-1 items-center justify-center py-16 mx-6">
          <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-8 items-center border border-surface/20 shadow-lg">
            <View className="bg-surface/40 p-4 rounded-2xl mb-4">
              <Funnel size={48} color={colors.textSecondary} />
            </View>
            <Text className="text-textPrimary font-semibold text-lg mb-2 text-center">
              Inga faciliteter hittades
              {searchQuery.trim() ? ` för "${searchQuery.trim()}"` : ""}
            </Text>
            <Text className="text-textSecondary text-center text-base opacity-80 leading-relaxed">
              Prova att justera din sökning eller filter för att hitta fler
              alternativ
            </Text>
          </View>
        </View>
      );
    }
  }

  // Default view with different sections
  return (
    <>
      <FacilitiesSections
        title="Högst betyg"
        description="Högst betygsatta av våra medlemmar"
        facilities={topRated.map((club) =>
          mapClubToFacilityCardProps(
            club,
            () => onFacilityClick(club),
            "grid",
            isGymSelectedForDailyAccess(club.id),
            isDailyAccessMode,
            () => onAddToDailyAccess(club)
          )
        )}
      />

      <FacilitiesSections
        title="Mest populära"
        description="Mest besökta"
        facilities={mostPopularClubs.map((club) =>
          mapClubToFacilityCardProps(
            club,
            () => onFacilityClick(club),
            "grid",
            isGymSelectedForDailyAccess(club.id),
            isDailyAccessMode,
            () => onAddToDailyAccess(club)
          )
        )}
      />

      <FacilitiesSections
        title="Nya partners"
        description="Nyligen tillagda till vårt nätverk"
        facilities={visibleGyms.map((club) =>
          mapClubToFacilityCardProps(
            club,
            () => onFacilityClick(club),
            "grid",
            isGymSelectedForDailyAccess(club.id),
            isDailyAccessMode,
            () => onAddToDailyAccess(club)
          )
        )}
      />
    </>
  );
};