import React from "react";
import { View } from "react-native";
import { Section } from "../Section";
import { SkeletonBox } from "./SkeletonBox";

/**
 * Loading skeleton for membership management screen
 */
export const MembershipManagementSkeleton: React.FC = () => {
  return (
    <>
      {/* Current Plan Skeleton */}
      <Section title="Nuvarande Plan">
        <View className="mx-4 mt-4">
          <View className="bg-surface rounded-3xl p-6 border border-white/5">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <SkeletonBox className="w-20 h-3 mb-2" />
                <SkeletonBox className="w-24 h-6" />
              </View>
              <SkeletonBox className="w-16 h-6" rounded="full" />
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-white/5 rounded-2xl p-4">
                <SkeletonBox className="w-16 h-4 mb-2" />
                <SkeletonBox className="w-12 h-5 mb-1" />
                <SkeletonBox className="w-20 h-3" />
              </View>
              <View className="flex-1 bg-white/5 rounded-2xl p-4">
                <SkeletonBox className="w-16 h-4 mb-2" />
                <SkeletonBox className="w-12 h-5 mb-1" />
                <SkeletonBox className="w-20 h-3" />
              </View>
            </View>

            {/* Progress Bar */}
            <SkeletonBox className="w-full h-2" rounded="full" />
          </View>
        </View>
      </Section>

      {/* Quick Actions Skeleton */}
      <Section title="Snabbåtgärder">
        <View className="mx-4 mt-4 space-y-2">
          {[1, 2, 3, 4].map((index) => (
            <View
              key={index}
              className="bg-surface rounded-2xl p-4 border border-white/5 mb-2"
            >
              <View className="flex-row items-center">
                <SkeletonBox className="w-12 h-12 mr-4" rounded="full" />
                <View className="flex-1">
                  <SkeletonBox className="w-24 h-4 mb-2" />
                  <SkeletonBox className="w-32 h-3" />
                </View>
                <SkeletonBox className="w-5 h-5" />
              </View>
            </View>
          ))}
        </View>
      </Section>
    </>
  );
};
