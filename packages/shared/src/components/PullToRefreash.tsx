import colors from '@shared/constants/custom-colors';
import React, { JSX } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

interface PullToRefreshListProps<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  renderItem: ({ item }: { item: T }) => JSX.Element;
  keyExtractor: (item: T, index: number) => string;
}

export function PullToRefreshList<T>({
  data,
  isLoading,
  isRefreshing,
  onRefresh,
  renderItem,
  keyExtractor,
}: PullToRefreshListProps<T>) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#000"
          title="Laddar..."
          titleColor="#000"
        />
      }
    />
  );
}
