import colors from '@fitpass/shared/constants/custom-colors';
import { useRouter } from 'expo-router';
import { MapPin, SlidersHorizontal } from 'phosphor-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../config/constants';
import { SimpleSearchBar } from '../search/SimpleSearchBar';

interface SearchAndFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  hasActiveFilters: boolean;
  onShowAdvancedFilters: () => void;
}

export const SearchAndFiltersBar: React.FC<SearchAndFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  hasActiveFilters,
  onShowAdvancedFilters,
}) => {
  const router = useRouter();

  return (
    <View className="px-6 pb-4">
      <View className="flex-row items-center space-x-3">
        <View className="flex-1">
          <SimpleSearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            onSearch={onSearch}
            placeholder="Sök faciliteter..."
          />
        </View>
        <TouchableOpacity
          className={`rounded-2xl p-3 border shadow-lg ${
            hasActiveFilters
              ? 'bg-primary/20 border-primary/30'
              : 'bg-surface/30 border-surface/20 backdrop-blur-sm'
          }`}
          onPress={onShowAdvancedFilters}
        >
          <SlidersHorizontal
            size={22}
            color={hasActiveFilters ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-surface/30 backdrop-blur-sm border border-surface/20 rounded-2xl p-3 shadow-lg"
          onPress={() => router.push(ROUTES.MAP as any)}
        >
          <MapPin size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
