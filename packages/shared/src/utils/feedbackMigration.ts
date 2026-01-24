// Migration helper: Replace Toast calls with feedback calls
// Usage: Import this and replace Toast.show calls with the appropriate feedback method

import { useGlobalFeedback } from '../hooks/useGlobalFeedback';

export const useFeedbackMigration = () => {
  const { showSuccess, showError, showWarning, showInfo } = useGlobalFeedback();

  // Helper to convert Toast.show calls to feedback calls
  const migrateToastCall = (toastConfig: {
    type: 'success' | 'error' | 'info' | 'warning';
    text1: string;
    text2?: string;
    onPress?: () => void;
    autoHide?: boolean;
    visibilityTime?: number;
  }) => {
    const { type, text1, text2, onPress, autoHide = true, visibilityTime = 3000 } = toastConfig;

    const options = {
      autoClose: autoHide,
      autoCloseDelay: visibilityTime,
      onButtonPress: onPress,
    };

    switch (type) {
      case 'success':
        showSuccess(text1, text2, options);
        break;
      case 'error':
        showError(text1, text2, options);
        break;
      case 'warning':
        showWarning(text1, text2, options);
        break;
      case 'info':
        showInfo(text1, text2, options);
        break;
    }
  };

  return { migrateToastCall, showSuccess, showError, showWarning, showInfo };
};
