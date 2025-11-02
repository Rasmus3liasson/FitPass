import { useState } from "react";

type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackState {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    type: "info",
    title: "",
  });

  const showFeedback = (config: Omit<FeedbackState, "visible">) => {
    setFeedback({
      ...config,
      visible: true,
    });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    showFeedback({
      type: "success",
      title,
      message,
      autoClose: true,
      autoCloseDelay: 3000,
      ...options,
    });
  };

  const showError = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    showFeedback({
      type: "error",
      title,
      message,
      ...options,
    });
  };

  const showWarning = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    showFeedback({
      type: "warning",
      title,
      message,
      ...options,
    });
  };

  const showInfo = (title: string, message?: string, options?: Partial<FeedbackState>) => {
    showFeedback({
      type: "info",
      title,
      message,
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