import React from 'react';
import { Modal } from 'react-native';

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
}

export function FullScreenModal({
  visible,
  onClose,
  children,
  animationType = 'slide',
  presentationStyle = 'pageSheet',
}: FullScreenModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      {children}
    </Modal>
  );
}
