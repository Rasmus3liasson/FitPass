import React from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SwipeableModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    snapPoint?: number;
    backdropOpacity?: number;
}

export const SwipeableModal: React.FC<SwipeableModalProps> = ({
    visible,
    onClose,
    children,
    snapPoint = 0.9,
    backdropOpacity = 0.5,
}) => {
    // Simplified version for Expo Go - no gestures to avoid native module mismatches
    const modalHeight = SCREEN_HEIGHT * snapPoint;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
                        }}
                    />
                </TouchableWithoutFeedback>
                
                <View
                    style={{
                        height: modalHeight,
                        backgroundColor: "white",
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 5,
                        elevation: 5,
                    }}
                >
                    <View
                        style={{
                            alignItems: "center",
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: "#E5E7EB",
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                backgroundColor: "#D1D5DB",
                                borderRadius: 2,
                            }}
                        />
                    </View>
                    
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        bounces={false}
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};