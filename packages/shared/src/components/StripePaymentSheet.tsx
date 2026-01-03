import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    Check,
    CreditCard,
    Shield,
    Smartphone,
    Sparkles,
    X,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useGlobalFeedback } from "../hooks/useGlobalFeedback";
import { useInvalidatePaymentMethods } from "../hooks/usePaymentMethods";

interface StripePaymentSheetProps {
  onPaymentMethodAdded: () => void;
  onClose: () => void;
  customerId?: string | null;
  darkMode?: boolean;
}

// Payment Sheet Component
function PaymentSheetContent({
  onPaymentMethodAdded,
  onClose,
  customerId,
  darkMode = true,
}: StripePaymentSheetProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const invalidatePaymentMethods = useInvalidatePaymentMethods();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();

  const setupPaymentSheet = async () => {
    try {
      setLoading(true);

      if (!user?.id || !user?.email) {
        showError("Fel", "Användaruppgifter saknas");
        return;
      }

      // Call your backend to create a Setup Intent for saving payment methods
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/get-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Setup Intent Error:", errorText);

        // Parse error to provide better user feedback
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        // Handle specific error cases
        if (
          response.status === 500 &&
          errorData.error?.includes("No such customer")
        ) {

          // Try to recover by forcing creation of new customer
          const recoveryResponse = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/get-customer`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email,
              }),
            }
          );

          if (!recoveryResponse.ok) {
            const recoveryErrorText = await recoveryResponse.text();
            throw new Error(
              "Kunde inte återställa betalningskonto. Kontakta support."
            );
          }
          // Use the recovery response data
          const recoveryData = await recoveryResponse.json();
          const { setupIntent, ephemeralKey, customer } = recoveryData;

          // Initialize the Payment Sheet with recovery data
          const { error } = await initPaymentSheet({
            merchantDisplayName: process.env.APP_NAME || "",
            customerId: customer.id,
            customerEphemeralKeySecret: ephemeralKey.secret,
            setupIntentClientSecret: setupIntent.client_secret,
            allowsDelayedPaymentMethods: true,
            allowsRemovalOfLastSavedPaymentMethod: false,
            defaultBillingDetails: {
              address: {
                country: "SE", // Sverige som standard
              },
            },
            appearance: darkMode
              ? {
                  colors: {
                    primary: "#6366f1",
                    background: "#1f2937",
                    componentBackground: "#374151",
                    componentBorder: "#4b5563",
                    componentDivider: "#6b7280",
                    primaryText: "#ffffff",
                    secondaryText: "#d1d5db",
                    componentText: "#ffffff",
                    placeholderText: "#9ca3af",
                  },
                  shapes: {
                    borderRadius: 16,
                    borderWidth: 1,
                  },
                  primaryButton: {
                    colors: {
                      background: "#6366f1",
                      text: "#ffffff",
                    },
                  },
                }
              : undefined,
            returnURL: `${process.env.APP_URL}://stripe-redirect`,
          });

          if (error) {
            showError("Fel", "Kunde inte initiera betalning");
            return;
          }

          // Present the Payment Sheet
          const { error: paymentError } = await presentPaymentSheet();

          if (paymentError) {
            if (paymentError.code !== "Canceled") {
              // Check for specific error types to give better feedback
              let errorMessage = paymentError.message;

              if (
                paymentError.message?.includes("duplicate") ||
                paymentError.message?.includes("already exists")
              ) {
                errorMessage =
                  "Detta kort har redan lagts till. Försök med ett annat kort.";
              } else if (paymentError.message?.includes("card_declined")) {
                errorMessage =
                  "Kortet avvisades. Kontrollera dina kortuppgifter.";
              }

              showError("Fel", errorMessage);
            }
            return;
          }

          // Success! Payment method was saved
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Try to sync payment methods
          try {
            const syncResponse = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${user.id}/sync-payment-methods`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: user.email,
                }),
              }
            );

            // Sync errors are non-critical, just log
            if (!syncResponse.ok) {
              console.warn("Payment method sync failed");
            }
          } catch (syncError) {
            console.warn("Could not sync payment methods");
          }

          if (user?.id) {
            invalidatePaymentMethods(user.id);
          }
          onPaymentMethodAdded();
          showSuccess("Betalningsmetod sparad!", "Din betalningsmetod har lagts till framgångsrikt.");
          onClose();
          return; // Exit early since we handled recovery successfully
        }

        throw new Error(
          errorData.error || "Misslyckades med att skapa setup intent"
        );
      }

      // Normal flow - parse the original response
      const responseData = await response.json();

      const { setupIntent, ephemeralKey, customer } = responseData;

      // Initialize the Payment Sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: process.env.APP_NAME || "",
        customerId: customer.id,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        allowsRemovalOfLastSavedPaymentMethod: false,
        defaultBillingDetails: {
          address: {
            country: "SE", // Sverige som standard
          },
        },
        appearance: darkMode
          ? {
              colors: {
                primary: "#6366f1",
                background: "#1f2937",
                componentBackground: "#374151",
                componentBorder: "#4b5563",
                componentDivider: "#6b7280",
                primaryText: "#ffffff",
                secondaryText: "#d1d5db",
                componentText: "#ffffff",
                placeholderText: "#9ca3af",
              },
              shapes: {
                borderRadius: 16,
                borderWidth: 1,
              },
              primaryButton: {
                colors: {
                  background: "#6366f1",
                  text: "#ffffff",
                },
              },
            }
          : undefined,
        returnURL: `${process.env.APP_URL}://stripe-redirect`,
      });

      if (error) {
        showError("Fel", "Kunde inte initiera betalning");
        return;
      }

      // Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== "Canceled") {
          // Check for specific error types to give better feedback
          let errorMessage = paymentError.message;

          if (
            paymentError.message?.includes("duplicate") ||
            paymentError.message?.includes("already exists")
          ) {
            errorMessage =
              "Detta kort har redan lagts till. Försök med ett annat kort.";
          } else if (paymentError.message?.includes("card_declined")) {
            errorMessage = "Kortet avvisades. Kontrollera dina kortuppgifter.";
          }

          showError("Fel", errorMessage);
        }
        return;
      }

      // Success! Payment method was saved
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Try to sync payment methods
      try {
        await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${user.id}/sync-payment-methods`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
            }),
          }
        );
      } catch (syncError) {
        // Sync errors are non-critical
      }

      if (user?.id) {
        invalidatePaymentMethods(user.id);
      }
      onPaymentMethodAdded();
      showSuccess("Betalningsmetod sparad!", "Din betalningsmetod har lagts till framgångsrikt.");
      onClose();
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMessage = "Kunde inte ladda betalningsalternativ";

      if (
        error.message?.includes("No such customer") ||
        error.message?.includes("betalningskonto behöver återställas")
      ) {
        errorMessage =
          "Ditt betalningskonto behöver konfigureras. Försök igen eller kontakta support.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Nätverksfel. Kontrollera din internetanslutning och försök igen.";
      } else if (error.message?.includes("setup intent")) {
        errorMessage = "Kunde inte förbereda betalning. Försök igen.";
      }

      showError("Fel", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-background" : "bg-white"}`}
      edges={["top", "bottom"]}
    >
      {/* Modern Header */}
      <View className="relative">
        <LinearGradient
          colors={darkMode ? ["#1f2937", "#111827"] : ["#f8fafc", "#e2e8f0"]}
          className="px-6 py-8"
        >
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 items-center justify-center z-10"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <X size={20} color={darkMode ? "#ffffff" : "#64748b"} />
          </TouchableOpacity>

          <View className="items-center pt-4">
            <View
              className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4"
              style={{
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <CreditCard size={28} color="#6366f1" />
            </View>
            <Text
              className={`text-3xl font-bold mb-3 ${
                darkMode ? "text-textPrimary" : "text-gray-900"
              }`}
            >
              Lägg till betalningsmetod
            </Text>
            <Text
              className={`text-center text-base leading-relaxed px-4 ${
                darkMode ? "text-textSecondary" : "text-gray-600"
              }`}
            >
              Säker kortregistrering med Stripes betrodda plattform
            </Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Development Test Cards */}
        {__DEV__ && (
          <View
            className={`rounded-2xl p-6 mb-6 border ${
              darkMode
                ? "bg-amber-900/20 border-amber-600/30"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <Sparkles size={20} color="#f59e0b" />
              <Text
                className={`font-bold ml-2 ${
                  darkMode ? "text-amber-400" : "text-amber-800"
                }`}
              >
                🧪 Utvecklingsläge - Testkort
              </Text>
            </View>
            <Text
              className={`text-sm mb-4 ${
                darkMode ? "text-amber-300" : "text-amber-700"
              }`}
            >
              Använd dessa testkort (använd inte riktiga kortuppgifter):
            </Text>
            <View className="space-y-2">
              <View className="bg-black/10 rounded-lg p-3">
                <Text
                  className={`text-sm font-mono font-semibold ${
                    darkMode ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  Visa: 4242 4242 4242 4242
                </Text>
              </View>
              <View className="bg-black/10 rounded-lg p-3">
                <Text
                  className={`text-sm font-mono font-semibold ${
                    darkMode ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  Mastercard: 5555 5555 5555 4444
                </Text>
              </View>
              <Text
                className={`text-xs font-mono mt-2 ${
                  darkMode ? "text-amber-400" : "text-amber-700"
                }`}
              >
                CVC: 123 • Datum: 12/34
              </Text>
            </View>
          </View>
        )}

        {/* Payment Options Info */}
        <View
          className={`rounded-2xl p-6 mb-6 border ${
            darkMode
              ? "bg-green-900/20 border-green-600/30"
              : "bg-green-50 border-green-200"
          }`}
        >
          <View className="flex-row items-center mb-4">
            <CreditCard size={20} color="#10b981" />
            <Text
              className={`font-bold ml-2 ${
                darkMode ? "text-green-400" : "text-green-800"
              }`}
            >
              💳 Betalningsalternativ
            </Text>
          </View>
          <Text
            className={`text-sm mb-4 ${
              darkMode ? "text-green-300" : "text-green-700"
            }`}
          >
            Stripe Payment Sheet inkluderar automatiskt:
          </Text>
          <View className="space-y-2">
            {[
              "Kort (Visa, Mastercard, Amex)",
              "Apple Pay (iOS)",
              "Klarna (Sverige)",
              "Andra lokala betalningsmetoder",
            ].map((option, index) => (
              <View key={index} className="flex-row items-center">
                <Check size={16} color="#10b981" />
                <Text
                  className={`ml-2 text-sm ${
                    darkMode ? "text-green-300" : "text-green-700"
                  }`}
                >
                  {option}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Security Info */}
        <View
          className={`rounded-2xl p-6 mb-8 border ${
            darkMode
              ? "bg-blue-900/20 border-blue-600/30"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <View className="flex-row items-center mb-4">
            <Shield size={20} color="#3b82f6" />
            <Text
              className={`font-bold ml-2 ${
                darkMode ? "text-blue-400" : "text-blue-800"
              }`}
            >
              🔒 Säker betalning
            </Text>
          </View>
          <Text
            className={`text-sm leading-relaxed ${
              darkMode ? "text-blue-300" : "text-blue-700"
            }`}
          >
            Dina kortuppgifter hanteras säkert av Stripe och sparas inte på våra
            servrar. All data krypteras med bankstandard säkerhet.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={setupPaymentSheet}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={loading ? ["#9ca3af", "#6b7280"] : ["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              paddingHorizontal: 24,
            }}
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-bold text-lg ml-3">
                  Laddar...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Smartphone size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Lägg till betalningsmetod
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={onClose}
          className="mt-6 py-4 px-6 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`font-semibold ${
              darkMode ? "text-textSecondary" : "text-gray-600"
            }`}
          >
            Avbryt
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main component with Stripe Provider
export default function StripePaymentSheet({
  onPaymentMethodAdded,
  onClose,
  customerId,
  darkMode = true,
}: StripePaymentSheetProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <SafeAreaView
        className={`flex-1 justify-center items-center p-6 ${
          darkMode ? "bg-background" : "bg-white"
        }`}
        edges={["top", "bottom"]}
      >
        <View className="items-center">
          <Text
            className={`text-center text-lg font-semibold mb-4 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            ⚠️ Konfigurationsfel
          </Text>
          <Text
            className={`text-center ${
              darkMode ? "text-textSecondary" : "text-gray-600"
            }`}
          >
            Stripe-konfiguration saknas. Kontrollera dina miljövariabler.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <PaymentSheetContent
        onPaymentMethodAdded={onPaymentMethodAdded}
        onClose={onClose}
        customerId={customerId}
        darkMode={darkMode}
      />
    </StripeProvider>
  );
}
