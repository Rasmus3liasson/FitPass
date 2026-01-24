import { useState } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'destructive' | 'warning';
}

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'default' | 'destructive' | 'warning'
  ) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: type || 'default',
    });
  };

  const hideAlert = () => {
    setAlertConfig(null);
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    isVisible: !!alertConfig,
  };
}
