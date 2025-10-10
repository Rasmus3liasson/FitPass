import { ArrowLeft } from "lucide-react-native";
import React, { ReactNode } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export interface FilterOption<T = string> {
  key: T;
  label: string;
  icon: React.ComponentType<any>;
}

export interface ViewAllModalProps<T = any> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  // Stats section (optional)
  stats?: {
    mainValue: string;
    mainLabel: string;
    subValue: string;
    subLabel: string;
    customContent?: ReactNode;
  };
  // Filter/Sort options (optional)
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
  // Secondary filters (optional) - like rating filters in reviews
  secondaryFilters?: {
    options: { key: string | null; label: string; icon?: ReactNode }[];
    selected: string | null;
    onSelectionChange: (key: string | null) => void;
  };
  // Content
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  // Empty state
  emptyState?: {
    icon: ReactNode;
    title: string;
    subtitle: string;
  };
  // Custom content sections
  customHeaderContent?: ReactNode;
  customFilterContent?: ReactNode;
}

export function ViewAllModal<T = any>({
  visible,
  onClose,
  title,
  subtitle,
  stats,
  filterOptions,
  selectedFilter,
  onFilterChange,
  secondaryFilters,
  data,
  renderItem,
  emptyState,
  customHeaderContent,
  customFilterContent,
}: ViewAllModalProps<T>) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <StatusBar barStyle="light-content" />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
          <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-4 pb-6 bg-surface border-b border-accentGray">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 rounded-full bg-accentGray items-center justify-center"
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View className="flex-1 items-center">
                  <Text className="text-textPrimary font-bold text-lg" numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle && (
                    <Text className="text-accentGray text-sm" numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>

                <View className="w-10 h-10" />
              </View>

              {/* Stats Section */}
              {stats && (
                <View className="flex-row items-center justify-between">
                  {stats.customContent || (
                    <>
                      <View className="flex-row items-center">
                        <Text className="text-textPrimary font-bold text-2xl mr-2">
                          {stats.mainValue}
                        </Text>
                        <Text className="text-accentGray text-sm">
                          {stats.mainLabel}
                        </Text>
                      </View>
                      <Text className="text-accentGray text-sm">
                        {stats.subValue} {stats.subLabel}
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* Custom Header Content */}
              {customHeaderContent}
            </View>

            {/* Filter/Sort Options */}
            {(filterOptions || secondaryFilters || customFilterContent) && (
              <View className="px-4 py-4 border-b border-accentGray">
                {/* Primary Filters */}
                {filterOptions && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-3">
                      {filterOptions.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          onPress={() => onFilterChange?.(option.key)}
                          className={`flex-row items-center px-4 py-2 rounded-full ${
                            selectedFilter === option.key ? 'bg-primary' : 'bg-surface'
                          }`}
                        >
                          <option.icon 
                            size={14} 
                            color={selectedFilter === option.key ? '#FFFFFF' : '#A0A0A0'} 
                          />
                          <Text className={`ml-2 text-sm font-medium ${
                            selectedFilter === option.key ? 'text-textPrimary' : 'text-accentGray'
                          }`}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {/* Secondary Filters */}
                {secondaryFilters && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    className={filterOptions ? "mt-3" : ""}
                  >
                    <View className="flex-row space-x-2">
                      {secondaryFilters.options.map((option) => (
                        <TouchableOpacity
                          key={option.key?.toString() || 'all'}
                          onPress={() => secondaryFilters.onSelectionChange(option.key)}
                          className={`flex-row items-center px-3 py-2 rounded-full ${
                            secondaryFilters.selected === option.key ? 'bg-primary' : 'bg-surface'
                          }`}
                        >
                          {option.icon}
                          <Text className={`text-sm font-medium ${
                            option.icon ? 'ml-1' : ''
                          } ${
                            secondaryFilters.selected === option.key ? 'text-textPrimary' : 'text-accentGray'
                          }`}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {/* Custom Filter Content */}
                {customFilterContent}
              </View>
            )}

            {/* Content List */}
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <View key={index} className="mb-3 mt-3">
                    {renderItem(item, index)}
                  </View>
                ))
              ) : (
                emptyState && (
                  <View className="flex-1 items-center justify-center py-12">
                    <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                      {emptyState.icon}
                    </View>
                    <Text className="text-textPrimary font-semibold text-lg mb-2">
                      {emptyState.title}
                    </Text>
                    <Text className="text-accentGray text-sm text-center">
                      {emptyState.subtitle}
                    </Text>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
