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
import { CloseButton } from "./Button";
import { PageHeader } from "./PageHeader";

export interface FilterOption<T = string> {
  key: T;
  label: string;
  icon?: React.ComponentType<any>;
}

export interface ViewAllModalProps<T = any> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  stats?: {
    mainValue: string;
    mainLabel: string;
    subValue: string;
    subLabel: string;
    customContent?: ReactNode;
  };
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
  secondaryFilters?: {
    options: { key: string | null; label: string; icon?: ReactNode }[];
    selected: string | null;
    onSelectionChange: (key: string | null) => void;
  };
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    subtitle: string;
  };
  customHeaderContent?: ReactNode;
  customFilterContent?: ReactNode;
  footerContent?: ReactNode;
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
  footerContent,
}: ViewAllModalProps<T>) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Header */}
            <View className="border-b border-accentGray/30">
              <PageHeader
                title={title}
                subtitle={subtitle}
                rightElement={<CloseButton onPress={onClose} />}
              />
            </View>

            {/* Filters */}
            {(filterOptions || secondaryFilters || customFilterContent) && (
              <View className="px-4 border-b border-accentGray">
                {/* Primary Filters */}
                {filterOptions && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-3">
                      {filterOptions.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          onPress={() => onFilterChange?.(option.key)}
                          className={`flex-row items-center px-4 py-2 rounded-full ${
                            selectedFilter === option.key
                              ? "bg-primary"
                              : "bg-surface"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selectedFilter === option.key
                                ? "text-textPrimary"
                                : "text-textSecondary"
                            }`}
                          >
                            {option.label}
                          </Text>
                          {option.icon && (
                            <View className="ml-2">
                              <option.icon size={14} color="#FFFFFF" />
                            </View>
                          )}
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
                          key={option.key?.toString() || "all"}
                          onPress={() =>
                            secondaryFilters.onSelectionChange(option.key)
                          }
                          className={`flex-row items-center px-3 py-2 rounded-full ${
                            secondaryFilters.selected === option.key
                              ? "bg-primary"
                              : "bg-surface"
                          }`}
                        >
                          {option.icon}
                          <Text
                            className={`text-sm font-medium ${
                              option.icon ? "ml-1" : ""
                            } ${
                              secondaryFilters.selected === option.key
                                ? "text-textPrimary"
                                : "text-textSecondary"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {customFilterContent}
              </View>
            )}

            {/* Scrollable Content */}
            <View className="flex-1">
              <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                contentContainerClassName={
                  data.length === 0 ? "flex-grow justify-center" : ""
                }
              >
                {data.length > 0
                  ? data.map((item, index) => (
                      <View key={index} className="mb-3 mt-3">
                        {renderItem(item, index)}
                      </View>
                    ))
                  : emptyState && (
                      <View className="flex-1 items-center justify-center py-12">
                        {emptyState.icon && (
                          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                            {emptyState.icon}
                          </View>
                        )}

                        <Text className="text-textPrimary font-semibold text-lg mb-2">
                          {emptyState.title}
                        </Text>
                        <Text className="text-textSecondary text-sm text-center">
                          {emptyState.subtitle}
                        </Text>
                      </View>
                    )}
              </ScrollView>

              {footerContent && (
                <View className="border-accentGray bg-surface px-4 py-4 rounded-t-lg">
                  {footerContent}
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
