import React, { createContext, useContext } from "react";
import { FeedbackComponent } from "../components/FeedbackComponent";
import { useFeedback } from "./useFeedback";

interface GlobalFeedbackContextType {
  showSuccess: (title: string, message?: string, options?: any) => void;
  showError: (title: string, message?: string, options?: any) => void;
  showWarning: (title: string, message?: string, options?: any) => void;
  showInfo: (title: string, message?: string, options?: any) => void;
  showFeedback: (config: any) => void;
  hideFeedback: () => void;
}

const GlobalFeedbackContext = createContext<
  GlobalFeedbackContextType | undefined
>(undefined);

export const GlobalFeedbackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    feedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showFeedback,
    hideFeedback,
  } = useFeedback();

  return (
    <GlobalFeedbackContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showFeedback,
        hideFeedback,
      }}
    >
      {children}
      <FeedbackComponent
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        buttonText={feedback.buttonText}
        onClose={hideFeedback}
        onButtonPress={feedback.onButtonPress}
        autoClose={feedback.autoClose}
        autoCloseDelay={feedback.autoCloseDelay}
      />
    </GlobalFeedbackContext.Provider>
  );
};

export const useGlobalFeedback = () => {
  const context = useContext(GlobalFeedbackContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalFeedback must be used within a GlobalFeedbackProvider"
    );
  }
  return context;
};
