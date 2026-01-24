import colors from "@shared/constants/custom-colors";
import Constants from "expo-constants";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Sentry } from "../config/sentry";

export default function SentryTestScreen() {
  const [status, setStatus] = useState("");

  const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
  const environment = Constants.expoConfig?.extra?.environment;

  const testError = () => {
    try {
      setStatus("Triggering error...");
      throw new Error("Test Error - This is a test error from Expo app");
    } catch (error) {
      Sentry.captureException(error);
      setStatus("✅ Error sent to Sentry! Check your Sentry dashboard.");
    }
  };

  const testMessage = () => {
    setStatus("Sending test message...");
    Sentry.captureMessage("Test message from Expo app", "info");
    setStatus("✅ Message sent to Sentry! Check your Sentry dashboard.");
  };

  const testBreadcrumb = () => {
    setStatus("Adding breadcrumb and triggering error...");
    Sentry.addBreadcrumb({
      category: "test",
      message: "User pressed test button",
      level: "info",
    });

    try {
      throw new Error("Test Error with Breadcrumb");
    } catch (error) {
      Sentry.captureException(error);
      setStatus("✅ Error with breadcrumb sent! Check Sentry for breadcrumb trail.");
    }
  };

  const testNativeCrash = () => {
    setStatus("Triggering native crash...");
    Sentry.nativeCrash();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sentry Test Screen</Text>
        <Text style={styles.subtitle}>Expo Mobile App</Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Configuration Status</Text>
          <Text style={styles.statusText}>
            DSN Configured: {sentryDsn ? "✅ Yes" : "❌ No"}
          </Text>
          <Text style={styles.statusText}>
            Environment: {environment || "development"}
          </Text>
          <Text style={styles.statusText}>
            Dev Mode: {__DEV__ ? "Yes (errors not sent)" : "No"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.errorButton]}
            onPress={testError}
          >
            <Text style={styles.buttonText}>Test Error Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.messageButton]}
            onPress={testMessage}
          >
            <Text style={styles.buttonText}>Test Message Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.breadcrumbButton]}
            onPress={testBreadcrumb}
          >
            <Text style={styles.buttonText}>Test Breadcrumb + Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.crashButton]}
            onPress={testNativeCrash}
          >
            <Text style={styles.buttonText}>⚠️ Test Native Crash</Text>
          </TouchableOpacity>
        </View>

        {status ? (
          <View
            style={[
              styles.statusMessage,
              {
                backgroundColor: status.includes("✅")
                  ? "#d1fae5"
                  : "#fef3c7",
                borderColor: status.includes("✅") ? "#10b981" : "#f59e0b",
              },
            ]}
          >
            <Text style={styles.statusMessageText}>{status}</Text>
          </View>
        ) : null}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📝 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Tap any button above to test Sentry integration
          </Text>
          <Text style={styles.instructionsText}>
            2. Open your Sentry dashboard to see captured events
          </Text>
          <Text style={styles.instructionsText}>
            3. Note: In dev mode, errors are logged but not sent
          </Text>
          <Text style={styles.instructionsText}>
            4. Build a release version to test actual reporting
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 30,
  },
  statusBox: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  errorButton: {
    backgroundColor: "#dc2626",
  },
  messageButton: {
    backgroundColor: "#2563eb",
  },
  breadcrumbButton: {
    backgroundColor: "#7c3aed",
  },
  crashButton: {
    backgroundColor: "#ea580c",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statusMessage: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  statusMessageText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  instructions: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
});
