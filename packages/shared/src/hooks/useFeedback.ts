import { useState } from 'react';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackState {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryButtonPress?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    type: 'info',
    title: '',
  });

  const showFeedback = (config: Omit<FeedbackState, 'visible'>) => {
    setFeedback({
      ...config,
      visible: true,
    });
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    showFeedback({
      type: 'success',
      title,
      message,
      autoClose: false, // Changed to false
      buttonText: 'OK',
      ...options,
    });
  };

  const showError = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    console.log('showError called with:', { title, message, options });
    showFeedback({
      type: 'error',
      title,
      message,
      autoClose: false, // Changed to false
      buttonText: 'OK',
      ...options,
    });
  };

  const showWarning = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    console.log('showWarning called with:', { title, message, options });
    showFeedback({
      type: 'warning',
      title,
      message,
      autoClose: false, // Changed to false
      buttonText: 'OK',
      ...options,
    });
  };

  const showInfo = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    console.log('showInfo called with:', { title, message, options });
    showFeedback({
      type: 'info',
      title,
      message,
      autoClose: false, // Changed to false
      buttonText: 'OK',
      ...options,
    });
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
