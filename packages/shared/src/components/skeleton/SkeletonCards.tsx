import React from "react";
import { View } from "react-native";
import { SkeletonBox } from "./SkeletonBox";

/**
 * Generic card skeleton for list items
 */
export const SkeletonCard: React.FC = () => {
  return (
    <View className="bg-surface rounded-2xl p-4 border border-white/5 mb-3">
      <View className="flex-row items-center">
        <SkeletonBox className="w-12 h-12 mr-4" rounded="full" />
        <View className="flex-1">
          <SkeletonBox className="w-30 h-4 mb-2" />
          <SkeletonBox className="w-40 h-3" />
        </View>
        <SkeletonBox className="w-5 h-5" />
      </View>
    </View>
  );
};

/**
 * Skeleton for facility/club cards
 */
export const SkeletonFacilityCard: React.FC = () => {
  return (
    <View className="bg-surface rounded-3xl overflow-hidden mb-4">
      {/* Image skeleton */}
      <SkeletonBox className="w-full h-48" rounded="none" />
      
      {/* Content skeleton */}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <SkeletonBox className="w-36 h-5" />
          <SkeletonBox className="w-16 h-6" rounded="full" />
        </View>
        <SkeletonBox className="w-full h-3.5 mb-2" />
        <SkeletonBox className="w-4/5 h-3.5" />
        
        {/* Stats row */}
        <View className="flex-row gap-4 mt-4">
          <SkeletonBox className="w-16 h-3" />
          <SkeletonBox className="w-16 h-3" />
          <SkeletonBox className="w-16 h-3" />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for list screens
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View className="px-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};
