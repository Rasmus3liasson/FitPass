import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert("QR Code Scanned", `Type: ${type}\nData: ${data}`);
    // TODO: Implement check-in logic for the club here
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#18181b', padding: 16 }}>
        <Text style={styles.header}>Scan QR Code</Text>
        <View style={styles.cameraContainer}>
          <Camera
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.camera}
            ratio="16:9"
          />
        </View>
        {scanned && (
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  cameraContainer: { flex: 1, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  camera: { flex: 1 },
}); 