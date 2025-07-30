import { CreditCard, Mail, MapPin, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useProfileBilling } from "../hooks/useProfileBilling";

interface SmartBillingFormProps {
  onBillingDataReady?: (billingDetails: any) => void;
  showAutoFillButton?: boolean;
  title?: string;
}

export const SmartBillingForm: React.FC<SmartBillingFormProps> = ({
  onBillingDataReady,
  showAutoFillButton = true,
  title = "Faktureingsuppgifter",
}) => {
  const { user } = useAuth();
  const {
    hasCompleteBillingInfo,
    getMissingBillingFields,
    createCustomerFromProfile,
    isUpdating,
    userProfile,
  } = useProfileBilling();

  // Use profile fields directly
  let name = "";
  if (userProfile?.display_name) {
    name = userProfile.display_name;
  } else if (userProfile?.first_name && userProfile?.last_name) {
    name = `${userProfile.first_name} ${userProfile.last_name}`;
  } else if (userProfile?.first_name) {
    name = userProfile.first_name;
  } else if (userProfile?.last_name) {
    name = userProfile.last_name;
  } else if (userProfile?.full_name) {
    name = userProfile.full_name;
  }
  // Always get email from auth user
  const email = user?.email || "";
  const address = userProfile?.default_location || "";

  const [autoFilled, setAutoFilled] = useState(false);
  const missingFields = getMissingBillingFields();
  const isComplete = hasCompleteBillingInfo();

  useEffect(() => {
    if (onBillingDataReady && userProfile) {
      onBillingDataReady({
        name,
        email,
        address: { line1: address },
      });
    }
  }, [name, email, address, userProfile, onBillingDataReady]);

  const handleAutoFill = async () => {
    try {
      setAutoFilled(true);
      if (isComplete) {
        Alert.alert(
          "Uppgifter ifyllda",
          "Dina faktureingsuppgifter har fyllts i automatiskt från din profil.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Ofullständig profil",
          `Vissa uppgifter saknas: ${missingFields.join(
            ", "
          )}. Du kan ändå fylla i med det som finns, men behöver komplettera din profil för att slutföra.`,
          [
            { text: "Avbryt", style: "cancel" },
            {
              text: "Gå till profil",
              onPress: () => {
                // Navigate to profile edit
                // You can implement navigation här
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Fel", "Kunde inte fylla i uppgifterna automatiskt");
    }
  };

  if (!userProfile) {
    return (
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <ActivityIndicator size="small" color="#6366F1" />
        <Text className="text-textSecondary text-center mt-2">
          Laddar profiluppgifter...
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-semibold">{title}</Text>
        {showAutoFillButton && (
          <TouchableOpacity
            onPress={handleAutoFill}
            disabled={isUpdating}
            className={`px-3 py-2 rounded-lg ${
              isComplete
                ? "bg-primary/20 border border-primary/30"
                : "bg-orange-500/20 border border-orange-500/30"
            }`}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text
                className={`text-sm font-medium ${
                  isComplete ? "text-primary" : "text-orange-400"
                }`}
              >
                Fyll i automatiskt
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Billing Information Preview */}
      <View className="space-y-3">
        {/* Name */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
            <User size={14} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-medium">Namn</Text>
            <Text className="text-textSecondary text-sm">
              {name || "Ej angivet i profil"}
            </Text>
          </View>
          {!name && <View className="w-2 h-2 rounded-full bg-orange-500" />}
        </View>

        {/* Email */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Mail size={14} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-medium">E-post</Text>
            <Text className="text-textSecondary text-sm">
              {email || "Ej tillgänglig"}
            </Text>
          </View>
          {!email && <View className="w-2 h-2 rounded-full bg-orange-500" />}
        </View>

        {/* Address */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
            <MapPin size={14} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-medium">Adress</Text>
            <Text className="text-textSecondary text-sm">
              {address || "Ej angiven i profil"}
            </Text>
          </View>
          {!address && <View className="w-2 h-2 rounded-full bg-orange-500" />}
        </View>
      </View>

      {/* Status */}
      <View
        className={`mt-4 p-3 rounded-lg ${
          isComplete
            ? "bg-green-500/20 border border-green-500/30"
            : "bg-orange-500/20 border border-orange-500/30"
        }`}
      >
        <View className="flex-row items-center">
          <CreditCard size={16} color={isComplete ? "#10B981" : "#F59E0B"} />
          <Text
            className={`ml-2 text-sm font-medium ${
              isComplete ? "text-green-400" : "text-orange-400"
            }`}
          >
            {isComplete
              ? "Faktureingsuppgifter kompletta"
              : `Saknas: ${missingFields.join(", ")}`}
          </Text>
        </View>
        {autoFilled && (
          <Text className="text-green-400 text-xs mt-1">
            ✓ Automatiskt ifylld från profil
          </Text>
        )}
      </View>

      {!isComplete && (
        <Text className="text-textSecondary text-xs mt-2 text-center">
          Komplettera din profil för att kunna fylla i faktureingsuppgifter
          automatiskt
        </Text>
      )}
    </View>
  );
};
