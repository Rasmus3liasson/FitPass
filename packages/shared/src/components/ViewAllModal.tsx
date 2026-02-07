import React, { ReactNode } from 'react';
import { Modal, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from './Button';
import { PageHeader } from './PageHeader';

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
  customFilterContent?: ReactNode;
  footerContent?: ReactNode;
}

export function ViewAllModal<T>({
  visible,
  onClose,
  title,
  subtitle,
  filterOptions,
  selectedFilter,
  onFilterChange,
  secondaryFilters,
  data,
  renderItem,
  emptyState,
  customFilterContent,
  footerContent,
}: ViewAllModalProps<T>) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header */}
        <View className="border-b border-accentGray/30">
          <PageHeader
            title={title}
            subtitle={subtitle}
            rightElement={<CloseButton onPress={onClose} />}
          />
        </View>

        {/* Filters */}
        <Filters
          filterOptions={filterOptions}
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
          secondaryFilters={secondaryFilters}
        >
          {customFilterContent}
        </Filters>

        {/* Content */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {data.length > 0
            ? data.map((item, index) => (
                <View key={index} className="my-3">
                  {renderItem(item, index)}
                </View>
              ))
            : emptyState && <EmptyState {...emptyState} />}
        </ScrollView>

        {/* Footer */}
        {footerContent && (
          <View
            className="border-t border-accentGray/30 bg-surface px-4 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {footerContent}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ---------------- Filters ---------------- */

function Filters({
  filterOptions,
  selectedFilter,
  onFilterChange,
  secondaryFilters,
  children,
}: any) {
  if (!filterOptions && !secondaryFilters && !children) return null;

  return (
    <View className="px-4 border-b border-accentGray">
      {filterOptions && (
        <ChipRow options={filterOptions} selected={selectedFilter} onSelect={onFilterChange} />
      )}

      {secondaryFilters && (
        <ChipRow
          options={secondaryFilters.options}
          selected={secondaryFilters.selected}
          onSelect={secondaryFilters.onSelectionChange}
          className={filterOptions ? 'mt-3' : ''}
        />
      )}

      {children}
    </View>
  );
}

/* ---------------- Chip Row ---------------- */

function ChipRow({ options, selected, onSelect, className = '' }: any) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={className}>
      <View className="flex-row space-x-3">
        {options.map((option: any) => {
          const isSelected = selected === option.key;
          const Icon = option.icon;

          return (
            <TouchableOpacity
              key={option.key?.toString() || 'all'}
              onPress={() => onSelect?.(option.key)}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                isSelected ? 'bg-primary' : 'bg-surface'
              }`}
            >
              {Icon && (typeof Icon === 'function' ? <Icon size={14} color="#FFFFFF" /> : Icon)}

              <Text
                className={`text-sm font-medium ${Icon ? 'ml-1' : ''} ${
                  isSelected ? 'text-textPrimary' : 'text-textSecondary'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ---------------- Empty State ---------------- */

function EmptyState({ icon, title, subtitle }: any) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      {icon && (
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          {icon}
        </View>
      )}

      <Text className="text-textPrimary font-semibold text-lg mb-2">{title}</Text>
      <Text className="text-textSecondary text-sm text-center">{subtitle}</Text>
    </View>
  );
}
