import { Membership } from "@/types";
import {
    Activity,
    Calendar,
    ChevronRight,
    CreditCard,
    Settings,
    Star,
    TrendingUp,
    Zap
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MembershipCardProps {
  membership: Membership | null;
  onPress: () => void;
}

export function MembershipCard({ membership, onPress }: MembershipCardProps) {
  if (membership) {
    return (
      <TouchableOpacity
        className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl mt-4 mx-4 overflow-hidden"
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        <View className="p-6 relative">
          {/* Floating Badge */}
          <View className="absolute top-4 right-4">
            <View className="bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 flex-row items-center">
              <Star size={14} color="#ffffff" fill="#ffffff" />
              <Text className="text-white text-xs font-bold ml-1 tracking-wider">
                AKTIV
              </Text>
            </View>
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
              NUVARANDE PLAN
            </Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              {membership.plan_type || "Premium"}
            </Text>
            <Text className="text-white/70 text-sm font-medium">
              Obegränsad access • Alla faciliteter
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row mb-6 gap-3">
            {/* Credits Card */}
            <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <View className="flex-row items-center justify-between mb-2">
                <Zap size={18} color="#ffffff" />
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  Krediter
                </Text>
              </View>
              <Text className="text-white text-2xl font-black">
                {membership.credits - (membership.credits_used || 0)}
              </Text>
              <Text className="text-white/60 text-xs">
                av {membership.credits} totalt
              </Text>
            </View>

            {/* Usage Card */}
            <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <View className="flex-row items-center justify-between mb-2">
                <Activity size={18} color="#ffffff" />
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  Använt
                </Text>
              </View>
              <Text className="text-white text-2xl font-black">
                {membership.credits_used || 0}
              </Text>
              <Text className="text-white/60 text-xs">
                träningspass
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white/70 text-xs font-semibold tracking-wide">
                MÅNADSFÖRBRUKNING
              </Text>
              <Text className="text-white text-xs font-bold">
                {Math.round(((membership.credits_used || 0) / membership.credits) * 100)}%
              </Text>
            </View>
            <View className="bg-white/20 rounded-full h-2 overflow-hidden">
              <View 
                className="bg-white rounded-full h-full"
                style={{ 
                  width: `${Math.min(((membership.credits_used || 0) / membership.credits) * 100, 100)}%` 
                }}
              />
            </View>
          </View>

          {/* Action Hint */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                <Settings size={16} color="#ffffff" />
              </View>
              <Text className="text-white/80 text-sm font-medium">
                Hantera medlemskap
              </Text>
            </View>
            <ChevronRight size={20} color="#ffffff" opacity={0.7} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // No membership state
  return (
    <TouchableOpacity
      className="bg-gradient-to-br from-surface via-background to-surface rounded-3xl mt-4 mx-4 border-2 border-dashed border-primary/30 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View className="p-8 items-center relative">
        {/* Decorative Elements */}
        <View className="absolute top-4 right-4 opacity-20">
          <TrendingUp size={32} color="#6366F1" />
        </View>
        <View className="absolute top-8 left-4 opacity-10">
          <Star size={24} color="#6366F1" />
        </View>

        {/* Main Icon */}
        <View className="relative mb-6">
          <View className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 items-center justify-center mb-2">
            <CreditCard size={36} color="#6366F1" />
          </View>
          <View className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full items-center justify-center">
            <Text className="text-white text-xs font-black">+</Text>
          </View>
        </View>

        {/* Content */}
        <Text className="text-textPrimary text-xl font-black mb-2 text-center">
          Inget aktivt medlemskap
        </Text>
        <Text className="text-textSecondary text-center mb-6 leading-relaxed">
          Upptäck obegränsad träning på Stockholms 
          bästa gym och träningscenter
        </Text>

        {/* Features */}
        <View className="w-full mb-6">
          <View className="flex-row items-center mb-3">
            <View className="w-2 h-2 bg-primary rounded-full mr-3" />
            <Text className="text-textSecondary text-sm font-medium">
              Tillgång till 500+ anläggningar
            </Text>
          </View>
          <View className="flex-row items-center mb-3">
            <View className="w-2 h-2 bg-primary rounded-full mr-3" />
            <Text className="text-textSecondary text-sm font-medium">
              Obegränsade träningspass
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-primary rounded-full mr-3" />
            <Text className="text-textSecondary text-sm font-medium">
              Premiumklasser & PT-sessioner
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <View className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl py-4 px-8 w-full max-w-xs">
          <View className="flex-row items-center justify-center">
            <Calendar size={18} color="#ffffff" />
            <Text className="text-white font-bold text-base ml-2 tracking-wide">
              Välj medlemskap
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}