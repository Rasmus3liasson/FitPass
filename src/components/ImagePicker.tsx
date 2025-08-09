import { useImageUpload } from "@/src/hooks/useImageUpload";
import { isLocalFileUri } from "@/src/utils/imageUpload";
import * as ImagePickerLib from "expo-image-picker";
import { AlertCircle, Plus, Upload, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmationModal } from "./ConfirmationModal";
import { OptimizedImage } from "./OptimizedImage";

interface ImagePickerProps {
  value: string[];
  onChange: (val: string[]) => void;
  fullWidth?: boolean;
  autoUpload?: boolean;
  maxImages?: number;
  bucket?: string;
  folder?: string;
  showProgress?: boolean;
  allowReordering?: boolean;
}

export default function ImagePicker({
  value,
  onChange,
  fullWidth = false,
  autoUpload = true,
  maxImages = 6,
  bucket = "images",
  folder = "user-uploads",
  showProgress = true,
  allowReordering = false,
}: ImagePickerProps) {
  const images = autoUpload
    ? value || []
    : (value || []).filter((uri) => !isLocalFileUri(uri));
  const [localUploading, setLocalUploading] = useState<{
    [key: number]: boolean;
  }>({});
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const { uploadSingle, uploading } = useImageUpload({
    bucket,
    folder,
    autoUpload,
    showToasts: true,
  });

  const pickImage = async (replaceIdx?: number) => {
    // Check if we've reached the maximum number of images
    if (replaceIdx === undefined && images.length >= maxImages) {
      Alert.alert(
        "Maximum Images Reached",
        `You can only add up to ${maxImages} images.`,
        [{ text: "OK" }]
      );
      return;
    }

    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.7,
      allowsEditing: true,
      aspect: fullWidth ? undefined : [1, 1],
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      if (autoUpload && isLocalFileUri(uri)) {
        const targetIdx = replaceIdx !== undefined ? replaceIdx : images.length;
        setLocalUploading((prev) => ({ ...prev, [targetIdx]: true }));

        try {
          const uploadResult = await uploadSingle(uri);

          if (uploadResult.success && uploadResult.url) {
            if (replaceIdx !== undefined) {
              const newImages = [...images];
              newImages[replaceIdx] = uploadResult.url;
              onChange(newImages);
            } else {
              const newImages = [...images, uploadResult.url];
              onChange(newImages);
            }
          } else {
            console.warn("Upload failed, not saving local image");
          }
        } catch (error) {
          console.warn("Upload failed, not saving local image");
        } finally {
          setLocalUploading((prev) => ({ ...prev, [targetIdx]: false }));
        }
      } else {
        if (!isLocalFileUri(uri)) {
          if (replaceIdx !== undefined) {
            const newImages = [...images];
            newImages[replaceIdx] = uri;
            onChange(newImages);
          } else {
            onChange([...images, uri]);
          }
        } else {
          console.warn("Local images not supported without auto-upload");
        }
      }
    }
  };

  const handleRemove = (idx: number) => {
    setRemoveIndex(idx);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    if (removeIndex !== null) {
      const newImages = images.filter((_, i) => i !== removeIndex);
      onChange(newImages);
      setRemoveIndex(null);
    }
  };

  const moveImage = (from: number, to: number) => {
    if (!allowReordering) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(from, 1);
    newImages.splice(to, 0, movedImage);
    onChange(newImages);
  };

  const displaySlots = Math.min(maxImages, fullWidth ? 4 : 6);
  const slots = Array.from({ length: displaySlots }, (_, i) =>
    images[i] === undefined ? null : images[i]
  );

  const getImageStatusIcon = (img: string | null, idx: number) => {
    if (!img) return null;

    if (localUploading[idx] || uploading) {
      return <ActivityIndicator size="small" color="#6366F1" />;
    }

    if (autoUpload && !isLocalFileUri(img)) {
      return <Upload size={12} color="#22c55e" />;
    }

    if (isLocalFileUri(img)) {
      return <AlertCircle size={12} color="#f59e0b" />;
    }

    return null;
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-end mb-2">
        <Text className="text-textSecondary text-sm">
          {images.length}/{maxImages}
        </Text>
      </View>

      <View className={fullWidth ? "flex-row w-full" : "flex-row flex-wrap"}>
        {slots.map((img, idx) => {
          return (
            <View
              key={idx}
              className={
                fullWidth
                  ? "relative flex-1 aspect-square bg-surface rounded-lg mr-3 mb-0 items-center justify-center border border-borderGray"
                  : "relative w-20 h-20 bg-surface rounded-lg mr-3 mb-3 items-center justify-center border border-borderGray"
              }
              style={fullWidth ? { maxWidth: undefined } : {}}
            >
              <TouchableOpacity
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => pickImage(img ? idx : undefined)}
                activeOpacity={0.8}
                disabled={localUploading[idx] || uploading}
              >
                {localUploading[idx] || (uploading && !img) ? (
                  <View className="items-center justify-center">
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text className="text-xs text-primary mt-1">
                      {localUploading[idx] ? "Uploading..." : "Processing..."}
                    </Text>
                  </View>
                ) : img ? (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <OptimizedImage
                      source={{ uri: img }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 8,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="items-center">
                    <Plus size={32} color="#6366F1" />
                  </View>
                )}
              </TouchableOpacity>

              {img && !localUploading[idx] && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 10,
                    padding: 2,
                    zIndex: 2,
                  }}
                  onPress={() => handleRemove(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              )}

              {img && showProgress && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: 2,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 8,
                    padding: 2,
                    zIndex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                ></View>
              )}
            </View>
          );
        })}
      </View>

      <ConfirmationModal
        visible={showRemoveModal}
        title="Remove Image"
        message="Are you sure you want to remove this image?"
        confirmText="Remove"
        confirmStyle="destructive"
        onConfirm={confirmRemove}
        onClose={() => {
          setShowRemoveModal(false);
          setRemoveIndex(null);
        }}
      />
    </View>
  );
}
