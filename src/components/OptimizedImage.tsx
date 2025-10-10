import { getSimplifiedImageUrl, isIOSSimulator } from "@/src/utils/imageUtils";
import { AlertCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, ImageProps, Platform, Text, View } from "react-native";

interface OptimizedImageProps extends ImageProps {
  fallbackText?: string;
  showDebugInfo?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallbackText,
  showDebugInfo = __DEV__,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [optimizedSource, setOptimizedSource] = useState(source);

  // Don't automatically modify URLs - start with the original source
  useEffect(() => {
    setOptimizedSource(source);
    setError(false);
    setLoading(true);
    setRetryCount(0);
  }, [source]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (showDebugInfo) {
      const uri =
        typeof optimizedSource === "object" && "uri" in optimizedSource
          ? optimizedSource.uri
          : "unknown";
      const originalUri =
        typeof source === "object" && "uri" in source ? source.uri : "unknown";
      // Image loaded successfully
    }
  };

  const handleError = (errorEvent: any) => {
    setLoading(false);
    setError(true);

    if (showDebugInfo) {
      // Image load error occurred
    }

    // Auto-retry with fallback for iOS Simulator
    if (isIOSSimulator() && retryCount === 0) {
      setTimeout(() => {
        setRetryCount(1);
        setLoading(true);
        setError(false);

        // Try with simplified URL (no query params) as this often fixes iOS Simulator issues
        if (typeof source === "object" && "uri" in source && source.uri) {
          const simplifiedUrl = getSimplifiedImageUrl(source.uri);
          setOptimizedSource({ ...source, uri: simplifiedUrl });
        }
      }, 1000);
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  if (error && !loading) {
    return (
      <View
        style={[
          style,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f3f4f6",
          },
        ]}
      >
        <AlertCircle size={24} color="#ef4444" />
        {fallbackText && (
          <Text
            style={{
              fontSize: 10,
              color: "#6b7280",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {fallbackText}
          </Text>
        )}
        {showDebugInfo && (
          <Text
            style={{
              fontSize: 8,
              color: "#ef4444",
              textAlign: "center",
              marginTop: 2,
            }}
          >
            Load failed (retry: {retryCount})
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        {...props}
        source={optimizedSource}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        // Add these props for better iOS Simulator compatibility
        resizeMethod="scale"
        fadeDuration={0}
        // Additional iOS Simulator specific props
        {...(Platform.OS === "ios" &&
          __DEV__ && {
            defaultSource: undefined,
            loadingIndicatorSource: undefined,
          })}
      />

      {showDebugInfo && !loading && !error && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 2,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 8,
              textAlign: "center",
            }}
          ></Text>
        </View>
      )}
    </View>
  );
};
