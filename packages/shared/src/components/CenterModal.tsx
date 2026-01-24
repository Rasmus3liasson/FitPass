import React from 'react';
import { Modal, TouchableOpacity } from 'react-native';

interface CenterModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  backgroundColor?: string;
  maxWidth?: string;
}

export function CenterModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
  backgroundColor = 'bg-surface',
  maxWidth = 'max-w-md',
}: CenterModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center px-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          className={`${backgroundColor} rounded-2xl ${maxWidth} w-full`}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
