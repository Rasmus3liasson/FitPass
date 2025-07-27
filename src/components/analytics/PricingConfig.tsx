import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Settings } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PricingConfigProps {
  clubId: string;
}

export const PricingConfig: React.FC<PricingConfigProps> = ({ clubId }) => {
  const [pricePerVisit, setPricePerVisit] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch current pricing
  const { data: club, isLoading } = useQuery({
    queryKey: ["club-pricing", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("price_per_visit")
        .eq("id", clubId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (club) {
      setPricePerVisit((club?.price_per_visit || 20).toString());
    }
  }, [club]);

  // Update pricing
  const updatePricingMutation = useMutation({
    mutationFn: async (newPrice: number) => {
      const { error } = await supabase
        .from("clubs")
        .update({ price_per_visit: newPrice })
        .eq("id", clubId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-pricing", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-revenue", clubId] });
      Alert.alert("Success", "Pricing updated successfully!");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update pricing");
      console.error("Pricing update error:", error);
    },
  });

  const handleSave = () => {
    const price = parseFloat(pricePerVisit);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0");
      return;
    }
    updatePricingMutation.mutate(price);
  };

  if (isLoading) {
    return (
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <Text className="text-textSecondary">Loading pricing configuration...</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Settings size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Pricing Configuration</Text>
      </View>

      <View className="mb-4">
        <Text className="text-textSecondary text-sm mb-2">Price per Visit (SEK)</Text>
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-accentGray text-white p-3 rounded-lg mr-3"
            value={pricePerVisit}
            onChangeText={setPricePerVisit}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor="#A0A0A0"
          />
          <TouchableOpacity
            className="bg-primary p-3 rounded-lg"
            onPress={handleSave}
            disabled={updatePricingMutation.isPending}
          >
            <Save size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-accentGray/30 p-3 rounded-lg">
        <Text className="text-textSecondary text-xs">
          💡 This price will be used for revenue calculations and can be updated anytime. 
          When you integrate Stripe, this will sync with your payment configuration.
        </Text>
      </View>
    </View>
  );
};
