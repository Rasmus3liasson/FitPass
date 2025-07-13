import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, View } from "react-native";

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
    return <View className="flex-1 justify-center items-center"><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View className="flex-1 justify-center items-center"><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background p-4">
        <Text className="text-white text-2xl font-bold mb-4 text-center">Scan QR Code</Text>
        <View className="flex-1 rounded-2xl overflow-hidden mb-4 bg-black">
          <Camera
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            className="flex-1"
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