// This component needs to be moved to mobile app as it imports from app folder
// For now, commenting out the import
// import FacilitiesSections from "@/src/app/discover/facilitiesSections";
import { Filter } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "../components/Button";
import { mapClubToFacilityCardProps } from "../utils/mapClubToFacilityProps";

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
  onShowMore: () => void;
  onShowLess: () => void;
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
  onShowMore,
  onShowLess,
}) => {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <View className="bg-surface/50 backdrop-blur-sm rounded-3xl p-8 items-center mx-6">
          <ActivityIndicator size="large" color="#6366F1" />
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
              <Filter size={48} color="#A0A0A0" />
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

      {visibleGymsCount < gyms.length && (
        <View className="px-6 py-4">
          <Button
            title="Visa fler anläggningar"
            onPress={onShowMore}
            variant="secondary"
            style="bg-surface/30 backdrop-blur-sm border border-surface/20 shadow-lg"
          />
        </View>
      )}
      
      {visibleGymsCount > 4 && (
        <View className="px-6 py-2">
          <Button
            title="Visa färre"
            onPress={onShowLess}
            variant="outline"
            style="border-textSecondary/30 bg-transparent"
          />
        </View>
      )}
    </>
  );
};