import {
  createStripeOnboarding,
  createStripeUpdateLink,
  getStripeConnectStatus,
  refreshClubData,
} from "../services/stripeConnectService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface StripeConnectSectionProps {
  clubId: string;
  clubData: {
    name?: string;
    address?: string;
    org_number?: string;
  };
}

export const StripeConnectSection: React.FC<StripeConnectSectionProps> = ({
  clubId,
  clubData,
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["stripe-connect-status", clubId],
    queryFn: getStripeConnectStatus,
  });

  const missingInfo: string[] = [];
  if (!clubData.name?.trim()) missingInfo.push("Klubbnamn");
  if (!clubData.address?.trim()) missingInfo.push("Adress");
  if (!clubData.org_number?.trim()) missingInfo.push("Organisationsnummer");

  const canConnect = missingInfo.length === 0;

  const handleConnect = async () => {
    if (!canConnect) {
      setFeedback({
        type: "error",
        message: `Fyll i följande information först: ${missingInfo.join(", ")}`,
      });
      return;
    }

    try {
      setIsLoading(true);
      setFeedback(null);

      const returnUrl = "http://localhost:3001/stripe-connect-return";
      const refreshUrl = "http://localhost:3001/stripe-connect-refresh";

      const { url } = await createStripeOnboarding(returnUrl, refreshUrl);

      const result = await WebBrowser.openBrowserAsync(url);

      if (result.type === "cancel" || result.type === "dismiss") {
        await refreshStatus();
      }
    } catch (error) {
      console.error("Error in create-stripe-onboarding:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kunde inte skapa Stripe-länk",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      setIsLoading(true);
      setFeedback(null);

      const returnUrl = "http://localhost:3001/stripe-connect-return";
      const refreshUrl = "http://localhost:3001/stripe-connect-refresh";

      const { url } = await createStripeUpdateLink(returnUrl, refreshUrl);

      const result = await WebBrowser.openBrowserAsync(url);

      if (result.type === "cancel" || result.type === "dismiss") {
        await refreshStatus();
      }
    } catch (error) {
      console.error("Error in update-stripe-info:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kunde inte öppna Stripe-länk",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      await refreshClubData();

      queryClient.invalidateQueries({ queryKey: ["stripe-connect-status"] });
      queryClient.invalidateQueries({ queryKey: ["club"] });

      setFeedback({
        type: "success",
        message: "Status uppdaterad",
      });
    } catch (error) {
      console.error("Error refreshing status:", error);
      setFeedback({
        type: "error",
        message: "Kunde inte uppdatera status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      {status?.connected ? (
        <View>
          {/* Connected Status */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="text-textPrimary text-base font-semibold">
                Stripe Ansluten
              </Text>
              <Text className="text-textSecondary text-sm">
                Konto-ID: {status.accountId?.slice(-8)}
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center">
              <CheckCircle2 size={20} color="#10B981" />
            </View>
          </View>

          {/* KYC STATUS - IMPROVED */}
          {status.payoutsEnabled ? (
            <View className="mb-4 bg-green-500/10 rounded-xl px-4 py-3 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center mr-3">
                <CheckCircle2 size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-accentGreen text-sm font-semibold">
                  Verifierad
                </Text>
                <Text className="text-accentGreen text-xs mt-0.5">
                  Redo att ta emot utbetalningar
                </Text>
              </View>
            </View>
          ) : status.kycStatus === "needs_input" ? (
            <View className="mb-4 bg-accentYellow/10 rounded-xl px-4 py-3 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-accentYellow/20 items-center justify-center mr-3">
                <AlertCircle size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-accentYellow text-sm font-semibold">
                  Mer information krävs
                </Text>
                <Text className="text-accentYellow text-xs mt-0.5">
                  Klicka på 'Uppdatera Information' nedan
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-4 bg-primary/10 rounded-xl px-4 py-3 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Clock size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold">
                  Verifiering pågår
                </Text>
                <Text className="text-primary text-xs mt-0.5">
                  Vi granskar din information
                </Text>
              </View>
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View className="space-y-2">
            <TouchableOpacity
              className="bg-primary rounded-xl py-3 px-4"
              onPress={handleUpdateInfo}
              disabled={isLoading}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-textPrimary text-sm font-medium ml-2">
                    Laddar...
                  </Text>
                </View>
              ) : (
                <Text className="text-textPrimary text-sm font-medium text-center">
                  Uppdatera Information
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          {/* NOT CONNECTED */}
          <View className="mb-4 bg-accentYellow/10 rounded-xl px-4 py-3 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-accentYellow/20 items-center justify-center mr-3">
              <AlertCircle size={20} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-accentYellow text-sm font-semibold">
                Inte Ansluten
              </Text>
              <Text className="text-accentYellow text-xs mt-0.5">
                Anslut till Stripe för att ta emot utbetalningar
              </Text>
            </View>
          </View>

          {!canConnect && (
            <View className="mb-4 bg-accentRed/10 rounded-xl px-4 py-3 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-accentRed/20 items-center justify-center mr-3">
                <XCircle size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-accentRed text-sm font-semibold mb-1">
                  Information saknas
                </Text>
                {missingInfo.map((info, i) => (
                  <Text key={i} className="text-accentRed text-xs">
                    • {info}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* CONNECT BUTTON */}
          <TouchableOpacity
            className={`rounded-xl py-3 px-4 ${
              canConnect ? "bg-primary" : "bg-surface"
            }`}
            onPress={handleConnect}
            disabled={isLoading || !canConnect}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-textPrimary text-sm font-medium ml-2">
                  Öppnar Stripe...
                </Text>
              </View>
            ) : (
              <Text className="text-textPrimary text-sm font-medium text-center">
                Anslut till Stripe
              </Text>
            )}
          </TouchableOpacity>

          {canConnect && (
            <Text className="text-textSecondary text-xs text-center mt-3">
              Du kommer att dirigeras till Stripe för att slutföra
              verifieringsprocessen
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
